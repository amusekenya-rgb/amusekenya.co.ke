import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, DollarSign, Calendar, Send, Trash2, Download, Mail, Percent } from "lucide-react";
import { financialService, Invoice } from '@/services/financialService';
import { invoiceService, InvoiceItem, InvoiceWithItems } from '@/services/invoiceService';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    discount_percent: '0',
    tax_percent: '0'
  });

  const [lineItems, setLineItems] = useState<Omit<InvoiceItem, 'id' | 'invoice_id'>[]>([
    { description: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, line_total: 0 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const invoicesData = await financialService.getInvoices();
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLineItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate line total
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unit_price) || 0;
    const discount = Number(updated[index].discount_percent) || 0;
    updated[index].line_total = invoiceService.calculateLineTotal(qty, price, discount);
    updated[index].discount_amount = (qty * price) * (discount / 100);
    
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, line_total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    return invoiceService.calculateInvoiceTotals(
      lineItems,
      Number(formData.discount_percent) || 0,
      Number(formData.tax_percent) || 0
    );
  };

  const handleCreateInvoice = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const totals = calculateTotals();

      await invoiceService.createInvoiceWithItems(
        {
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          program_name: lineItems.map(i => i.description).join(', '),
          ...totals,
          due_date: formData.due_date,
          status: 'draft',
          payment_terms: formData.payment_terms,
          notes: formData.notes,
          created_by: user?.id
        },
        lineItems.filter(item => item.description && item.unit_price > 0)
      );

      await loadData();
      setIsCreateDialogOpen(false);
      resetForm();

      toast({
        title: "Success",
        description: "Invoice created successfully.",
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      due_date: '',
      payment_terms: 'Net 30',
      notes: '',
      discount_percent: '0',
      tax_percent: '0'
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, line_total: 0 }]);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const fullInvoice = await invoiceService.getInvoiceWithItems(invoice.id);
      if (fullInvoice) {
        invoiceService.downloadPDF(fullInvoice);
        toast({ title: "PDF Downloaded", description: `Invoice ${invoice.invoice_number} downloaded.` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to download PDF.", variant: "destructive" });
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    if (!invoice.customer_email) {
      toast({ title: "Error", description: "No customer email provided.", variant: "destructive" });
      return;
    }

    setSendingEmail(invoice.id);
    try {
      const fullInvoice = await invoiceService.getInvoiceWithItems(invoice.id);
      if (!fullInvoice) throw new Error('Invoice not found');

      const result = await invoiceService.sendInvoiceEmail(fullInvoice);
      
      if (result.success) {
        await loadData();
        toast({ title: "Invoice Sent", description: `Invoice emailed to ${invoice.customer_email}` });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send email.", variant: "destructive" });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await financialService.deleteInvoice(invoice.id);
      await loadData();
      toast({ title: "Deleted", description: `Invoice ${invoice.invoice_number} deleted.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete invoice.", variant: "destructive" });
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const totals = calculateTotals();

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading invoices...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Invoice Management</h2>
          <p className="text-sm text-muted-foreground">Create and manage invoices</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription className="hidden sm:block">Add line items, apply discounts, and generate professional invoices</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Customer Email *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Select value={formData.payment_terms} onValueChange={(value) => setFormData({...formData, payment_terms: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 7">Net 7</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-3 sm:hidden">
                  {lineItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Description"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.unit_price || ''}
                            onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Disc %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount_percent || ''}
                            onChange={(e) => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total: KES {item.line_total.toLocaleString()}</span>
                        {lineItems.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Description</TableHead>
                        <TableHead className="w-[12%]">Qty</TableHead>
                        <TableHead className="w-[18%]">Unit Price</TableHead>
                        <TableHead className="w-[12%]">Discount %</TableHead>
                        <TableHead className="w-[15%] text-right">Total</TableHead>
                        <TableHead className="w-[3%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              placeholder="Service description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.unit_price || ''}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_percent || ''}
                              onChange={(e) => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            KES {item.line_total.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {lineItems.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Discounts and Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_percent">Overall Discount %</Label>
                  <div className="relative">
                    <Input
                      id="discount_percent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({...formData, discount_percent: e.target.value})}
                      className="pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tax_percent">Tax %</Label>
                  <div className="relative">
                    <Input
                      id="tax_percent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tax_percent}
                      onChange={(e) => setFormData({...formData, tax_percent: e.target.value})}
                      className="pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>KES {totals.subtotal.toLocaleString()}</span>
                </div>
                {totals.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({formData.discount_percent}%):</span>
                    <span>-KES {totals.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                {totals.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({formData.tax_percent}%):</span>
                    <span>KES {totals.tax_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>KES {totals.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes for the customer..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateInvoice}
                disabled={!formData.customer_name || !formData.customer_email || !formData.due_date || lineItems.every(i => !i.description)}
              >
                Create Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => inv.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter(inv => inv.status === 'overdue').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
          <CardDescription className="hidden sm:block">Manage, download, and email invoices</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices yet. Create your first invoice.
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-border">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{invoice.invoice_number}</div>
                        <div className="text-sm text-muted-foreground">{invoice.customer_name}</div>
                      </div>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">KES {Number(invoice.total_amount).toLocaleString()}</span>
                      <span className="text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.customer_email && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={sendingEmail === invoice.id}
                          onClick={() => handleSendEmail(invoice)}
                        >
                          <Mail className={`h-4 w-4 ${sendingEmail === invoice.id ? 'animate-pulse' : ''}`} />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{invoice.customer_email || '-'}</TableCell>
                        <TableCell>KES {Number(invoice.total_amount).toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="icon"
                              title="Download PDF"
                              onClick={() => handleDownloadPDF(invoice)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {invoice.customer_email && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                title="Send Email"
                                disabled={sendingEmail === invoice.id}
                                onClick={() => handleSendEmail(invoice)}
                              >
                                <Mail className={`h-4 w-4 ${sendingEmail === invoice.id ? 'animate-pulse' : ''}`} />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="icon"
                              title="Delete"
                              onClick={() => handleDeleteInvoice(invoice)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceManagement;
