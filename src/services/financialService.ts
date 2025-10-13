
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

  // STUB: Tables not created yet - returning mock data
  async getInvoices(): Promise<Invoice[]> {
    console.warn('invoices table not created yet');
    return [];
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    console.warn('invoices table not created yet');
    return { 
      ...invoice, 
      id: 'mock-id', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    } as Invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    console.warn('invoices table not created yet');
    return { id, ...updates, updated_at: new Date().toISOString() } as Invoice;
  }

  async getPayments(): Promise<Payment[]> {
    console.warn('payments table not created yet');
    return [];
  }

  async createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    console.warn('payments table not created yet');
    return { ...payment, id: 'mock-id', created_at: new Date().toISOString() } as Payment;
  }

  async getBudgets(): Promise<Budget[]> {
    console.warn('budgets table not created yet');
    return [];
  }

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    console.warn('budgets table not created yet');
    return { 
      ...budget, 
      id: 'mock-id', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    } as Budget;
  }

  async getExpenses(): Promise<Expense[]> {
    console.warn('expenses table not created yet');
    return [];
  }

  async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    console.warn('expenses table not created yet');
    return { ...expense, id: 'mock-id', created_at: new Date().toISOString() } as Expense;
  }

  async approveExpense(id: string, approvedBy: string): Promise<Expense> {
    console.warn('expenses table not created yet');
    return { 
      id, 
      approved_by: approvedBy, 
      status: 'approved', 
      created_at: new Date().toISOString() 
    } as Expense;
  }
}

export const financialService = FinancialService.getInstance();
