
import { supabase, isSupabaseAvailable } from './supabaseService';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  program_id: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_terms: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'mpesa' | 'other';
  payment_reference: string;
  payment_date: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface Budget {
  id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  period_start: string;
  period_end: string;
  department: string;
  status: 'active' | 'completed' | 'exceeded';
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  department: string;
  expense_date: string;
  receipt_url?: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  budget_id?: string;
  created_at: string;
  created_by: string;
}

export class FinancialService {
  private static instance: FinancialService;

  static getInstance(): FinancialService {
    if (!FinancialService.instance) {
      FinancialService.instance = new FinancialService();
    }
    return FinancialService.instance;
  }

  private checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase is not configured. Please set up your Supabase connection first.');
    }
  }

  // Invoice Management
  async getInvoices(): Promise<Invoice[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('invoices')
      .insert([invoice])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Payment Management
  async getPayments(): Promise<Payment[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('payments')
      .insert([payment])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Budget Management
  async getBudgets(): Promise<Budget[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('budgets')
      .select('*')
      .order('period_start', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('budgets')
      .insert([budget])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Expense Management
  async getExpenses(): Promise<Expense[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('expenses')
      .insert([expense])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async approveExpense(id: string, approvedBy: string): Promise<Expense> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('expenses')
      .update({ 
        status: 'approved', 
        approved_by: approvedBy 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export const financialService = FinancialService.getInstance();
