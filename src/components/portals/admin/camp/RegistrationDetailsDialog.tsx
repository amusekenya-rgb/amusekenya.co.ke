import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CampRegistration } from '@/types/campRegistration';
import { campRegistrationService } from '@/services/campRegistrationService';
import { toast } from 'sonner';
import { Save, User, Mail, Phone, Calendar, DollarSign, FileText } from 'lucide-react';

interface RegistrationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: CampRegistration;
  onUpdate: () => void;
}

export const RegistrationDetailsDialog: React.FC<RegistrationDetailsDialogProps> = ({
  open,
  onOpenChange,
  registration,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(registration.payment_status);
  const [paymentMethod, setPaymentMethod] = useState(registration.payment_method);
  const [paymentReference, setPaymentReference] = useState(registration.payment_reference || '');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSavePayment = async () => {
    try {
      setSaving(true);
      await campRegistrationService.updatePaymentStatus(
        registration.id!,
        paymentStatus,
        paymentMethod,
        paymentReference || undefined
      );
      toast.success('Payment status updated');
      onUpdate();
      setEditing(false);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) return;

    try {
      setSaving(true);
      await campRegistrationService.addAdminNote(registration.id!, adminNote);
      toast.success('Note added');
      setAdminNote('');
      onUpdate();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registration Details</DialogTitle>
          <DialogDescription>
            Registration {registration.registration_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Parent Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Parent Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{registration.parent_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {registration.email}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {registration.phone}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Camp Type</Label>
                <p className="font-medium capitalize">{registration.camp_type.replace('-', ' ')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Children Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Children Registered</h3>
            <div className="space-y-4">
              {registration.children.map((child, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{child.childName}</h4>
                    <Badge>{child.ageRange}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Days: </span>
                      {child.selectedDays.join(', ')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sessions: </span>
                      {child.selectedSessions.join(', ')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price: </span>
                      KES {child.price.toFixed(2)}
                    </div>
                    {child.specialNeeds && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Special Needs: </span>
                        {child.specialNeeds}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Information
            </h3>
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Status</Label>
                    <Select value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cash_ground">Cash (Ground)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Payment Reference</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter payment reference number"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePayment} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-lg">KES {registration.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={registration.payment_status === 'paid' ? 'default' : 'destructive'}>
                    {registration.payment_status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="capitalize">{registration.payment_method.replace('_', ' ')}</span>
                </div>
                {registration.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono text-sm">{registration.payment_reference}</span>
                  </div>
                )}
                <Button variant="outline" onClick={() => setEditing(true)} className="mt-2">
                  Edit Payment Info
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Admin Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Admin Notes
            </h3>
            {registration.admin_notes && (
              <div className="bg-muted p-3 rounded-md mb-3 whitespace-pre-wrap text-sm">
                {registration.admin_notes}
              </div>
            )}
            <div className="space-y-2">
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note about this registration..."
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={saving || !adminNote.trim()}>
                Add Note
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Registered: {new Date(registration.created_at!).toLocaleString()}</span>
            </div>
            <div>Registration Type: {registration.registration_type.replace('_', ' ')}</div>
            <div>Status: {registration.status}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
