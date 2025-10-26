import { supabase } from '@/integrations/supabase/client';
import { CampRegistration, CampChild } from '@/types/campRegistration';
import { Tables } from '@/integrations/supabase/types';

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
  async createRegistration(data: Omit<CampRegistration, 'id' | 'registration_number' | 'created_at' | 'updated_at'>) {
    const { data: registration, error } = await supabase
      .from('camp_registrations')
      .insert(toDb(data))
      .select()
      .single();

    if (error) throw error;
    return fromDb(registration);
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
    reference?: string
  ) {
    const updates: Partial<CampRegistration> = { payment_status: status };
    if (method) updates.payment_method = method;
    if (reference) updates.payment_reference = reference;

    return this.updateRegistration(id, updates);
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
};
