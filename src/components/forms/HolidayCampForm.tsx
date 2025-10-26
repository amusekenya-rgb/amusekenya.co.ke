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
import { differenceInYears } from 'date-fns';
import { useCampFormConfig } from '@/hooks/useCampFormConfig';
import { campRegistrationService } from '@/services/campRegistrationService';
import { qrCodeService } from '@/services/qrCodeService';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import { PaymentGatewayPlaceholder } from '@/components/camp/PaymentGatewayPlaceholder';

const childSchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(100),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  ageRange: z.enum(['3-below', '4-6', '7-10', '11-13', '14-17'], { required_error: 'Age range is required' }),
  specialNeeds: z.string().max(500).optional(),
  numberOfDays: z.number().min(1, 'At least one day is required').max(60, 'Maximum 60 days'),
  dailySessions: z.array(z.enum(['half', 'full'])).min(1, 'At least one day is required'),
  totalPrice: z.number()
});

const holidayCampSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required').max(100),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  campType: z.string().min(1, 'Camp type is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().refine(val => val === true, 'Consent is required')
});

type HolidayCampFormData = z.infer<typeof holidayCampSchema>;

interface HolidayCampFormProps {
  campType: string;
  campTitle: string;
}

const calculateAgeRange = (dateOfBirth: Date): '3-below' | '4-6' | '7-10' | '11-13' | '14-17' => {
  const age = differenceInYears(new Date(), dateOfBirth);
  if (age <= 3) return '3-below';
  if (age <= 6) return '4-6';
  if (age <= 10) return '7-10';
  if (age <= 13) return '11-13';
  return '14-17';
};

const HolidayCampForm = ({ campType, campTitle }: HolidayCampFormProps) => {
  // Map campType to form config key
  const formKey = campType.includes('mid-term') ? 'mid-term' : campType;
  const { config, isLoading } = useCampFormConfig(formKey);

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
  } = useForm<HolidayCampFormData>({
    resolver: zodResolver(holidayCampSchema),
    defaultValues: {
      children: [{ 
        childName: '', 
        dateOfBirth: undefined, 
        ageRange: '3-below' as const, 
        specialNeeds: '',
        numberOfDays: 1,
        dailySessions: ['full'],
        totalPrice: 2000
      }],
      campType: campType,
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

  const onSubmit = async (data: HolidayCampFormData) => {
    const buttonType = submitType;
    if (!config) return;
    
    try {
      const totalAmount = data.children.reduce((sum, child) => sum + child.totalPrice, 0);
      
      // Generate unique QR code data
      const tempId = crypto.randomUUID();
      const qrCodeData = qrCodeService.generateQRCodeData(tempId);
      
      // Prepare registration data
      const registrationData = {
        camp_type: campType as any,
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
        payment_status: buttonType === 'pay' ? 'paid' as const : 'unpaid' as const,
        payment_method: buttonType === 'pay' ? 'card' as const : 'pending' as const,
        registration_type: buttonType === 'pay' ? 'online_paid' as const : 'online_only' as const,
        qr_code_data: qrCodeData,
        consent_given: data.consent,
        status: 'active' as const,
      };

      // Create registration in database
      const registration = await campRegistrationService.createRegistration(registrationData);
      
      // Generate QR code for display
      const qrUrl = await qrCodeService.generateQRCode(qrCodeData);
      
      // Set state for modal
      setRegistrationResult(registration);
      setQrCodeDataUrl(qrUrl);
      setRegistrationType(buttonType === 'pay' ? 'online_paid' : 'online_only');
      setShowQRModal(true);
      
      // TODO: Call edge function to send email
      // await supabase.functions.invoke('send-camp-confirmation', {
      //   body: {
      //     registrationId: registration.id,
      //     type: buttonType === 'pay' ? 'register_paid' : 'register_only'
      //   }
      // });
      
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
                          <div key={dayIndex} className="flex items-center gap-3">
                            <span className="text-sm font-medium min-w-[60px]">Day {dayIndex + 1}:</span>
                            <Controller
                              name={`children.${index}.dailySessions.${dayIndex}`}
                              control={control}
                              render={({ field }) => (
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value}
                                >
                                  <SelectTrigger className="w-full">
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
                  </div>
                )}

                <div className="bg-primary/5 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Price for this child:</span>
                    <span className="text-lg font-bold text-primary">
                      {config.pricing.currency} {watchedChildren[index]?.totalPrice?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {watchedChildren[index]?.dailySessions?.filter((s: string) => s === 'half').length || 0} half days + {watchedChildren[index]?.dailySessions?.filter((s: string) => s === 'full').length || 0} full days
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm">{config.fields.specialNeeds.label}</Label>
                  <Input
                    {...register(`children.${index}.specialNeeds`)}
                    className="mt-1"
                    placeholder={config.fields.specialNeeds.placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
          {errors.children && typeof errors.children.message === 'string' && (
            <p className="text-destructive text-sm mt-1">{errors.children.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="emergencyContact" className="text-base font-medium">{config.fields.emergencyContact.label} *</Label>
          <Input id="emergencyContact" {...register('emergencyContact')} className="mt-2" placeholder={config.fields.emergencyContact.placeholder} />
          {errors.emergencyContact && <p className="text-destructive text-sm mt-1">{errors.emergencyContact.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="text-base font-medium">{config.fields.email.label} *</Label>
            <Input id="email" type="email" {...register('email')} className="mt-2" placeholder={config.fields.email.placeholder} />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone" className="text-base font-medium">{config.fields.phone.label} *</Label>
            <Input id="phone" {...register('phone')} className="mt-2" placeholder={config.fields.phone.placeholder} />
            {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <ConsentDialog checked={consent} onCheckedChange={checked => setValue('consent', checked)} error={errors.consent?.message} />

        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold text-primary">
              {config.pricing.currency} {watchedChildren.reduce((sum, child) => sum + (child.totalPrice || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>

        <PaymentGatewayPlaceholder />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            onClick={() => {
              setSubmitType('register');
              handleSubmit(onSubmit)();
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Register Only'}
          </Button>
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            onClick={() => {
              setSubmitType('pay');
              handleSubmit(onSubmit)();
            }}
          >
            {isSubmitting ? 'Processing...' : 'Register & Pay Now'}
          </Button>
        </div>
      </form>

      {registrationResult && (
        <QRCodeDownloadModal
          open={showQRModal}
          onOpenChange={setShowQRModal}
          registration={registrationResult}
          qrCodeDataUrl={qrCodeDataUrl}
          registrationType={registrationType}
        />
      )}
    </Card>
  );
};

export default HolidayCampForm;
