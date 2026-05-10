import { supabase } from '@/integrations/supabase/client';

export type DiscountType = 'percentage' | 'fixed_amount' | 'fixed_price_per_child_day';
export type DiscountStatus = 'active' | 'revoked' | 'used' | 'expired';

export interface ClientDiscount {
  id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  discount_type: DiscountType;
  discount_value: number;
  camp_type: string | null;
  valid_from: string | null;
  valid_to: string | null;
  min_total: number | null;
  min_children: number | null;
  single_use: boolean;
  status: DiscountStatus;
  used_at: string | null;
  used_registration_id: string | null;
  used_amount: number | null;
  reason: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewClientDiscount {
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  camp_type?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  min_total?: number | null;
  min_children?: number | null;
  single_use?: boolean;
  reason?: string | null;
}

export interface DiscountApplication {
  discount: ClientDiscount;
  originalTotal: number;
  finalTotal: number;
  discountAmount: number;
  description: string;
}

const normEmail = (v?: string | null) => (v || '').trim().toLowerCase() || null;
const normPhone = (v?: string | null) => (v || '').replace(/\s|-/g, '').trim() || null;

// Anon client uses a thin wrapper around supabase to bypass generated types.
const db: any = supabase;

export const discountService = {
  async list(): Promise<ClientDiscount[]> {
    const { data, error } = await db
      .from('client_discounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ClientDiscount[];
  },

  async create(input: NewClientDiscount): Promise<ClientDiscount> {
    const payload = {
      ...input,
      client_email: normEmail(input.client_email),
      client_phone: normPhone(input.client_phone),
      single_use: input.single_use ?? true,
    };
    const { data, error } = await db
      .from('client_discounts')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as ClientDiscount;
  },

  async revoke(id: string): Promise<void> {
    const { error } = await db
      .from('client_discounts')
      .update({ status: 'revoked' })
      .eq('id', id);
    if (error) throw error;
  },

  async markEmailSent(id: string): Promise<void> {
    await db
      .from('client_discounts')
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq('id', id);
  },

  /**
   * Find the BEST applicable, currently-active discount for a client/booking.
   * Returns null if none.
   */
  async findApplicable(params: {
    email?: string;
    phone?: string;
    campType: string;
    totalBeforeDiscount: number;
    numChildren: number;
  }): Promise<DiscountApplication | null> {
    const email = normEmail(params.email);
    const phone = normPhone(params.phone);
    if (!email && !phone) return null;

    const today = new Date().toISOString().slice(0, 10);

    let query = db
      .from('client_discounts')
      .select('*')
      .eq('status', 'active');

    // email OR phone match
    const filters: string[] = [];
    if (email) filters.push(`client_email.eq.${email}`);
    if (phone) filters.push(`client_phone.eq.${phone}`);
    query = query.or(filters.join(','));

    const { data, error } = await query;
    if (error || !data) return null;

    const candidates = (data as ClientDiscount[]).filter((d) => {
      if (d.camp_type && d.camp_type !== params.campType) return false;
      if (d.valid_from && d.valid_from > today) return false;
      if (d.valid_to && d.valid_to < today) return false;
      if (d.min_total != null && params.totalBeforeDiscount < d.min_total) return false;
      if (d.min_children != null && params.numChildren < d.min_children) return false;
      return true;
    });

    if (candidates.length === 0) return null;

    // Compute discount amount for each, return the best (largest saving).
    const evaluated = candidates.map((d) => {
      const calc = computeDiscount(d, params.totalBeforeDiscount, params.numChildren);
      return { d, ...calc };
    });
    evaluated.sort((a, b) => b.discountAmount - a.discountAmount);
    const best = evaluated[0];
    if (best.discountAmount <= 0) return null;

    return {
      discount: best.d,
      originalTotal: params.totalBeforeDiscount,
      finalTotal: best.finalTotal,
      discountAmount: best.discountAmount,
      description: describeDiscount(best.d),
    };
  },

  /**
   * Mark a single-use discount as used. Safe to call from public form.
   * If discount is multi-use we simply record the latest usage timestamp.
   */
  async markUsed(discountId: string, registrationId: string, amount: number) {
    // Re-fetch to know single_use
    const { data } = await db
      .from('client_discounts')
      .select('single_use')
      .eq('id', discountId)
      .maybeSingle();

    const updates: any = {
      used_at: new Date().toISOString(),
      used_registration_id: registrationId,
      used_amount: amount,
    };
    if (data?.single_use) updates.status = 'used';

    await db.from('client_discounts').update(updates).eq('id', discountId);
  },

  async sendNotification(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.functions.invoke('send-discount-notification', {
        body: { discountId: id },
      });
      if (error) throw error;
      await this.markEmailSent(id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send email' };
    }
  },
};

export function computeDiscount(
  d: ClientDiscount,
  total: number,
  numChildren: number
): { finalTotal: number; discountAmount: number } {
  let finalTotal = total;
  if (d.discount_type === 'percentage') {
    finalTotal = Math.max(0, total * (1 - d.discount_value / 100));
  } else if (d.discount_type === 'fixed_amount') {
    finalTotal = Math.max(0, total - d.discount_value);
  } else if (d.discount_type === 'fixed_price_per_child_day') {
    // Approximate: we don't know per-child-day count here, caller may
    // provide a better estimate via numChildren only; assume original total
    // is built from variable per-day prices and clamp to value * children.
    // This branch is best handled at submission time where we know dates.
    finalTotal = Math.min(total, d.discount_value * Math.max(1, numChildren));
  }
  finalTotal = Math.round(finalTotal);
  return { finalTotal, discountAmount: Math.max(0, total - finalTotal) };
}

export function describeDiscount(d: ClientDiscount): string {
  if (d.discount_type === 'percentage') return `${d.discount_value}% off`;
  if (d.discount_type === 'fixed_amount') return `KES ${d.discount_value.toLocaleString()} off`;
  return `KES ${d.discount_value.toLocaleString()} per child/day`;
}
