import { supabase, isSupabaseAvailable } from './supabaseService';
import { Invoice, Payment, Expense, Budget, FinancialService } from './financialService';
import { campRegistrationService } from './campRegistrationService';
import { format, parseISO, differenceInDays, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const financialService = FinancialService.getInstance();

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ProfitLossData {
  revenue: {
    invoices: number;
    payments: number;
    campRegistrations: number;
    total: number;
  };
  expenses: {
    byCategory: Record<string, number>;
    total: number;
  };
  netProfit: number;
  period: DateRange;
}

export interface ARAgingItem {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  daysOverdue: number;
  agingBucket: 'current' | '1-30' | '31-60' | '61-90' | '90+';
}

export interface ARAgingSummary {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
  items: ARAgingItem[];
}

export interface DailySalesData {
  date: string;
  invoicesCreated: number;
  invoicesAmount: number;
  paymentsReceived: number;
  paymentsAmount: number;
  campRegistrations: number;
  campRevenue: number;
  totalRevenue: number;
}

export const financialReportService = {
  // Fetch all financial data for a date range
  async fetchFinancialData(dateRange: DateRange) {
    const [invoices, payments, expenses, budgets, campRegistrations] = await Promise.all([
      financialService.getInvoices(),
      financialService.getPayments(),
      financialService.getExpenses(),
      financialService.getBudgets(),
      campRegistrationService.getAllRegistrations({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      }),
    ]);

    return { invoices, payments, expenses, budgets, campRegistrations };
  },

  // Generate Profit & Loss Statement
  async generateProfitLoss(dateRange: DateRange): Promise<ProfitLossData> {
    const { invoices, payments, expenses, campRegistrations } = await this.fetchFinancialData(dateRange);

    // Filter by date range
    const filteredInvoices = invoices.filter(inv => {
      const date = parseISO(inv.created_at);
      return isWithinInterval(date, { start: dateRange.startDate, end: dateRange.endDate });
    });

    const filteredPayments = payments.filter(p => {
      const date = parseISO(p.payment_date);
      return isWithinInterval(date, { start: dateRange.startDate, end: dateRange.endDate }) && p.status === 'completed';
    });

    const filteredExpenses = expenses.filter(e => {
      const date = parseISO(e.expense_date);
      return isWithinInterval(date, { start: dateRange.startDate, end: dateRange.endDate }) && 
             (e.status === 'approved' || e.status === 'paid');
    });

    // Calculate revenue
    const invoiceRevenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const paymentRevenue = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const campRevenue = campRegistrations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + r.total_amount, 0);

    // Calculate expenses by category
    const expensesByCategory: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      const category = exp.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(exp.amount);
    });

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);
    const totalRevenue = paymentRevenue + campRevenue;

    return {
      revenue: {
        invoices: invoiceRevenue,
        payments: paymentRevenue,
        campRegistrations: campRevenue,
        total: totalRevenue,
      },
      expenses: {
        byCategory: expensesByCategory,
        total: totalExpenses,
      },
      netProfit: totalRevenue - totalExpenses,
      period: dateRange,
    };
  },

  // Generate AR Aging Report
  async generateARAgingReport(): Promise<ARAgingSummary> {
    const invoices = await financialService.getInvoices();
    const payments = await financialService.getPayments();
    const today = new Date();

    // Only unpaid/partially paid invoices
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');

    const items: ARAgingItem[] = unpaidInvoices.map(inv => {
      // Calculate paid amount for this invoice
      const invoicePayments = payments.filter(p => p.invoice_id === inv.id && p.status === 'completed');
      const paidAmount = invoicePayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceDue = Number(inv.total_amount) - paidAmount;

      const dueDate = parseISO(inv.due_date);
      const daysOverdue = differenceInDays(today, dueDate);

      let agingBucket: ARAgingItem['agingBucket'] = 'current';
      if (daysOverdue <= 0) agingBucket = 'current';
      else if (daysOverdue <= 30) agingBucket = '1-30';
      else if (daysOverdue <= 60) agingBucket = '31-60';
      else if (daysOverdue <= 90) agingBucket = '61-90';
      else agingBucket = '90+';

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        customerName: inv.customer_name,
        customerEmail: inv.customer_email || '',
        totalAmount: Number(inv.total_amount),
        paidAmount,
        balanceDue,
        dueDate: inv.due_date,
        daysOverdue: Math.max(0, daysOverdue),
        agingBucket,
      };
    }).filter(item => item.balanceDue > 0);

    // Calculate summary
    const summary: ARAgingSummary = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
      total: 0,
      items,
    };

    items.forEach(item => {
      summary.total += item.balanceDue;
      switch (item.agingBucket) {
        case 'current': summary.current += item.balanceDue; break;
        case '1-30': summary.days1to30 += item.balanceDue; break;
        case '31-60': summary.days31to60 += item.balanceDue; break;
        case '61-90': summary.days61to90 += item.balanceDue; break;
        case '90+': summary.days90plus += item.balanceDue; break;
      }
    });

    return summary;
  },

  // Generate Daily Sales Summary
  async generateDailySalesSummary(dateRange: DateRange): Promise<DailySalesData[]> {
    const { invoices, payments, campRegistrations } = await this.fetchFinancialData(dateRange);

    // Create a map for each day in range
    const dailyData: Record<string, DailySalesData> = {};
    let currentDate = new Date(dateRange.startDate);
    
    while (currentDate <= dateRange.endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      dailyData[dateKey] = {
        date: dateKey,
        invoicesCreated: 0,
        invoicesAmount: 0,
        paymentsReceived: 0,
        paymentsAmount: 0,
        campRegistrations: 0,
        campRevenue: 0,
        totalRevenue: 0,
      };
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Populate with invoice data
    invoices.forEach(inv => {
      const dateKey = format(parseISO(inv.created_at), 'yyyy-MM-dd');
      if (dailyData[dateKey]) {
        dailyData[dateKey].invoicesCreated++;
        dailyData[dateKey].invoicesAmount += Number(inv.total_amount);
      }
    });

    // Populate with payment data
    payments.filter(p => p.status === 'completed').forEach(p => {
      const dateKey = format(parseISO(p.payment_date), 'yyyy-MM-dd');
      if (dailyData[dateKey]) {
        dailyData[dateKey].paymentsReceived++;
        dailyData[dateKey].paymentsAmount += Number(p.amount);
      }
    });

    // Populate with camp registration data
    campRegistrations.forEach(reg => {
      const dateKey = format(parseISO(reg.created_at!), 'yyyy-MM-dd');
      if (dailyData[dateKey]) {
        dailyData[dateKey].campRegistrations++;
        if (reg.payment_status === 'paid') {
          dailyData[dateKey].campRevenue += reg.total_amount;
        }
      }
    });

    // Calculate total revenue for each day
    Object.values(dailyData).forEach(day => {
      day.totalRevenue = day.paymentsAmount + day.campRevenue;
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  },

  // Export functions
  exportProfitLossToCSV(data: ProfitLossData, filename?: string) {
    const rows = [
      ['Profit & Loss Statement'],
      [`Period: ${format(data.period.startDate, 'dd MMM yyyy')} - ${format(data.period.endDate, 'dd MMM yyyy')}`],
      [''],
      ['REVENUE'],
      ['Payments Received', data.revenue.payments.toFixed(2)],
      ['Camp Registrations', data.revenue.campRegistrations.toFixed(2)],
      ['Total Revenue', data.revenue.total.toFixed(2)],
      [''],
      ['EXPENSES'],
      ...Object.entries(data.expenses.byCategory).map(([cat, amt]) => [cat, (amt as number).toFixed(2)]),
      ['Total Expenses', data.expenses.total.toFixed(2)],
      [''],
      ['NET PROFIT', data.netProfit.toFixed(2)],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `profit-loss-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  exportProfitLossToPDF(data: ProfitLossData, filename?: string) {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Profit & Loss Statement', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Period: ${format(data.period.startDate, 'dd MMM yyyy')} - ${format(data.period.endDate, 'dd MMM yyyy')}`, 14, 28);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 34);

    // Revenue section
    autoTable(doc, {
      head: [['Revenue', 'Amount (KES)']],
      body: [
        ['Payments Received', data.revenue.payments.toLocaleString()],
        ['Camp Registrations', data.revenue.campRegistrations.toLocaleString()],
        ['Total Revenue', data.revenue.total.toLocaleString()],
      ],
      startY: 42,
      headStyles: { fillColor: [34, 139, 34] },
    });

    // Expenses section
    const expenseRows = Object.entries(data.expenses.byCategory).map(([cat, amt]) => [cat, (amt as number).toLocaleString()]);
    expenseRows.push(['Total Expenses', data.expenses.total.toLocaleString()]);

    autoTable(doc, {
      head: [['Expenses', 'Amount (KES)']],
      body: expenseRows,
      startY: (doc as any).lastAutoTable.finalY + 10,
      headStyles: { fillColor: [220, 53, 69] },
    });

    // Net profit
    autoTable(doc, {
      head: [['Summary', 'Amount (KES)']],
      body: [['Net Profit', data.netProfit.toLocaleString()]],
      startY: (doc as any).lastAutoTable.finalY + 10,
      headStyles: { fillColor: [0, 123, 255] },
    });

    doc.save(filename || `profit-loss-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },

  exportARAgingToCSV(data: ARAgingSummary, filename?: string) {
    const headers = ['Invoice #', 'Customer', 'Email', 'Total Amount', 'Paid', 'Balance Due', 'Due Date', 'Days Overdue', 'Aging Bucket'];
    const rows = data.items.map(item => [
      item.invoiceNumber,
      item.customerName,
      item.customerEmail,
      item.totalAmount.toFixed(2),
      item.paidAmount.toFixed(2),
      item.balanceDue.toFixed(2),
      item.dueDate,
      item.daysOverdue.toString(),
      item.agingBucket,
    ]);

    // Add summary
    rows.push([]);
    rows.push(['SUMMARY']);
    rows.push(['Current', '', '', '', '', data.current.toFixed(2)]);
    rows.push(['1-30 Days', '', '', '', '', data.days1to30.toFixed(2)]);
    rows.push(['31-60 Days', '', '', '', '', data.days31to60.toFixed(2)]);
    rows.push(['61-90 Days', '', '', '', '', data.days61to90.toFixed(2)]);
    rows.push(['90+ Days', '', '', '', '', data.days90plus.toFixed(2)]);
    rows.push(['Total Outstanding', '', '', '', '', data.total.toFixed(2)]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `ar-aging-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  exportARAgingToPDF(data: ARAgingSummary, filename?: string) {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Accounts Receivable Aging Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);
    doc.text(`Total Outstanding: KES ${data.total.toLocaleString()}`, 14, 34);

    // Summary
    autoTable(doc, {
      head: [['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total']],
      body: [[
        data.current.toLocaleString(),
        data.days1to30.toLocaleString(),
        data.days31to60.toLocaleString(),
        data.days61to90.toLocaleString(),
        data.days90plus.toLocaleString(),
        data.total.toLocaleString(),
      ]],
      startY: 40,
      headStyles: { fillColor: [255, 193, 7] },
    });

    // Detail table
    autoTable(doc, {
      head: [['Invoice #', 'Customer', 'Total', 'Paid', 'Balance', 'Due Date', 'Overdue', 'Bucket']],
      body: data.items.map(item => [
        item.invoiceNumber,
        item.customerName.substring(0, 20),
        item.totalAmount.toLocaleString(),
        item.paidAmount.toLocaleString(),
        item.balanceDue.toLocaleString(),
        item.dueDate,
        item.daysOverdue.toString(),
        item.agingBucket,
      ]),
      startY: (doc as any).lastAutoTable.finalY + 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 53, 69] },
    });

    doc.save(filename || `ar-aging-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },

  exportDailySalesToCSV(data: DailySalesData[], filename?: string) {
    const headers = ['Date', 'Invoices Created', 'Invoice Amount', 'Payments', 'Payment Amount', 'Camp Registrations', 'Camp Revenue', 'Total Revenue'];
    const rows = data.map(day => [
      day.date,
      day.invoicesCreated.toString(),
      day.invoicesAmount.toFixed(2),
      day.paymentsReceived.toString(),
      day.paymentsAmount.toFixed(2),
      day.campRegistrations.toString(),
      day.campRevenue.toFixed(2),
      day.totalRevenue.toFixed(2),
    ]);

    // Add totals
    const totals = data.reduce(
      (acc, day) => ({
        invoicesCreated: acc.invoicesCreated + day.invoicesCreated,
        invoicesAmount: acc.invoicesAmount + day.invoicesAmount,
        paymentsReceived: acc.paymentsReceived + day.paymentsReceived,
        paymentsAmount: acc.paymentsAmount + day.paymentsAmount,
        campRegistrations: acc.campRegistrations + day.campRegistrations,
        campRevenue: acc.campRevenue + day.campRevenue,
        totalRevenue: acc.totalRevenue + day.totalRevenue,
      }),
      { invoicesCreated: 0, invoicesAmount: 0, paymentsReceived: 0, paymentsAmount: 0, campRegistrations: 0, campRevenue: 0, totalRevenue: 0 }
    );

    rows.push([
      'TOTAL',
      totals.invoicesCreated.toString(),
      totals.invoicesAmount.toFixed(2),
      totals.paymentsReceived.toString(),
      totals.paymentsAmount.toFixed(2),
      totals.campRegistrations.toString(),
      totals.campRevenue.toFixed(2),
      totals.totalRevenue.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `daily-sales-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  exportDailySalesToPDF(data: DailySalesData[], filename?: string) {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Daily Sales Summary', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);

    autoTable(doc, {
      head: [['Date', 'Invoices', 'Inv. Amt', 'Payments', 'Pmt Amt', 'Camp Regs', 'Camp Rev', 'Total Rev']],
      body: data.map(day => [
        day.date,
        day.invoicesCreated.toString(),
        day.invoicesAmount.toLocaleString(),
        day.paymentsReceived.toString(),
        day.paymentsAmount.toLocaleString(),
        day.campRegistrations.toString(),
        day.campRevenue.toLocaleString(),
        day.totalRevenue.toLocaleString(),
      ]),
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 139, 34] },
    });

    doc.save(filename || `daily-sales-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },
};
