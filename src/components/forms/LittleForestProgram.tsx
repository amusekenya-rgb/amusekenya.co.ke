import React, { useState, useEffect } from 'react';
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
import { Link } from 'react-router-dom';
import dailyActivitiesImage from '@/assets/daily-activities.jpg';
import { ConsentDialog } from './ConsentDialog';
import { RefundPolicyDialog } from './RefundPolicyDialog';
import { PaymentGatewayPlaceholder } from '@/components/camp/PaymentGatewayPlaceholder';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import { campRegistrationService } from '@/services/campRegistrationService';
import { qrCodeService } from '@/services/qrCodeService';
import { leadsService } from '@/services/leadsService';
import type { CampRegistration } from '@/types/campRegistration';
import { useLittleForestConfig } from '@/hooks/useLittleForestConfig';

// Child schema for multiple children support
const childSchema = z.object({
  childName: z.string().min(2, 'Child name must be at least 2 characters'),
  childAge: z.enum(['1-2', '2-3', '3-below'], {
    required_error: 'Please select child age',
  }),
  selectedDays: z.array(z.string()).min(1, 'Select at least one day'),
  nannyRequired: z.boolean().default(false),
  price: z.number().default(0),
});

const littleForestSchema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  emergencyContact: z.string().min(10, 'Emergency contact must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
});

type LittleForestFormData = z.infer<typeof littleForestSchema>;

const LittleForestProgram = () => {
  const { config, isLoading: configLoading } = useLittleForestConfig();
  const SESSION_PRICE = config.pricing.sessionRate;

  const [submitType, setSubmitType] = useState<'register' | 'pay'>('register');
  const [showQRModal, setShowQRModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<CampRegistration | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LittleForestFormData>({
    resolver: zodResolver(littleForestSchema),
    defaultValues: {
      consent: false,
      children: [{
        childName: '',
        childAge: undefined,
        selectedDays: [],
        nannyRequired: false,
        price: 0,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  const watchChildren = watch('children');
  const watchConsent = watch('consent');

  // Auto-calculate pricing - watch for changes in selected days
  useEffect(() => {
    let total = 0;
    watchChildren.forEach((child, index) => {
      const childPrice = (child.selectedDays?.length || 0) * SESSION_PRICE;
      setValue(`children.${index}.price`, childPrice, { shouldValidate: false });
      total += childPrice;
    });
    setTotalAmount(total);
  }, [watchChildren.map(c => `${c.childName}-${c.selectedDays?.join(',')}`).join('|'), setValue, SESSION_PRICE]);

  const onSubmit = async (data: LittleForestFormData) => {
    try {
      // Payment integration not yet available - all registrations are unpaid
      const registrationData = {
        camp_type: 'little-forest' as const,
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: data.emergencyContact,
        children: data.children.map(child => ({
          childName: child.childName,
          dateOfBirth: '',
          ageRange: child.childAge,
          specialNeeds: child.nannyRequired ? 'Accompanied by Nanny' : '',
          selectedDays: child.selectedDays,
          selectedSessions: child.selectedDays,
          price: child.price,
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
        program_name: 'Little Forest',
        form_data: data,
        source: 'website'
      });
      
      setRegistrationResult(result);
      setQrCodeDataUrl(qrCodeUrl);
      setShowQRModal(true);

      toast.success(config.messages.registrationSuccess);
      
      // Show payment integration message if user clicked "Register and Pay"
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
      selectedDays: [],
      nannyRequired: false,
      price: 0,
    });
  };

  const handleDayChange = (childIndex: number, day: string, checked: boolean) => {
    const currentDays = watchChildren[childIndex]?.selectedDays || [];
    const newDays = checked
      ? [...currentDays, day]
      : currentDays.filter((d) => d !== day);
    setValue(`children.${childIndex}.selectedDays`, newDays);
  };

  const schedule = [{
    time: '10:00',
    activity: 'Welcome Song & Nature Walk',
    skills: 'Language, Motor'
  }, {
    time: '10:30',
    activity: 'Mud Kitchen & Sensory Play',
    skills: 'Sensory Exploration'
  }, {
    time: '11:00',
    activity: 'Swahili Story Circle',
    skills: 'Listening'
  }, {
    time: '11:30',
    activity: 'Nature Craft & Drumming',
    skills: 'Rhythm'
  }, {
    time: '12:15',
    activity: 'Snack & Free Play',
    skills: 'Social Skills'
  }, {
    time: '12:45',
    activity: 'Closing Song',
    skills: 'Routine & Transition'
  }];

  if (configLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading form configuration...</div>;
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
                    Little Forest Explorers
                  </h1>
                  <p className="text-lg text-muted-foreground">(Ages 3 & Below)</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Nurture sensory exploration, early language acquisition (Swahili focus), and motor development through nature-based activities designed specifically for our youngest explorers.
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <img src={dailyActivitiesImage} alt="Little children exploring nature" className="w-full h-full object-cover" />
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
                <li>• <strong>Swahili Language:</strong> Early introduction through songs and stories</li>
                <li>• <strong>Sensory Development:</strong> Natural materials and textures</li>
                <li>• <strong>Motor Skills:</strong> Age-appropriate movement activities</li>
                <li>• <strong>Social Skills:</strong> Gentle group interaction and sharing</li>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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

                    <div>
                      <Label className="text-base font-medium">
                        Select Days * ({config.pricing.currency} {SESSION_PRICE.toLocaleString()} per day)
                      </Label>
                      <div className="mt-3 flex gap-6">
                        {config.dayOptions.map(day => (
                          <div key={day.value} className="flex items-center space-x-3">
                            <Checkbox
                              id={`${day.value}-${index}`}
                              checked={watchChildren[index]?.selectedDays?.includes(day.value)}
                              onCheckedChange={(checked) =>
                                handleDayChange(index, day.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={`${day.value}-${index}`} className="text-base">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.children?.[index]?.selectedDays && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.children[index]?.selectedDays?.message}
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
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label htmlFor={`nanny-${index}`} className="text-base">
                          {config.fields.nannyOption.label}
                        </Label>
                      </div>
                    </div>

                    {watchChildren[index]?.price > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-semibold">
                          Subtotal: {config.pricing.currency} {watchChildren[index].price.toLocaleString()}
                        </p>
                      </div>
                    )}
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
                onCheckedChange={(checked) => setValue('consent', checked)}
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
