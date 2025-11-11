import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import DatePickerField from './DatePickerField';
import { ConsentDialog } from './ConsentDialog';
import { RefundPolicyDialog } from './RefundPolicyDialog';
import { differenceInYears } from 'date-fns';
import { useCampFormConfig } from '@/hooks/useCampFormConfig';
import { campRegistrationService } from '@/services/campRegistrationService';
import { qrCodeService } from '@/services/qrCodeService';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import { PaymentGatewayPlaceholder } from '@/components/camp/PaymentGatewayPlaceholder';
import { leadsService } from '@/services/leadsService';

const childSchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(100),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  ageRange: z.enum(['3-below', '4-6', '7-10', '11-13', '14-17'], { required_error: 'Age range is required' }),
  specialNeeds: z.string().max(500).optional(),
  numberOfDays: z.number().min(1, 'At least one day is required').max(60, 'Maximum 60 days'),
  dailySessions: z.array(z.enum(['half', 'full'])).min(1, 'At least one day is required'),
  totalPrice: z.number()
});

const dayCampsSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required').max(100),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().refine(val => val === true, 'Consent is required')
});

type DayCampsFormData = z.infer<typeof dayCampsSchema>;

interface DayCampsProgramProps {
  campTitle: string;
}

// Helper function to calculate age range
const calculateAgeRange = (dateOfBirth: Date): '3-below' | '4-6' | '7-10' | '11-13' | '14-17' => {
  const age = differenceInYears(new Date(), dateOfBirth);
  if (age <= 3) return '3-below';
  if (age <= 6) return '4-6';
  if (age <= 10) return '7-10';
  if (age <= 13) return '11-13';
  return '14-17';
};

const DayCampsProgram = ({ campTitle }: DayCampsProgramProps) => {
  const { config, isLoading } = useCampFormConfig('day-camps');

  const calculatePrice = (dailySessions: Array<'half' | 'full'>): number => {
    if (!config) return 0;
    return dailySessions.reduce((sum, session) => {
      return sum + (session === 'half' ? config.pricing.halfDayRate : config.pricing.fullDayRate);
    }, 0);
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting }
  } = useForm<DayCampsFormData>({
    resolver: zodResolver(dayCampsSchema),
    defaultValues: {
      children: [{ 
        childName: '', 
        dateOfBirth: undefined, 
        ageRange: '3-below' as const, 
        specialNeeds: '',
        numberOfDays: 1,
        dailySessions: ['full'],
        totalPrice: 3500
      }],
      consent: false
    }
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: 'children'
  });

  const consent = watch('consent');
  const watchedChildren = watch('children');

  // Auto-calculate age range and price
  useEffect(() => {
    watchedChildren.forEach((child, index) => {
      if (child.dateOfBirth) {
        const calculatedAgeRange = calculateAgeRange(child.dateOfBirth);
        if (child.ageRange !== calculatedAgeRange) {
          setValue(`children.${index}.ageRange`, calculatedAgeRange, { shouldValidate: false });
        }
      }
      
      // Ensure dailySessions array matches numberOfDays
      if (child.numberOfDays && child.dailySessions) {
        const currentLength = child.dailySessions.length;
        if (currentLength < child.numberOfDays) {
          // Add missing days with default 'full' session
          const newSessions = [...child.dailySessions];
          for (let i = currentLength; i < child.numberOfDays; i++) {
            newSessions.push('full');
          }
          setValue(`children.${index}.dailySessions`, newSessions, { shouldValidate: false });
        } else if (currentLength > child.numberOfDays) {
          // Remove extra days
          setValue(`children.${index}.dailySessions`, child.dailySessions.slice(0, child.numberOfDays), { shouldValidate: false });
        }
        
        // Calculate price
        const calculatedPrice = calculatePrice(child.dailySessions);
        if (child.totalPrice !== calculatedPrice) {
          setValue(`children.${index}.totalPrice`, calculatedPrice, { shouldValidate: false });
        }
      }
    });
  }, [watchedChildren.map(c => `${c.dateOfBirth?.getTime()}-${c.numberOfDays}-${c.dailySessions?.join(',')}`).join('|'), setValue]);

  const [showQRModal, setShowQRModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [registrationType, setRegistrationType] = useState<'online_only' | 'online_paid'>('online_only');
  const [submitType, setSubmitType] = useState<'register' | 'pay'>('register');

  const onSubmit = async (data: DayCampsFormData) => {
    const buttonType = submitType;
    if (!config) return;
    
    try {
      const totalAmount = data.children.reduce((sum, child) => sum + child.totalPrice, 0);
      
      // Generate unique QR code data
      const tempId = crypto.randomUUID();
      const qrCodeData = qrCodeService.generateQRCodeData(tempId);
      
      // Prepare registration data
      const registrationData = {
        camp_type: 'day-camps' as any,
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: data.emergencyContact,
        children: data.children.map(child => ({
          childName: child.childName,
          dateOfBirth: child.dateOfBirth.toISOString(),
          ageRange: child.ageRange,
          specialNeeds: child.specialNeeds || '',
          selectedDays: Array.from({ length: child.numberOfDays }, (_, i) => `Day ${i + 1}`),
          selectedSessions: child.dailySessions,
          price: child.totalPrice,
        })),
        total_amount: totalAmount,
        payment_status: 'unpaid' as const,
        payment_method: 'pending' as const,
        registration_type: 'online_only' as const,
        qr_code_data: qrCodeData,
        consent_given: data.consent,
        status: 'active' as const,
      };

      // Create registration in database
      const registration = await campRegistrationService.createRegistration(registrationData);
      
      // Generate QR code for display
      const qrUrl = await qrCodeService.generateQRCode(qrCodeData);
      
      // Capture lead
      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: 'day-camp',
        program_name: campTitle,
        form_data: data,
        source: 'website_registration'
      });
      
      // Send confirmation email via Postmark
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('send-program-confirmation', {
        body: {
          email: data.email,
          name: data.parentName,
          programType: 'day-camp',
          details: {
            campTitle: campTitle,
            children: data.children,
            campType: 'day-camps'
          },
          totalAmount: totalAmount,
          registrationId: registration.id
        }
      });
      
      // Set state for modal
      setRegistrationResult(registration);
      setQrCodeDataUrl(qrUrl);
      setRegistrationType('online_only');
      setShowQRModal(true);
      
      // Show payment integration message if user clicked "Pay Now"
      if (buttonType === 'pay') {
        setTimeout(() => {
          toast.info('Payment integration coming soon! You will receive an invoice with payment instructions via email.');
        }, 500);
      }
      
      toast.success(config.messages.registrationSuccess);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(config.messages.registrationError);
    }
  };

  if (isLoading || !config) {
    return (
      <Card className="p-8 sticky top-8">
        <p className="text-center text-muted-foreground">Loading form...</p>
      </Card>
    );
  }

  // Validate config has all required fields
  if (!config.fields || !config.pricing || !config.buttons || !config.messages) {
    return (
      <Card className="p-8 sticky top-8">
        <p className="text-center text-destructive">Form configuration is incomplete. Please contact support.</p>
      </Card>
    );
  }

  return (
    <Card className="p-8 sticky top-8">
      <h3 className="text-2xl font-bold text-primary mb-6">{campTitle}</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="parentName" className="text-base font-medium">{config.fields.parentName.label} *</Label>
          <Input id="parentName" {...register('parentName')} className="mt-2" placeholder={config.fields.parentName.placeholder} />
          {errors.parentName && <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-medium">{config.fields.childName.label} *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendChild({ 
                childName: '', 
                dateOfBirth: undefined, 
                ageRange: '3-below' as const, 
                specialNeeds: '',
                numberOfDays: 1,
                dailySessions: ['full'],
                totalPrice: config.pricing.fullDayRate
              })}
            >
              <Plus className="w-4 h-4 mr-1" />
              {config.buttons.addChild}
            </Button>
          </div>
          
          <div className="space-y-6">
            {childrenFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Child {index + 1}</h4>
                  {childrenFields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeChild(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {config.buttons.removeChild}
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm">{config.fields.childName.label}</Label>
                  <Input
                    {...register(`children.${index}.childName`)}
                    className="mt-1"
                    placeholder={config.fields.childName.placeholder}
                  />
                  {errors.children?.[index]?.childName && (
                    <p className="text-destructive text-sm mt-1">{errors.children[index]?.childName?.message}</p>
                  )}
                </div>

                <Controller
                  name={`children.${index}.dateOfBirth`}
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label={config.fields.dateOfBirth.label}
                      placeholder={config.fields.dateOfBirth.placeholder}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.children?.[index]?.dateOfBirth?.message}
                      required
                    />
                  )}
                />
                
                <div>
                  <Label className="text-sm">{config.fields.ageRange.label} (Auto-calculated)</Label>
                  <Controller
                    name={`children.${index}.ageRange`}
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled>
                        <SelectTrigger className="mt-1 bg-muted">
                          <SelectValue placeholder="Select date of birth first" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-below">3 & Below</SelectItem>
                          <SelectItem value="4-6">4-6 years</SelectItem>
                          <SelectItem value="7-10">7-10 years</SelectItem>
                          <SelectItem value="11-13">11-13 years</SelectItem>
                          <SelectItem value="14-17">14-17 years</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.children?.[index]?.ageRange && (
                    <p className="text-destructive text-sm mt-1">{errors.children[index]?.ageRange?.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm">{config.fields.numberOfDays.label}</Label>
                  <Controller
                    name={`children.${index}.numberOfDays`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        placeholder={config.fields.numberOfDays.placeholder}
                        className="mt-1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        value={field.value || ''}
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{config.fields.numberOfDays.helpText}</p>
                  {errors.children?.[index]?.numberOfDays && (
                    <p className="text-destructive text-sm mt-1">{errors.children[index]?.numberOfDays?.message}</p>
                  )}
                </div>

                {watchedChildren[index]?.numberOfDays > 0 && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm mb-2 block">{config.fields.sessionType.label}</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const sessions = Array(watchedChildren[index]?.numberOfDays || 0).fill('half');
                            setValue(`children.${index}.dailySessions`, sessions as Array<'half' | 'full'>, { shouldValidate: true });
                          }}
                        >
                          {config.fields.sessionType.halfDayLabel} ({config.pricing.halfDayRate.toLocaleString()} {config.pricing.currency}/day)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const sessions = Array(watchedChildren[index]?.numberOfDays || 0).fill('full');
                            setValue(`children.${index}.dailySessions`, sessions as Array<'half' | 'full'>, { shouldValidate: true });
                          }}
                        >
                          {config.fields.sessionType.fullDayLabel} ({config.pricing.fullDayRate.toLocaleString()} {config.pricing.currency}/day)
                        </Button>
                      </div>
                    </div>

                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-primary hover:underline list-none flex items-center gap-2">
                        <span className="group-open:rotate-90 transition-transform">▶</span>
                        Customize Individual Days (Optional)
                      </summary>
                      <div className="mt-3 space-y-2 pl-4">
                        {Array.from({ length: watchedChildren[index]?.numberOfDays || 0 }).map((_, dayIndex) => (
                          <div key={dayIndex} className="flex items-center gap-3 bg-muted/50 rounded p-2">
                            <span className="text-sm font-medium min-w-[60px]">Day {dayIndex + 1}:</span>
                            <Controller
                              name={`children.${index}.dailySessions.${dayIndex}`}
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="half">{config.fields.sessionType.halfDayLabel} ({config.pricing.halfDayRate.toLocaleString()} {config.pricing.currency})</SelectItem>
                                    <SelectItem value="full">{config.fields.sessionType.fullDayLabel} ({config.pricing.fullDayRate.toLocaleString()} {config.pricing.currency})</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </details>

                    <div className="bg-primary/5 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Subtotal for Child {index + 1}:</span>
                        <span className="text-lg font-bold text-primary">
                          {config.pricing.currency} {watchedChildren[index]?.totalPrice?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm">Special Needs or Dietary Requirements</Label>
                  <Input
                    {...register(`children.${index}.specialNeeds`)}
                    className="mt-1"
                    placeholder="Any allergies, medical conditions, or special requirements"
                  />
                  {errors.children?.[index]?.specialNeeds && (
                    <p className="text-destructive text-sm mt-1">{errors.children[index]?.specialNeeds?.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="text-base font-medium">{config.fields.email.label} *</Label>
            <Input id="email" type="email" {...register('email')} className="mt-2" placeholder={config.fields.email.placeholder} />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-base font-medium">{config.fields.phone.label} *</Label>
            <Input id="phone" type="tel" {...register('phone')} className="mt-2" placeholder={config.fields.phone.placeholder} />
            {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="emergencyContact" className="text-base font-medium">{config.fields.emergencyContact.label} *</Label>
          <Input id="emergencyContact" {...register('emergencyContact')} className="mt-2" placeholder={config.fields.emergencyContact.placeholder} />
          {errors.emergencyContact && <p className="text-destructive text-sm mt-1">{errors.emergencyContact.message}</p>}
        </div>

        {/* Total Amount Display */}
        <div className="bg-primary/10 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">Total Amount:</span>
            <span className="text-3xl font-bold text-primary">
              {config.pricing.currency} {watchedChildren.reduce((sum, child) => sum + (child.totalPrice || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Consent */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              {...register('consent')}
              className="mt-1"
            />
            <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
              I consent to my child's participation and have read the terms and conditions. *
            </Label>
          </div>
          {errors.consent && <p className="text-destructive text-sm">{errors.consent.message}</p>}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={isSubmitting || !consent}
            onClick={() => setSubmitType('register')}
          >
            {isSubmitting && submitType === 'register' ? 'Registering...' : config.buttons.registerOnly}
          </Button>
          <Button 
            type="button"
            className="flex-1" 
            disabled={isSubmitting || !consent}
            onClick={handleSubmit((data) => {
              setSubmitType('pay');
              onSubmit(data);
            })}
          >
            {isSubmitting && submitType === 'pay' ? 'Processing...' : 'Register & Pay Now'}
          </Button>
        </div>
      </form>

      {/* QR Code Modal */}
      <QRCodeDownloadModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        qrCodeDataUrl={qrCodeDataUrl}
        registration={registrationResult}
        registrationType={registrationType}
      />
    </Card>
  );
};

export default DayCampsProgram;
