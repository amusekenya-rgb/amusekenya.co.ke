import { supabase } from '@/integrations/supabase/client';
import { CampRegistration, CampChild } from '@/types/campRegistration';
import { Tables } from '@/integrations/supabase/types';
import { financialService } from './financialService';

type DbCampRegistration = Tables<'camp_registrations'>;

// Helper to convert DB row to CampRegistration
const fromDb = (row: DbCampRegistration): CampRegistration => ({
  ...row,
  children: row.children as unknown as CampChild[],
} as CampRegistration);

// Helper to convert CampRegistration to DB format
const toDb = (data: Partial<CampRegistration>): any => ({
  ...data,
  children: data.children ? (data.children as any) : undefined,
});

export const campRegistrationService = {
  async createRegistration(
    data: Omit<CampRegistration, 'id' | 'registration_number' | 'created_at' | 'updated_at'>
  ) {
    // Generate a temporary ID for client-side use (we avoid SELECT for anon users)
    const tempId = crypto.randomUUID();

    // IMPORTANT:
    // A DB trigger is expected to generate `registration_number`, but we are currently
    // seeing frequent failures:
    //   duplicate key value violates unique constraint camp_registrations_registration_number_key
    // To keep registrations unblocked, we generate a unique registration number client-side.
    const campType = (data as any).camp_type as string | undefined;
    const prefix = (() => {
      switch (campType) {
        case 'little-forest':
          return 'LF';
        case 'day-camps':
          return 'DC';
        case 'holiday-camp':
          return 'HC';
        default:
          return 'CR';
      }
    })();

    // Short, collision-resistant token: time + random
    const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase();
    const time = Date.now().toString(36).toUpperCase();
    const registrationNumber = `${prefix}-${time}-${rand}`;

    const insertData = {
      ...toDb(data),
      id: tempId,
      // Override/bypass DB auto-generation if it is misbehaving
      registration_number: registrationNumber,
    };

    const { error } = await supabase.from('camp_registrations').insert(insertData);

    // IMPORTANT: anonymous users do not have SELECT access, so we must not request
    // returned rows here (no .select(), no .single()).
    if (error) throw error;

    // Return constructed object with temp ID for client use
    return {
      id: tempId,
      ...data,
      registration_number: registrationNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as CampRegistration;
  },

  async getRegistrationById(id: string) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async getRegistrationByQRCode(qrCode: string) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .eq('qr_code_data', qrCode)
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async getRegistrationByNumber(registrationNumber: string) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .eq('registration_number', registrationNumber)
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async getAllRegistrations(filters?: {
    campType?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase
      .from('camp_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.campType) {
      query = query.eq('camp_type', filters.campType);
    }
    if (filters?.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.map(fromDb);
  },

  async updateRegistration(id: string, updates: Partial<CampRegistration>) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .update(toDb(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async addAdminNote(id: string, note: string) {
    const { data: current } = await supabase
      .from('camp_registrations')
      .select('admin_notes')
      .eq('id', id)
      .single();

    const existingNotes = current?.admin_notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${note}`;
    const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    return this.updateRegistration(id, { admin_notes: updatedNotes });
  },

  async updatePaymentStatus(
    id: string,
    status: 'unpaid' | 'paid' | 'partial',
    method?: 'pending' | 'card' | 'mpesa' | 'cash_ground',
    reference?: string,
    options?: {
      createPaymentRecord?: boolean;
      parentName?: string;
      campType?: string;
      totalAmount?: number;
      createdBy?: string;
    }
  ) {
    const updates: Partial<CampRegistration> = { payment_status: status };
    if (method) updates.payment_method = method;
    if (reference) updates.payment_reference = reference;

    const result = await this.updateRegistration(id, updates);

    // Create unified payment record if requested and status is paid
    if (options?.createPaymentRecord && status === 'paid' && options.totalAmount) {
      try {
        await financialService.createPaymentFromRegistration({
          registrationId: id,
          registrationType: 'camp',
          source: 'camp_registration',
          customerName: options.parentName || 'Unknown',
          programName: options.campType || 'Camp',
          amount: options.totalAmount,
          paymentMethod: (method === 'pending' ? 'other' : method) || 'mpesa',
          paymentReference: reference,
          notes: 'Payment recorded from camp registration',
          createdBy: options.createdBy
        });
      } catch (error) {
        console.error('Error creating unified payment record:', error);
        // Don't throw - the registration update succeeded
      }
    }

    return result;
  },

  /**
   * Get total amount paid for a registration from the payments table.
   */
  async getAmountPaidForRegistration(registrationId: string): Promise<number> {
    const { data, error } = await (supabase as any)
      .from('payments')
      .select('amount')
      .eq('registration_id', registrationId);

    if (error) {
      console.error('Error fetching payments for registration:', error);
      return 0;
    }

    return (data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  },

  /**
   * Update payment with a specific amount paid. Auto-derives status, syncs payments table & action items.
   */
  async updatePaymentWithAmount(
    id: string,
    amountPaid: number,
    totalAmount: number,
    method?: 'pending' | 'card' | 'mpesa' | 'cash_ground',
    reference?: string,
    context?: {
      parentName?: string;
      campType?: string;
      children?: { childName: string; price: number }[];
    }
  ) {
    // Derive status
    let status: 'unpaid' | 'paid' | 'partial' = 'unpaid';
    if (amountPaid >= totalAmount) status = 'paid';
    else if (amountPaid > 0) status = 'partial';

    // 1. Update registration record
    const updates: Partial<CampRegistration> = { payment_status: status };
    if (method) updates.payment_method = method;
    if (reference) updates.payment_reference = reference;
    await this.updateRegistration(id, updates);

    // 2. Upsert payment record (delete old + insert new to avoid duplicate constraint)
    try {
      // Remove existing payments for this registration
      await (supabase as any).from('payments').delete().eq('registration_id', id).eq('source', 'camp_registration');

      if (amountPaid > 0) {
        await financialService.createPaymentFromRegistration({
          registrationId: id,
          registrationType: 'camp',
          source: 'camp_registration',
          customerName: context?.parentName || 'Unknown',
          programName: context?.campType || 'Camp',
          amount: amountPaid,
          paymentMethod: (method === 'pending' ? 'other' : method) || 'mpesa',
          paymentReference: reference,
          notes: `Admin payment update – KES ${amountPaid} of ${totalAmount}`,
        });
      }
    } catch (err) {
      console.error('Error upserting payment record:', err);
    }

    // 3. Update accounts_action_items for each child
    try {
      const childCount = context?.children?.length || 1;
      const perChildPaid = Math.round((amountPaid / childCount) * 100) / 100;
      const newItemStatus = status === 'paid' ? 'completed' : 'pending';

      for (const child of context?.children || []) {
        await (supabase as any)
          .from('accounts_action_items')
          .update({
            amount_paid: perChildPaid,
            status: newItemStatus,
          })
          .eq('registration_id', id)
          .eq('child_name', child.childName);
      }
    } catch (err) {
      console.error('Error updating action items:', err);
    }

    return { status, amountPaid };
  },

  async searchRegistrations(searchTerm: string) {
    const { data, error } = await supabase
      .from('camp_registrations')
      .select('*')
      .or(`registration_number.ilike.%${searchTerm}%,parent_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(fromDb);
  },

  async deleteRegistration(id: string) {
    // First delete related attendance records
    await supabase
      .from('camp_attendance')
      .delete()
      .eq('registration_id', id);

    // Then delete the registration
    const { error } = await supabase
      .from('camp_registrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async deleteRegistrations(ids: string[]) {
    // First delete related attendance records for all registrations
    await supabase
      .from('camp_attendance')
      .delete()
      .in('registration_id', ids);

    // Then delete all registrations
    const { error } = await supabase
      .from('camp_registrations')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return true;
  },
};
