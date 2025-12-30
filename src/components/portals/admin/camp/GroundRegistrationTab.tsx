import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Plus, X, Loader2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { campRegistrationService } from '@/services/campRegistrationService';
import { financialService } from '@/services/financialService';
import { qrCodeService } from '@/services/qrCodeService';
import { leadsService } from '@/services/leadsService';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import { CampRegistration } from '@/types/campRegistration';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const childSchema = z.object({
  childName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  ageRange: z.string().min(1, 'Age range is required'),
  specialNeeds: z.string().max(500, 'Description too long').optional(),
  selectedDays: z.array(z.string()).min(1, 'Select at least one day'),
  selectedDates: z.array(z.string()).optional(),
  selectedSessions: z.array(z.string()).min(1, 'Select at least one session'),
  price: z.number().min(0)
});

const groundRegistrationSchema = z.object({
  parentName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number too long'),
  emergencyContact: z.string().trim().min(2, 'Emergency contact name required').max(100, 'Name too long'),
  emergencyPhone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number too long'),
  campType: z.string().min(1, 'Please select a camp type'),
  children: z.array(childSchema).min(1, 'Add at least one child'),
  amountPaid: z.number().min(0, 'Amount must be positive'),
  paymentNotes: z.string().max(500, 'Notes too long').optional()
});

type GroundRegistrationForm = z.infer<typeof groundRegistrationSchema>;

const CAMP_TYPES = [
  { value: 'mid-term-feb-march', label: 'Mid-Term Camp - Feb/March' },
  { value: 'mid-term-october', label: 'Mid-Term Camp - October' },
  { value: 'easter', label: 'Easter Camp' },
  { value: 'summer', label: 'Summer Camp' },
  { value: 'end-year', label: 'End Year Camp' },
  { value: 'day-camps', label: 'Day Camps' },
];

const AGE_RANGES = ['3-5', '6-9', '10-13', '14-17'];
const DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
const SESSIONS = [
  { value: 'full', label: 'Full Day (8AM-5PM)', price: 2500 },
  { value: 'half', label: 'Half Day (8AM-12PM)', price: 1500 }
];

export const GroundRegistrationTab: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [completedRegistration, setCompletedRegistration] = useState<any>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<GroundRegistrationForm>({
    resolver: zodResolver(groundRegistrationSchema),
    defaultValues: {
      children: [{
        childName: '',
        dateOfBirth: '',
        ageRange: '',
        specialNeeds: '',
        selectedDays: [],
        selectedSessions: [],
        price: 0
      }],
      amountPaid: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children'
  });

  const children = watch('children');

  const calculateChildPrice = (childIndex: number) => {
    const child = children[childIndex];
    if (!child) return 0;
    
    const daysCount = child.selectedDays?.length || 0;
    const sessionPrices = child.selectedSessions?.map(s => 
      SESSIONS.find(session => session.value === s)?.price || 0
    ) || [];
    const avgSessionPrice = sessionPrices.length > 0 
      ? sessionPrices.reduce((a, b) => a + b, 0) / sessionPrices.length 
      : 0;
    
    return daysCount * avgSessionPrice;
  };

  const calculateTotalAmount = () => {
    return children.reduce((total, _, index) => total + calculateChildPrice(index), 0);
  };

  const toggleDay = (childIndex: number, day: string) => {
    const currentDays = children[childIndex].selectedDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setValue(`children.${childIndex}.selectedDays`, newDays);
    updateChildPrice(childIndex);
  };

  const toggleSession = (childIndex: number, session: string) => {
    const currentSessions = children[childIndex].selectedSessions || [];
    const newSessions = currentSessions.includes(session)
      ? currentSessions.filter(s => s !== session)
      : [...currentSessions, session];
    setValue(`children.${childIndex}.selectedSessions`, newSessions);
    updateChildPrice(childIndex);
  };

  const updateChildPrice = (childIndex: number) => {
    const price = calculateChildPrice(childIndex);
    setValue(`children.${childIndex}.price`, price);
  };

  const onSubmit = async (data: GroundRegistrationForm) => {
    try {
      setSubmitting(true);

      const totalAmount = calculateTotalAmount();
      const paymentStatus = data.amountPaid >= totalAmount ? 'paid' : 'partial';

      const registrationData: Omit<CampRegistration, 'id' | 'registration_number' | 'created_at' | 'updated_at'> = {
        camp_type: data.campType as CampRegistration['camp_type'],
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: `${data.emergencyContact} (${data.emergencyPhone})`,
        children: data.children.map(child => ({
          childName: child.childName || '',
          dateOfBirth: child.dateOfBirth || '',
          ageRange: child.ageRange || '',
          specialNeeds: child.specialNeeds || '',
          selectedDays: child.selectedDays || [],
          selectedDates: child.selectedDates || [],
          selectedSessions: child.selectedSessions || [],
          price: child.price || 0
        })),
        total_amount: totalAmount,
        payment_status: paymentStatus,
        payment_method: 'cash_ground',
        payment_reference: `GROUND-${Date.now()}`,
        registration_type: 'ground_registration',
        qr_code_data: JSON.stringify({
          type: 'camp_registration',
          id: crypto.randomUUID(),
          timestamp: Date.now()
        }),
        consent_given: true,
        status: 'active',
        admin_notes: data.paymentNotes || `Ground registration. Amount paid: KES ${data.amountPaid}`
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
            programName: `${data.campType} (Ground)`,
            amount: data.amountPaid,
            paymentMethod: 'cash_ground',
            paymentReference: `GROUND-${Date.now()}`,
            notes: `Ground registration. Amount paid: KES ${data.amountPaid}`,
            createdBy: user?.id
          });
        }

        // Generate QR code from string data
        const qrData = await qrCodeService.generateQRCode(registration.qr_code_data);

        // Capture lead
        await leadsService.createLead({
          full_name: data.parentName,
          email: data.email,
          phone: data.phone,
          program_type: data.campType,
          program_name: `${data.campType} (Ground Registration)`,
          form_data: data,
          source: 'ground_registration'
        });

        setQrCodeDataUrl(qrData);
        setCompletedRegistration(registration);
        setShowQRModal(true);

        toast.success('Ground registration completed successfully!');
      }
    } catch (error) {
      console.error('Ground registration error:', error);
      toast.error('Failed to complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Ground Registration
          </CardTitle>
          <CardDescription>
            Register walk-in participants directly at the camp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Parent/Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">Full Name *</Label>
                  <Input
                    id="parentName"
                    {...register('parentName')}
                    placeholder="Enter parent/guardian name"
                  />
                  {errors.parentName && (
                    <p className="text-sm text-destructive mt-1">{errors.parentName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+254 XXX XXX XXX"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContact"
                    {...register('emergencyContact')}
                    placeholder="Enter emergency contact name"
                  />
                  {errors.emergencyContact && (
                    <p className="text-sm text-destructive mt-1">{errors.emergencyContact.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    {...register('emergencyPhone')}
                    placeholder="+254 XXX XXX XXX"
                  />
                  {errors.emergencyPhone && (
                    <p className="text-sm text-destructive mt-1">{errors.emergencyPhone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="campType">Camp Type *</Label>
                  <Select onValueChange={(value) => setValue('campType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select camp type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMP_TYPES.map(camp => (
                        <SelectItem key={camp.value} value={camp.value}>
                          {camp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.campType && (
                    <p className="text-sm text-destructive mt-1">{errors.campType.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Children Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Children Information</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    childName: '',
                    dateOfBirth: '',
                    ageRange: '',
                    specialNeeds: '',
                    selectedDays: [],
                    selectedSessions: [],
                    price: 0
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Child
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Child {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Child's Full Name *</Label>
                      <Input
                        {...register(`children.${index}.childName`)}
                        placeholder="Enter child's name"
                      />
                      {errors.children?.[index]?.childName && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.children[index]?.childName?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        {...register(`children.${index}.dateOfBirth`)}
                      />
                      {errors.children?.[index]?.dateOfBirth && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.children[index]?.dateOfBirth?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Age Range *</Label>
                      <Select onValueChange={(value) => setValue(`children.${index}.ageRange`, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age range" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_RANGES.map(range => (
                            <SelectItem key={range} value={range}>{range} years</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.children?.[index]?.ageRange && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.children[index]?.ageRange?.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label>Special Needs / Medical Information</Label>
                      <Textarea
                        {...register(`children.${index}.specialNeeds`)}
                        placeholder="Any allergies, medical conditions, or special requirements"
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Select Days *</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DAYS.map(day => (
                          <Button
                            key={day}
                            type="button"
                            variant={children[index]?.selectedDays?.includes(day) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleDay(index, day)}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                      {errors.children?.[index]?.selectedDays && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.children[index]?.selectedDays?.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label>Select Sessions *</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SESSIONS.map(session => (
                          <Button
                            key={session.value}
                            type="button"
                            variant={children[index]?.selectedSessions?.includes(session.value) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleSession(index, session.value)}
                          >
                            {session.label} - KES {session.price}
                          </Button>
                        ))}
                      </div>
                      {errors.children?.[index]?.selectedSessions && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.children[index]?.selectedSessions?.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 bg-muted p-3 rounded">
                      <p className="text-sm font-medium">
                        Subtotal for {children[index]?.childName || 'this child'}: 
                        <span className="ml-2 text-primary">KES {calculateChildPrice(index).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Information</h3>
              
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-lg font-bold">
                  Total Amount: <span className="text-primary">KES {calculateTotalAmount().toLocaleString()}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amountPaid">Amount Paid (Cash) *</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    {...register('amountPaid', { valueAsNumber: true })}
                    placeholder="Enter amount received"
                  />
                  {errors.amountPaid && (
                    <p className="text-sm text-destructive mt-1">{errors.amountPaid.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="paymentNotes">Payment Notes</Label>
                  <Textarea
                    id="paymentNotes"
                    {...register('paymentNotes')}
                    placeholder="Any additional payment notes"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="min-w-[200px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Complete Registration
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {completedRegistration && (
        <QRCodeDownloadModal
          open={showQRModal}
          onOpenChange={setShowQRModal}
          registration={completedRegistration}
          qrCodeDataUrl={qrCodeDataUrl}
          registrationType="online_only"
        />
      )}
    </>
  );
};
