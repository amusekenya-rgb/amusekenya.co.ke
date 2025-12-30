import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, FileText, CheckCircle, RefreshCw, Send, DollarSign, Mail, Receipt } from 'lucide-react';
import { accountsActionService, AccountsActionItem } from '@/services/accountsActionService';
import { campRegistrationService } from '@/services/campRegistrationService';
import { financialService } from '@/services/financialService';
import { invoiceService } from '@/services/invoiceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDistanceToNow } from 'date-fns';

export const PendingCollections: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [items, setItems] = useState<AccountsActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<AccountsActionItem | null>(null);
  const [actionDialog, setActionDialog] = useState<'invoice' | 'payment' | null>(null);
  const [notes, setNotes] = useState('');
  const [sendingDigest, setSendingDigest] = useState(false);

  const handleSendTestDigest = async () => {
    try {
      setSendingDigest(true);
      console.log('Invoking daily-pending-digest function...');
      
      const { data, error } = await supabase.functions.invoke('daily-pending-digest');
      
      console.log('Function response:', { data, error });
      
      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }
      
      // Check if the function itself returned an error
      if (data?.success === false) {
        console.error('Function returned error:', data.error);
        toast.error(`Failed: ${data.error || 'Unknown error'}`);
        return;
      }
      
      if (data?.pendingCount === 0) {
        toast.info('No pending collections to report');
      } else {
        toast.success(`Digest sent to accounts@amusekenya.co.ke! ${data?.pendingCount || 0} items, Email ID: ${data?.emailId || 'N/A'}`);
      }
    } catch (error: any) {
      console.error('Error sending digest:', error);
      toast.error(`Failed to send digest: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingDigest(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await accountsActionService.getActionItems({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setItems(data);
    } catch (error) {
      console.error('Error loading action items:', error);
      toast.error('Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [statusFilter]);

  // Real-time subscription for auto-refresh when data changes
  useEffect(() => {
    const channel = supabase
      .channel('accounts-action-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts_action_items'
        },
        () => {
          // Reload items when any change happens
          loadItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const handleSendInvoice = async () => {
    if (!selectedItem || !user?.id) return;

    try {
      // Create actual invoice from registration data
      const amountDue = selectedItem.amount_due - selectedItem.amount_paid;
      
      const invoice = await invoiceService.createFromRegistration({
        id: selectedItem.registration_id,
        type: (selectedItem.registration_type as any) || 'camp',
        parentName: selectedItem.parent_name,
        email: selectedItem.email || '',
        programName: selectedItem.camp_type || 'Camp Program',
        totalAmount: amountDue,
        children: [{
          childName: selectedItem.child_name,
          price: amountDue
        }]
      }, user.id);

      // Send invoice email if email exists
      if (selectedItem.email) {
        const emailResult = await invoiceService.sendInvoiceEmail(invoice);
        if (!emailResult.success) {
          console.error('Failed to send invoice email:', emailResult.error);
          toast.warning(`Invoice created but email failed: ${emailResult.error}`);
        }
      }

      // Update action item with invoice reference - keep as pending but mark invoice sent
      await accountsActionService.updateActionItem(selectedItem.id, {
        invoice_id: invoice.id,
        invoice_sent: true,
        invoice_sent_at: new Date().toISOString(),
        notes: notes || `Invoice ${invoice.invoice_number} sent`
      });

      toast.success(`Invoice ${invoice.invoice_number} created and sent for ${selectedItem.child_name}`);
      setActionDialog(null);
      setSelectedItem(null);
      setNotes('');
      loadItems();
    } catch (error) {
      console.error('Error creating/sending invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedItem || !user?.id) return;

    try {
      const amountPaid = selectedItem.amount_due - selectedItem.amount_paid;
      const paymentRef = `ACCOUNTS-${Date.now()}`;

      // Update registration payment status
      if (selectedItem.registration_id) {
        await campRegistrationService.updatePaymentStatus(
          selectedItem.registration_id,
          'paid',
          undefined,
          paymentRef
        );
      }

      // Create unified payment record (linked to invoice if exists)
      await financialService.createPaymentFromRegistration({
        registrationId: selectedItem.registration_id,
        registrationType: (selectedItem.registration_type || 'camp') as 'camp' | 'program',
        source: 'pending_collections',
        customerName: selectedItem.parent_name,
        programName: selectedItem.camp_type || 'Camp',
        amount: amountPaid,
        paymentMethod: 'mpesa',
        paymentReference: paymentRef,
        notes: notes || 'Payment recorded from Pending Collections',
        createdBy: user.id,
        invoiceId: selectedItem.invoice_id // Link to invoice if one was created
      });

      // If there was an invoice, update its status to paid
      if (selectedItem.invoice_id) {
        await financialService.updateInvoice(selectedItem.invoice_id, { status: 'paid' });
      }

      // Mark action item as completed
      await accountsActionService.markCompleted(
        selectedItem.id,
        user.id,
        notes || 'Payment recorded'
      );

      toast.success(`Payment recorded for ${selectedItem.child_name}`);
      setActionDialog(null);
      setSelectedItem(null);
      setNotes('');
      loadItems();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleMarkComplete = async (item: AccountsActionItem) => {
    if (!user?.id) return;

    try {
      await accountsActionService.markCompleted(item.id, user.id, 'Marked complete');
      toast.success('Item marked as complete');
      loadItems();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update');
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.child_name.toLowerCase().includes(search) ||
      item.parent_name.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search) ||
      item.phone?.includes(search)
    );
  });

  const totalPending = items.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount_due - i.amount_paid), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Collections
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSendTestDigest}
                disabled={sendingDigest}
              >
                <Mail className="h-4 w-4 mr-1" />
                {sendingDigest ? 'Sending...' : 'Send Digest'}
              </Button>
              <Button variant="outline" size="sm" onClick={loadItems}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <Card className="p-3 bg-orange-50 dark:bg-orange-950/20">
              <div className="text-xl font-bold text-orange-600">
                {items.filter(i => i.status === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground">Pending Items</div>
            </Card>
            <Card className="p-3 bg-blue-50 dark:bg-blue-950/20">
              <div className="text-xl font-bold text-blue-600">
                KES {totalPending.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Outstanding</div>
            </Card>
            <Card className="p-3 bg-green-50 dark:bg-green-950/20 col-span-2 sm:col-span-1">
              <div className="text-xl font-bold text-green-600">
                {items.filter(i => i.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completed Today</div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === 'pending' ? 'No pending collections!' : 'No items found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead className="hidden sm:table-cell">Parent</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.child_name}</div>
                        <div className="text-xs text-muted-foreground">{item.camp_type}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{item.parent_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{item.phone}</div>
                        <div className="text-xs text-muted-foreground">{item.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">KES {(item.amount_due - item.amount_paid).toLocaleString()}</div>
                        {item.amount_paid > 0 && (
                          <div className="text-xs text-muted-foreground">Paid: {item.amount_paid}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              item.status === 'completed' ? 'default' :
                              item.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }
                            className="text-xs w-fit"
                          >
                            {item.status}
                          </Badge>
                          {item.invoice_sent && (
                            <Badge variant="outline" className="text-xs w-fit bg-blue-50 text-blue-700 border-blue-200">
                              <Receipt className="h-3 w-3 mr-1" />
                              Invoice Sent
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            {!item.invoice_sent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActionDialog('invoice');
                                }}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Invoice</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setActionDialog('payment');
                              }}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Paid</span>
                            </Button>
                          </div>
                        )}
                        {item.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkComplete(item)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-xs text-muted-foreground">Done</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setSelectedItem(null); setNotes(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === 'invoice' ? 'Send Invoice' : 'Record Payment'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div><span className="text-muted-foreground">Child:</span> {selectedItem.child_name}</div>
                <div><span className="text-muted-foreground">Parent:</span> {selectedItem.parent_name}</div>
                <div><span className="text-muted-foreground">Amount:</span> KES {(selectedItem.amount_due - selectedItem.amount_paid).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedItem.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedItem.phone}</div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionDialog === 'invoice' ? 'Invoice reference or notes...' : 'Payment method, reference...'}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setSelectedItem(null); }}>
              Cancel
            </Button>
            <Button onClick={actionDialog === 'invoice' ? handleSendInvoice : handleRecordPayment}>
              {actionDialog === 'invoice' ? 'Mark Invoice Sent' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
