import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DatePickerField from './DatePickerField';
import { ConsentDialog } from './ConsentDialog';
import { CalendarDays, MapPin, Clock, Users, Trash2, Plus } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { qrCodeService } from '@/services/qrCodeService';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import { PaymentGatewayPlaceholder } from '@/components/camp/PaymentGatewayPlaceholder';

const childSchema = z.object({
  childName: z.string().min(1, 'Child name is required'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  ageRange: z.string(),
  numberOfDays: z.string().min(1, 'Number of days is required'),
  campLocation: z.string().min(1, 'Camp location is required'),
  dailySessions: z.array(z.enum(['half', 'full'])),
  price: z.number(),
});

const dayCampsSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required'),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type DayCampsFormData = z.infer<typeof dayCampsSchema>;

const calculateAgeRange = (dateOfBirth: Date): string => {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate()) ? age - 1 : age;

  if (actualAge >= 3 && actualAge <= 5) return '3-5 years';
  if (actualAge >= 6 && actualAge <= 9) return '6-9 years';
  if (actualAge >= 10 && actualAge <= 13) return '10-13 years';
  return 'Other';
};

const calculatePrice = (dailySessions: Array<'half' | 'full'>): number => {
  const halfDayPrice = 2000;
  const fullDayPrice = 3500;
  
  return dailySessions.reduce((total, session) => {
    return total + (session === 'full' ? fullDayPrice : halfDayPrice);
  }, 0);
};

const DayCampsProgram = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [registrationType, setRegistrationType] = useState<'online_only' | 'online_paid'>('online_only');
  const [submitType, setSubmitType] = useState<'register' | 'pay'>('register');

  const { control, handleSubmit, watch, formState: { errors } } = useForm<DayCampsFormData>({
    resolver: zodResolver(dayCampsSchema),
    defaultValues: {
      parentName: '',
      children: [{
        childName: '',
        dateOfBirth: undefined,
        ageRange: '',
        numberOfDays: '1',
        campLocation: '',
        dailySessions: ['half'],
        price: 2000,
      }],
      emergencyContact: '',
      email: '',
      phone: '',
      consentGiven: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  const watchChildren = watch('children');

  useEffect(() => {
    watchChildren.forEach((child, index) => {
      if (child.dateOfBirth) {
        const ageRange = calculateAgeRange(child.dateOfBirth);
        if (child.ageRange !== ageRange) {
          control._formValues.children[index].ageRange = ageRange;
        }
      }

      const numberOfDays = parseInt(child.numberOfDays || '1');
      const currentSessions = child.dailySessions || [];
      
      if (currentSessions.length !== numberOfDays) {
        const newSessions = Array(numberOfDays).fill('half') as Array<'half' | 'full'>;
        control._formValues.children[index].dailySessions = newSessions;
      }

      const price = calculatePrice(child.dailySessions || []);
      if (child.price !== price) {
        control._formValues.children[index].price = price;
      }
    });
  }, [watchChildren, control]);

  const onSubmit = async (data: DayCampsFormData) => {
    const buttonType = submitType;
    setIsSubmitting(true);
    
    try {
      const totalAmount = data.children.reduce((sum, child) => sum + child.price, 0);
      
      const registrationData = {
        camp_type: 'day-camps' as const,
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: data.emergencyContact,
        children: data.children.map(child => ({
          childName: child.childName,
          dateOfBirth: child.dateOfBirth.toISOString(),
          ageRange: child.ageRange,
          specialNeeds: `Location: ${child.campLocation}, Days: ${child.numberOfDays}`,
          selectedDays: child.dailySessions.map((_, idx) => `Day ${idx + 1}`),
          selectedSessions: child.dailySessions,
          price: child.price,
        })),
        total_amount: totalAmount,
        payment_status: buttonType === 'pay' ? 'paid' as const : 'unpaid' as const,
        payment_method: buttonType === 'pay' ? 'card' as const : 'pending' as const,
        registration_type: buttonType === 'pay' ? 'online_paid' as const : 'online_only' as const,
        qr_code_data: '',
        consent_given: data.consentGiven,
        status: 'active' as const,
      };

      const registration = await campRegistrationService.createRegistration(registrationData);
      
      if (!registration || !registration.id) {
        throw new Error('Registration failed - no ID returned');
      }
      
      const qrData = qrCodeService.generateQRCodeData(registration.id);
      await campRegistrationService.updateRegistration(registration.id, { qr_code_data: qrData });
      
      const qrDataUrl = await qrCodeService.generateQRCode(qrData);
      
      setRegistrationResult({ ...registration, qr_code_data: qrData });
      setQrCodeDataUrl(qrDataUrl);
      setRegistrationType(buttonType === 'pay' ? 'online_paid' : 'online_only');
      setShowQRModal(true);
      
      toast.success('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ageGroups = [
    {
      range: '3-5 Years',
      schedule: '9:00 AM - 12:00 PM (Half Day) or 9:00 AM - 3:00 PM (Full Day)',
      location: 'Karen',
      skills: ['Basic motor skills', 'Social interaction', 'Creative play', 'Nature exploration']
    },
    {
      range: '6-9 Years',
      schedule: '9:00 AM - 12:00 PM (Half Day) or 9:00 AM - 3:00 PM (Full Day)',
      location: 'Ngong Road',
      skills: ['Team activities', 'Problem solving', 'Outdoor adventures', 'Arts & crafts']
    },
    {
      range: '10-13 Years',
      schedule: '9:00 AM - 12:00 PM (Half Day) or 9:00 AM - 3:00 PM (Full Day)',
      location: 'Both Locations',
      skills: ['Leadership', 'Advanced challenges', 'Sports', 'Technology projects']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Program Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Nairobi Day Camps</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Daily adventures in nature without leaving the city! Available throughout the year at convenient locations.
          </p>
        </div>

        {/* Program Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Program Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <MapPin className="h-4 w-4" />
                  <span>Two Convenient Locations</span>
                </div>
                <ul className="space-y-1 text-muted-foreground ml-6">
                  <li>• Karen Location (3-5 years, 6-9 years)</li>
                  <li>• Ngong Road Location (6-9 years, 10-13 years)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Clock className="h-4 w-4" />
                  <span>Flexible Schedule</span>
                </div>
                <ul className="space-y-1 text-muted-foreground ml-6">
                  <li>• Half Day: 9:00 AM - 12:00 PM (KES 2,000/day)</li>
                  <li>• Full Day: 9:00 AM - 3:00 PM (KES 3,500/day)</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Age Groups & Activities
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {ageGroups.map((group, idx) => (
                  <Card key={idx} className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base">{group.range}</CardTitle>
                      <CardDescription className="text-sm">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {group.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {group.skills.map((skill, sidx) => (
                          <li key={sidx}>• {skill}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="bg-accent/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">What's Included:</p>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li>✓ Professional supervision</li>
                <li>✓ All activity materials</li>
                <li>✓ Snacks (Full Day includes lunch)</li>
                <li>✓ Safety equipment</li>
                <li>✓ Nature-based learning</li>
                <li>✓ Small group sizes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Special Needs Section */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Inclusive Environment</CardTitle>
            <CardDescription>
              We welcome children with special needs and provide accommodations to ensure everyone can participate safely and enjoyably.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Register for Day Camps</CardTitle>
            <CardDescription>
              Fill in the details below to register your child(ren) for our day camps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Parent Name */}
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                <Controller
                  name="parentName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="parentName"
                      placeholder="Enter your full name"
                      {...field}
                    />
                  )}
                />
                {errors.parentName && (
                  <p className="text-sm text-destructive">{errors.parentName.message}</p>
                )}
              </div>

              {/* Children Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Children Information *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({
                      childName: '',
                      dateOfBirth: undefined,
                      ageRange: '',
                      numberOfDays: '1',
                      campLocation: '',
                      dailySessions: ['half'],
                      price: 2000,
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Child {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Child's Name *</Label>
                          <Controller
                            name={`children.${index}.childName`}
                            control={control}
                            render={({ field }) => (
                              <Input placeholder="Enter child's name" {...field} />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Controller
                            name={`children.${index}.dateOfBirth`}
                            control={control}
                            render={({ field }) => (
                              <DatePickerField
                                label="Date of Birth"
                                value={field.value}
                                onChange={field.onChange}
                                required
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Number of Days *</Label>
                          <Controller
                            name={`children.${index}.numberOfDays`}
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5].map(num => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num} {num === 1 ? 'Day' : 'Days'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Camp Location *</Label>
                          <Controller
                            name={`children.${index}.campLocation`}
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="karen">Karen</SelectItem>
                                  <SelectItem value="ngong-road">Ngong Road</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      {/* Daily Sessions */}
                      <div className="space-y-2">
                        <Label>Daily Sessions *</Label>
                        {Array.from({ length: parseInt(watchChildren[index]?.numberOfDays || '1') }).map((_, dayIdx) => (
                          <div key={dayIdx} className="flex items-center gap-4">
                            <span className="text-sm font-medium w-16">Day {dayIdx + 1}:</span>
                            <Controller
                              name={`children.${index}.dailySessions.${dayIdx}`}
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="half">Half Day (KES 2,000)</SelectItem>
                                    <SelectItem value="full">Full Day (KES 3,500)</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="bg-accent/30 p-3 rounded">
                        <p className="text-sm font-semibold">
                          Subtotal for {watchChildren[index]?.childName || 'this child'}: KES {watchChildren[index]?.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                <Controller
                  name="emergencyContact"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="emergencyContact"
                      placeholder="Emergency contact name and phone"
                      {...field}
                    />
                  )}
                />
                {errors.emergencyContact && (
                  <p className="text-sm text-destructive">{errors.emergencyContact.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...field}
                    />
                  )}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="phone"
                      placeholder="+254 700 000 000"
                      {...field}
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              {/* Total Amount */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-lg font-bold text-primary">
                  Total Amount: KES {watchChildren.reduce((sum, child) => sum + (child.price || 0), 0).toFixed(2)}
                </p>
              </div>

              {/* Payment Gateway Placeholder */}
              <PaymentGatewayPlaceholder />

              {/* Consent */}
              <Controller
                name="consentGiven"
                control={control}
                render={({ field }) => (
                  <ConsentDialog
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              {errors.consentGiven && (
                <p className="text-sm text-destructive">{errors.consentGiven.message}</p>
              )}

              {/* Submit Buttons */}
              <div className="grid md:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal */}
      <QRCodeDownloadModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        registration={registrationResult}
        qrCodeDataUrl={qrCodeDataUrl}
        registrationType={registrationType}
      />
    </div>
  );
};

export default DayCampsProgram;
