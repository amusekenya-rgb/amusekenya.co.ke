import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Receipt, TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  totalRevenue: number;
  revenueChange: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  monthlyExpenses: number;
  expenseChange: number;
  pendingCollections: number;
  pendingCollectionsAmount: number;
  recentTransactions: Array<{
    type: 'payment' | 'expense' | 'invoice';
    description: string;
    amount: number;
  }>;
  budgets: Array<{
    category: string;
    percentage: number;
  }>;
}

const AccountsDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      const [invoicesRes, paymentsRes, expensesRes, budgetsRes, collectionsRes, lastMonthPaymentsRes, lastMonthExpensesRes] = await Promise.all([
        supabase.from('invoices' as any).select('*'),
        supabase.from('payments' as any).select('*').eq('status', 'completed'),
        supabase.from('expenses' as any).select('*'),
        supabase.from('budgets' as any).select('*').eq('status', 'active'),
        supabase.from('accounts_action_items' as any).select('*').eq('status', 'pending'),
        supabase.from('payments' as any).select('amount').eq('status', 'completed').gte('payment_date', startOfLastMonth).lte('payment_date', endOfLastMonth),
        supabase.from('expenses' as any).select('amount').gte('expense_date', startOfLastMonth).lte('expense_date', endOfLastMonth),
      ]);

      const invoices = (invoicesRes.data || []) as any[];
      const payments = (paymentsRes.data || []) as any[];
      const expenses = (expensesRes.data || []) as any[];
      const budgets = (budgetsRes.data || []) as any[];
      const collections = (collectionsRes.data || []) as any[];

      // Total revenue from completed payments
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const lastMonthRevenue = (lastMonthPaymentsRes.data || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const revenueChange = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Outstanding invoices
      const outstanding = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');

      // Monthly expenses
      const currentMonthExpenses = expenses.filter(e => e.expense_date >= startOfMonth.split('T')[0]);
      const monthlyExpenses = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const lastMonthExpenseTotal = (lastMonthExpensesRes.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const expenseChange = lastMonthExpenseTotal > 0 ? ((monthlyExpenses - lastMonthExpenseTotal) / lastMonthExpenseTotal) * 100 : 0;

      // Pending collections
      const pendingCollectionsAmount = collections.reduce((sum: number, c: any) => sum + Number(c.amount_due || 0) - Number(c.amount_paid || 0), 0);

      // Recent transactions - combine payments, expenses, and new invoices
      const recentTransactions: DashboardData['recentTransactions'] = [];
      
      payments.slice(0, 3).forEach(p => {
        const invoice = invoices.find(i => i.id === p.invoice_id);
        recentTransactions.push({
          type: 'payment',
          description: `Payment received${invoice ? ` - ${invoice.invoice_number}` : ''}`,
          amount: Number(p.amount),
        });
      });

      expenses.slice(0, 2).forEach(e => {
        recentTransactions.push({
          type: 'expense',
          description: e.description || 'Expense',
          amount: -Number(e.amount),
        });
      });

      invoices.slice(0, 2).forEach(inv => {
        if (!recentTransactions.find(t => t.description.includes(inv.invoice_number))) {
          recentTransactions.push({
            type: 'invoice',
            description: `Invoice created - ${inv.invoice_number}`,
            amount: Number(inv.total_amount),
          });
        }
      });

      // Budget utilization
      const budgetData = budgets.map((b: any) => {
        const allocated = Number(b.allocated_amount);
        const spent = Number(b.spent_amount);
        return {
          category: b.category,
          percentage: allocated > 0 ? Math.round((spent / allocated) * 100) : 0,
        };
      });

      setData({
        totalRevenue,
        revenueChange: Math.round(revenueChange * 10) / 10,
        outstandingInvoices: outstanding.length,
        outstandingAmount: outstanding.reduce((sum, i) => sum + Number(i.total_amount), 0),
        monthlyExpenses,
        expenseChange: Math.round(expenseChange * 10) / 10,
        pendingCollections: collections.length,
        pendingCollectionsAmount,
        recentTransactions: recentTransactions.slice(0, 5),
        budgets: budgetData,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Ksh ${Math.abs(amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Accounts Dashboard</h2>
          <p className="text-muted-foreground">Financial management and accounting overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Accounts Dashboard</h2>
        <p className="text-muted-foreground">Financial management and accounting overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {data.revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              {data.revenueChange >= 0 ? '+' : ''}{data.revenueChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.outstandingInvoices}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(data.outstandingAmount)} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.monthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {data.expenseChange <= 0 ? (
                <TrendingDown className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-600" />
              )}
              {data.expenseChange >= 0 ? '+' : ''}{data.expenseChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.outstandingAmount)}</div>
            <p className="text-xs text-muted-foreground">{data.outstandingInvoices} unpaid invoice{data.outstandingInvoices !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            ) : (
              <div className="space-y-4">
                {data.recentTransactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        tx.type === 'payment' ? 'bg-green-500' : 
                        tx.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-sm">{tx.description}</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.amount >= 0 ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Active budget utilization</CardDescription>
          </CardHeader>
          <CardContent>
            {data.budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active budgets configured</p>
            ) : (
              <div className="space-y-4">
                {data.budgets.map((b, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{b.category}</span>
                      <span>{b.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          b.percentage >= 90 ? 'bg-destructive' :
                          b.percentage >= 70 ? 'bg-yellow-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountsDashboard;
