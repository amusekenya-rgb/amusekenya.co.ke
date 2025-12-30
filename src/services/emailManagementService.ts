import { supabase } from '@/integrations/supabase/client';

export interface EmailDelivery {
  id: string;
  email: string;
  message_id: string | null;
  recipient_type: 'lead' | 'customer' | 'registration' | null;
  recipient_id: string | null;
  email_type: 'confirmation' | 'marketing' | 'transactional' | 'notification';
  subject: string | null;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam';
  postmark_data: any;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  created_at: string;
}

export interface EmailSuppression {
  id: string;
  email: string;
  suppression_type: 'bounce_hard' | 'bounce_soft' | 'spam_complaint' | 'unsubscribe' | 'manual';
  reason: string | null;
  bounce_date: string | null;
  created_at: string;
}

export interface EmailSegment {
  id: string;
  name: string;
  description: string | null;
  filters: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailHealthStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  spam: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  suppressedCount: number;
}

class EmailManagementService {
  async getEmailDeliveries(filters?: {
    status?: string;
    email_type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<EmailDelivery[]> {
    try {
      const supabaseClient = supabase as any;
      let query = supabaseClient
        .from('email_deliveries')
        .select('*')
        .order('sent_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.email_type) {
        query = query.eq('email_type', filters.email_type);
      }
      if (filters?.dateFrom) {
        query = query.gte('sent_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('sent_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as EmailDelivery[];
    } catch (error) {
      console.error('Error fetching email deliveries:', error);
      return [];
    }
  }

  async getEmailHealthStats(dateFrom?: string, dateTo?: string): Promise<EmailHealthStats> {
    try {
      const supabaseClient = supabase as any;
      let query = supabaseClient
        .from('email_deliveries')
        .select('status');

      if (dateFrom) {
        query = query.gte('sent_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('sent_at', dateTo);
      }

      const { data: deliveries } = await query;
      const { data: suppressions } = await supabaseClient
        .from('email_suppressions')
        .select('id');

      const deliveryData = (deliveries || []) as any[];
      const totalSent = deliveryData.length;
      
      // Email statuses are cumulative - an "opened" email was also "delivered"
      // So we count all emails that reached at least that stage
      const deliveredStatuses = ['delivered', 'opened', 'clicked'];
      const openedStatuses = ['opened', 'clicked'];
      
      const delivered = deliveryData.filter((d: any) => deliveredStatuses.includes(d.status)).length;
      const opened = deliveryData.filter((d: any) => openedStatuses.includes(d.status)).length;
      const clicked = deliveryData.filter((d: any) => d.status === 'clicked').length;
      const bounced = deliveryData.filter((d: any) => d.status === 'bounced').length;
      const spam = deliveryData.filter((d: any) => d.status === 'spam').length;

      return {
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        spam,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
        bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
        suppressedCount: suppressions?.length || 0
      };
    } catch (error) {
      console.error('Error fetching email health stats:', error);
      return {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        spam: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        suppressedCount: 0
      };
    }
  }

  async getEmailSuppressions(): Promise<EmailSuppression[]> {
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from('email_suppressions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EmailSuppression[];
    } catch (error) {
      console.error('Error fetching email suppressions:', error);
      return [];
    }
  }

  async addEmailSuppression(email: string, type: EmailSuppression['suppression_type'], reason?: string): Promise<boolean> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient
        .from('email_suppressions')
        .insert({
          email,
          suppression_type: type,
          reason: reason || null
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding email suppression:', error);
      return false;
    }
  }

  async removeEmailSuppression(id: string): Promise<boolean> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient
        .from('email_suppressions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing email suppression:', error);
      return false;
    }
  }

  async getEmailSegments(): Promise<EmailSegment[]> {
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from('email_segments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EmailSegment[];
    } catch (error) {
      console.error('Error fetching email segments:', error);
      return [];
    }
  }

  async createEmailSegment(name: string, description: string, filters: any): Promise<EmailSegment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const supabaseClient = supabase as any;
      
      const { data, error } = await supabaseClient
        .from('email_segments')
        .insert({
          name,
          description,
          filters,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmailSegment;
    } catch (error) {
      console.error('Error creating email segment:', error);
      return null;
    }
  }

  async updateEmailSegment(id: string, name: string, description: string, filters: any): Promise<boolean> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient
        .from('email_segments')
        .update({
          name,
          description,
          filters,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating email segment:', error);
      return false;
    }
  }

  async deleteEmailSegment(id: string): Promise<boolean> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient
        .from('email_segments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting email segment:', error);
      return false;
    }
  }
}

export const emailManagementService = new EmailManagementService();
