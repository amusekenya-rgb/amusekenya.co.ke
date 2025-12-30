import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Loader2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { campRegistrationService } from '@/services/campRegistrationService';
import { financialService } from '@/services/financialService';
import { qrCodeService } from '@/services/qrCodeService';
import { leadsService } from '@/services/leadsService';
import { CampRegistration } from '@/types/campRegistration';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const childSchema = z.object({
  childName: z.string().min(2, 'Name required'),
  ageRange: z.string().min(1, 'Age required'),
  price: z.number().min(0)
});

const quickRegSchema = z.object({
  parentName: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone required'),
  campType: z.string().min(1, 'Select camp'),
  children: z.array(childSchema).min(1, 'Add at least one child'),
  sessionType: z.string().min(1, 'Select session'),
  amountPaid: z.number().min(0),
  notes: z.string().optional()
});

type QuickRegForm = z.infer<typeof quickRegSchema>;

const CAMP_TYPES = [
  { value: 'mid-term-feb-march', label: 'Mid-Term Feb/March' },
  { value: 'mid-term-october', label: 'Mid-Term October' },
  { value: 'easter', label: 'Easter Camp' },
  { value: 'summer', label: 'Summer Camp' },
  { value: 'end-year', label: 'End Year Camp' },
  { value: 'day-camps', label: 'Day Camps' },
];

const AGE_RANGES = [
  { value: '3-below', label: '3 & Below (Neem)' },
  { value: '4-6', label: '4-6 (Grevillea)' },
  { value: '7-10', label: '7-10 (Croton)' },
  { value: '11-15', label: '11-15 (Mighty Oaks)' }
];

const SESSIONS = [
  { value: 'full', label: 'Full Day', price: 2500 },
  { value: 'half', label: 'Half Day', price: 1500 }
];

interface QuickGroundRegistrationProps {
  onComplete: () => void;
}

export const QuickGroundRegistration: React.FC<QuickGroundRegistrationProps> = ({ onComplete }) => {
  const { user } = useSupabaseAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<QuickRegForm>({
    resolver: zodResolver(quickRegSchema),
    defaultValues: {
      children: [{ childName: '', ageRange: '', price: 0 }],
      amountPaid: 0,
      sessionType: 'full'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children'
  });

  const sessionType = watch('sessionType');
  const children = watch('children');

  const sessionPrice = SESSIONS.find(s => s.value === sessionType)?.price || 0;
  const totalAmount = children.length * sessionPrice;

  const onSubmit = async (data: QuickRegForm) => {
    try {
      setSubmitting(true);

      const paymentStatus = data.amountPaid >= totalAmount ? 'paid' : data.amountPaid > 0 ? 'partial' : 'unpaid';

      const registrationData: Omit<CampRegistration, 'id' | 'registration_number' | 'created_at' | 'updated_at'> = {
        camp_type: data.campType as CampRegistration['camp_type'],
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: data.phone,
        children: data.children.map(child => ({
          childName: child.childName,
          dateOfBirth: '',
          ageRange: child.ageRange,
          specialNeeds: '',
          selectedDays: ['Day 1'],
          selectedDates: [new Date().toISOString().split('T')[0]],
          selectedSessions: [data.sessionType],
          price: sessionPrice
        })),
        total_amount: totalAmount,
        payment_status: paymentStatus,
        payment_method: 'cash_ground',
        payment_reference: `WALK-${Date.now()}`,
        registration_type: 'ground_registration',
        qr_code_data: JSON.stringify({
          type: 'camp_registration',
          id: crypto.randomUUID(),
          timestamp: Date.now()
        }),
        consent_given: true,
        status: 'active',
        admin_notes: data.notes || `Walk-in registration. Paid: KES ${data.amountPaid}/${totalAmount}`
      };

      const registration = await campRegistrationService.createRegistration(registrationData);

      if (registration) {
        // Create unified payment record if amount was paid
        if (data.amountPaid > 0) {
          await financialService.createPaymentFromRegistration({
            registrationId: registration.id,
            registrationType: 'camp',
            source: 'ground_registration',
            customerName: data.parentName,
            programName: `${data.campType} (Walk-in)`,
            amount: data.amountPaid,
            paymentMethod: 'cash_ground',
            paymentReference: `WALK-${Date.now()}`,
            notes: `Walk-in registration. Paid: KES ${data.amountPaid}/${totalAmount}`,
            createdBy: user?.id
          });
        }

        await leadsService.createLead({
          full_name: data.parentName,
          email: data.email,
          phone: data.phone,
          program_type: data.campType,
          program_name: `${data.campType} (Walk-in)`,
          form_data: data,
          source: 'ground_registration'
        });

        toast.success(`Registered! #${registration.registration_number}`);
        reset();
        onComplete();
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      {/* Parent Info */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label>Parent Name *</Label>
          <Input {...register('parentName')} placeholder="Full name" />
          {errors.parentName && <p className="text-xs text-destructive mt-1">{errors.parentName.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Email *</Label>
            <Input {...register('email')} type="email" placeholder="email@example.com" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Phone *</Label>
            <Input {...register('phone')} placeholder="+254..." />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      {/* Camp & Session */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Camp Type *</Label>
          <Select onValueChange={(v) => setValue('campType', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select camp" />
            </SelectTrigger>
            <SelectContent>
              {CAMP_TYPES.map(camp => (
                <SelectItem key={camp.value} value={camp.value}>{camp.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.campType && <p className="text-xs text-destructive mt-1">{errors.campType.message}</p>}
        </div>
        <div>
          <Label>Session *</Label>
          <Select value={sessionType} onValueChange={(v) => setValue('sessionType', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SESSIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label} - KES {s.price}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Children */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Children ({children.length})</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ childName: '', ageRange: '', price: 0 })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                {...register(`children.${index}.childName`)}
                placeholder="Child's name"
              />
            </div>
            <Select onValueChange={(v) => setValue(`children.${index}.ageRange`, v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Age" />
              </SelectTrigger>
              <SelectContent>
                {AGE_RANGES.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fields.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Payment */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Total Amount:</span>
          <span className="font-bold">KES {totalAmount.toLocaleString()}</span>
        </div>
        <div>
          <Label>Amount Paid (KES)</Label>
          <Input
            type="number"
            {...register('amountPaid', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>Notes (optional)</Label>
        <Textarea {...register('notes')} placeholder="Any notes..." rows={2} />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Register Walk-in
      </Button>
    </form>
  );
};
