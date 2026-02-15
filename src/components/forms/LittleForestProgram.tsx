import React, { useCallback, useMemo, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Baby, Clock, Heart, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import RegistrationPageSkeleton from "@/components/skeletons/RegistrationPageSkeleton";
import { Link } from 'react-router-dom';
import dailyActivitiesImage from '@/assets/daily-activities.jpg';
import { ConsentDialog } from './ConsentDialog';
import { RefundPolicyDialog } from './RefundPolicyDialog';
import { PaymentGatewayPlaceholder } from '@/components/camp/PaymentGatewayPlaceholder';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import SimpleDateSelector from './SimpleDateSelector';
import { campRegistrationService } from '@/services/campRegistrationService';
import { qrCodeService } from '@/services/qrCodeService';
import { leadsService } from '@/services/leadsService';
import { invoiceService } from '@/services/invoiceService';
import type { CampRegistration } from '@/types/campRegistration';
import { useLittleForestConfig } from '@/hooks/useLittleForestConfig';
import DynamicMedia from '@/components/content/DynamicMedia';
import { performSecurityChecks, recordSubmission } from '@/services/formSecurityService';

// Child schema for multiple children support with simple date selection
const childSchema = z.object({
  childName: z.string().min(2, 'Child name must be at least 2 characters'),
  childAge: z.enum(['1-2', '2-3', '3-below'], {
    required_error: 'Please select child age',
  }),
  selectedDates: z.array(z.string()).min(1, 'Select at least one date'),
  nannyRequired: z.boolean().default(false),
});

const littleForestSchema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  emergencyContact: z.string().min(10, 'Emergency contact must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  consent: z.boolean().default(false),
});

type LittleForestFormData = z.infer<typeof littleForestSchema>;

const LittleForestProgram = () => {
  const { config, pageConfig, isLoading: configLoading } = useLittleForestConfig();
  
  const [submitType, setSubmitType] = useState<'register' | 'pay'>('register');
  const [showQRModal, setShowQRModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<CampRegistration | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LittleForestFormData>({
    resolver: zodResolver(littleForestSchema),
    defaultValues: {
      consent: false,
      children: [{
        childName: '',
        childAge: undefined,
        selectedDates: [],
        nannyRequired: false,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  const watchChildren = watch('children');
  const watchConsent = watch('consent');

  const handleDatesChange = useCallback(
    (childIndex: number, dates: string[]) => {
      setValue(`children.${childIndex}.selectedDates`, dates, { shouldDirty: true });
    },
    [setValue]
  );

  const handleConsentChange = useCallback(
    (checked: boolean) => {
      setValue('consent', checked, { shouldDirty: true });
    },
    [setValue]
  );

  // Calculate total amount.
  // NOTE: react-hook-form may mutate the `children` array in-place for nested updates.
  // Avoid memoizing directly on `watchChildren` reference (can become stale) so the
  // bottom Total Amount always reflects the latest selectedDates.
  const totalAmount = watchChildren.reduce((total, child) => {
    return total + (child.selectedDates?.length || 0) * config.pricing.sessionRate;
  }, 0);

  // Calculate price per child for display
  const getChildPrice = (childIndex: number) => {
    const child = watchChildren[childIndex];
    return (child?.selectedDates?.length || 0) * config.pricing.sessionRate;
  };

  const onSubmit = async (data: LittleForestFormData) => {
    // Security checks: prevent duplicates and rate limiting
    const securityCheck = await performSecurityChecks(data, 'little-forest');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }
    
    try {
      const registrationData = {
        camp_type: 'little-forest' as const,
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: data.emergencyContact,
        children: data.children.map((child, index) => ({
          childName: child.childName,
          dateOfBirth: '',
          ageRange: child.childAge,
          specialNeeds: child.nannyRequired ? 'Accompanied by Nanny' : '',
          selectedDays: child.selectedDates.map((_, i) => `Day ${i + 1}`),
          selectedDates: child.selectedDates,
          selectedSessions: {},
          price: getChildPrice(index),
        })),
        total_amount: totalAmount,
        payment_status: 'unpaid' as const,
        payment_method: 'pending' as const,
        registration_type: 'online_only' as const,
        qr_code_data: '',
        consent_given: data.consent,
        status: 'active' as const,
      };

      const tempId = `LF-${Date.now()}`;
      const qrData = qrCodeService.generateQRCodeData(tempId);
      registrationData.qr_code_data = qrData;

      const result = await campRegistrationService.createRegistration(registrationData);
      const qrCodeUrl = await qrCodeService.generateQRCode(result.qr_code_data);
      
      // Capture lead
      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: 'little-forest',
        program_name: 'Little Forest Explorers',
        form_data: data,
        source: 'website'
      });

      // Auto-create invoice for registration
      try {
        await invoiceService.createFromRegistration({
          id: result.id,
          type: 'camp',
          parentName: data.parentName,
          email: data.email,
          programName: 'Little Forest Explorers',
          totalAmount,
          children: data.children.map((child, index) => ({
            childName: child.childName,
            price: getChildPrice(index),
            selectedDates: child.selectedDates
          }))
        });
        console.log('✅ Auto-invoice created for Little Forest registration');
      } catch (invoiceError) {
        console.error('⚠️ Failed to create auto-invoice:', invoiceError);
      }
      
      // Send confirmation email via Resend (also sends parallel admin notification)
      try {
        console.log('📧 Attempting to send confirmation email...');
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: data.email,
            programType: 'little-forest',
            registrationDetails: {
              parentName: data.parentName,
              campTitle: 'Little Forest Explorers',
              campType: 'little-forest',
              registrationId: result.id,
              children: data.children.map((child, index) => ({
                childName: child.childName,
                ageRange: child.childAge,
                selectedDates: child.selectedDates,
                selectedSessions: {},
                specialNeeds: child.nannyRequired ? 'Accompanied by Nanny' : '',
                price: getChildPrice(index),
              })),
            },
            invoiceDetails: {
              totalAmount,
              paymentMethod: 'pending',
            },
          },
        });
        
        if (emailError) {
          console.error('⚠️ Email sending error:', emailError);
        } else {
          console.log('✅ Confirmation email sent successfully:', emailData);
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send confirmation email:', emailError);
        // Don't block registration success - email failure is non-critical
      }

      setRegistrationResult(result);
      setQrCodeDataUrl(qrCodeUrl);
      setShowQRModal(true);

      toast.success(config.messages.registrationSuccess);
      
      // Record successful submission for duplicate prevention
      await recordSubmission(data, 'little-forest');
      
      reset();
      
      if (submitType === 'pay') {
        setTimeout(() => {
          toast.info('Payment integration coming soon! You will receive an invoice with payment instructions via email.');
        }, 500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(config.messages.registrationError);
    }
  };

  const addChild = () => {
    append({
      childName: '',
      childAge: undefined,
      selectedDates: [],
      nannyRequired: false,
    });
  };

  // Use schedule from CMS page config
  const schedule = pageConfig.schedule;

  if (configLoading) {
    return <RegistrationPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Program Information */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Baby className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    {pageConfig.title}
                  </h1>
                  <p className="text-lg text-muted-foreground">{pageConfig.subtitle}</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {pageConfig.description}
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <DynamicMedia 
                mediaUrl={pageConfig.featuredImage} 
                mediaType={pageConfig.mediaType} 
                altText={pageConfig.title}
                fallbackImage={dailyActivitiesImage}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Daily Schedule */}
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Daily Schedule
              </h3>
              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg bg-accent/30">
                    <div className="text-primary font-semibold min-w-[60px]">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.activity}</h4>
                      <p className="text-sm text-muted-foreground">{item.skills}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Special Features */}
            <Card className="p-6 bg-primary/5">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Special Focus Areas
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                {pageConfig.specialFeatures.map((feature, index) => (
                  <li key={index}>• <strong>{feature.title}:</strong> {feature.description}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Register Your Little Explorer</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="parentName" className="text-base font-medium">{config.fields.parentName.label}</Label>
                <Input id="parentName" {...register('parentName')} className="mt-2" placeholder={config.fields.parentName.placeholder} />
                {errors.parentName && <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>}
              </div>

              {/* Children Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Children Information</Label>
                  <Button
                    type="button"
                    onClick={addChild}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {config.buttons.addChild}
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 space-y-4 border-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Child {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`children.${index}.childName`}>{config.fields.childName.label}</Label>
                      <Input
                        {...register(`children.${index}.childName`)}
                        placeholder={config.fields.childName.placeholder}
                        className="mt-2"
                      />
                      {errors.children?.[index]?.childName && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.children[index]?.childName?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`children.${index}.childAge`}>{config.fields.childAge.label}</Label>
                      <Controller
                        name={`children.${index}.childAge`}
                        control={control}
                        render={({ field }) => (
                          // NOTE: Radix Select can misbehave when forced into a controlled empty-string value.
                          // Keep it uncontrolled (defaultValue) until the user makes a selection.
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder={config.fields.childAge.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {config.ageOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.children?.[index]?.childAge && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.children[index]?.childAge?.message}
                        </p>
                      )}
                    </div>

                    {/* SimpleDateSelector Component */}
                    <div>
                      <SimpleDateSelector
                        availableDates={config.availableDates || []}
                        selectedDates={watchChildren[index]?.selectedDates || []}
                        onDatesChange={(dates) => handleDatesChange(index, dates)}
                        sessionRate={config.pricing.sessionRate}
                        currency={config.pricing.currency}
                      />
                      {errors.children?.[index]?.selectedDates && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.children[index]?.selectedDates?.message}
                        </p>
                      )}
                    </div>

                    <div className="bg-accent/30 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Controller
                          name={`children.${index}.nannyRequired`}
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              id={`nanny-${index}`}
                              checked={!!field.value}
                              onCheckedChange={(v) => field.onChange(v === true)}
                            />
                          )}
                        />
                        <Label htmlFor={`nanny-${index}`} className="text-base">
                          {config.fields.nannyOption.label}
                        </Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div>
                <Label htmlFor="emergencyContact" className="text-base font-medium">{config.fields.emergencyContact.label}</Label>
                <Input
                  id="emergencyContact"
                  {...register('emergencyContact')}
                  className="mt-2"
                  placeholder={config.fields.emergencyContact.placeholder}
                />
                {errors.emergencyContact && (
                  <p className="text-destructive text-sm mt-1">{errors.emergencyContact.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">{config.fields.email.label}</Label>
                  <Input id="email" type="email" {...register('email')} className="mt-2" placeholder={config.fields.email.placeholder} />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">{config.fields.phone.label}</Label>
                  <Input id="phone" {...register('phone')} className="mt-2" placeholder={config.fields.phone.placeholder} />
                  {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <ConsentDialog
                checked={watchConsent}
                onCheckedChange={handleConsentChange}
                error={errors.consent?.message}
              />

              <RefundPolicyDialog />

              {/* Total Amount Display */}
              <div className="bg-primary/10 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
                <p className="text-3xl font-bold text-primary">
                  {config.pricing.currency} {totalAmount.toLocaleString()}
                </p>
              </div>

              <PaymentGatewayPlaceholder />

              <div className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">{config.messages.chooseOption}</p>
                
                <div className="grid gap-3">
                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    onClick={() => setSubmitType('register')}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {config.buttons.registerOnly}
                  </Button>
                  
                  <Button
                    type="submit"
                    size="lg"
                    onClick={() => setSubmitType('pay')}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {config.buttons.registerAndPay}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {registrationResult && (
          <QRCodeDownloadModal
            open={showQRModal}
            onOpenChange={setShowQRModal}
            registration={registrationResult}
            qrCodeDataUrl={qrCodeDataUrl}
            registrationType={submitType === 'register' ? 'online_only' : 'online_paid'}
          />
        )}
      </div>
    </div>
  );
};

export default LittleForestProgram;