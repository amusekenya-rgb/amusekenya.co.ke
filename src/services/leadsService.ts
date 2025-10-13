import { supabase } from '@/integrations/supabase/client';

// Temporarily ignore type errors until tables are created
const supabaseAny = supabase as any;

export const leadsService = {
  async createLead(leadData: {
    full_name: string;
    email: string;
    phone?: string;
    program_type: string;
    program_name?: string;
    form_data?: any;
  }): Promise<any> {
    try {
      const { data, error } = await supabaseAny
        .from('leads')
        .insert([{
          ...leadData,
          status: 'new',
          source: 'website'
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating lead:', error);
      return null;
    }
  },

  async getAllLeads(): Promise<any[]> {
    try {
      const { data, error } = await supabaseAny
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  },

  async getLeadById(id: string): Promise<any> {
    try {
      const { data, error } = await supabaseAny
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching lead:', error);
      return null;
    }
  },

  async updateLead(id: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabaseAny
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error updating lead:', error);
      return null;
    }
  },

  async deleteLead(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAny
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  },

  async getLeadsByStatus(status: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAny
        .from('leads')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching leads by status:', error);
      return [];
    }
  }
};

export interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  program_type: string;
  program_name?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  notes?: string;
  form_data?: any;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
}
