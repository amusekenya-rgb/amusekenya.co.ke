import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mountain, MapPin, Calendar, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import adventureImage from '@/assets/adventure.jpg';
import { ConsentDialog } from './ConsentDialog';
import { RefundPolicyDialog } from './RefundPolicyDialog';
import DatePickerField from './DatePickerField';
import { leadsService } from '@/services/leadsService';

const participantSchema = z.object({
  name: z.string().min(1, 'Participant name is required').max(100),
  ageRange: z.enum(['9-12', '13-17'], { required_error: 'Age range is required' })
});

const preferredDateSchema = z.object({
  date: z.date({ required_error: 'Date is required' })
});

const kenyanExperiencesSchema = z.object({
  parentLeader: z.string().min(1, 'Parent/Leader name is required').max(100),
  participants: z.array(participantSchema).min(1, 'At least one participant is required'),
  circuit: z.enum(['mt-kenya', 'coast', 'mara', 'chalbi', 'western']),
  preferredDates: z.array(preferredDateSchema).min(1, 'At least one preferred date is required'),
  transport: z.boolean().default(false),
  specialMedicalNeeds: z.string().max(500),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().refine(val => val === true, 'Consent is required')
});

type KenyanExperiencesFormData = z.infer<typeof kenyanExperiencesSchema>;

const KenyanExperiencesProgram = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting }
  } = useForm<KenyanExperiencesFormData>({
    resolver: zodResolver(kenyanExperiencesSchema),
    defaultValues: {
      participants: [{ name: '', ageRange: '9-12' as const }],
      preferredDates: [{ date: undefined as any }],
      transport: false,
      consent: false
    }
  });

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: 'participants'
  });

  const { fields: dateFields, append: appendDate, remove: removeDate } = useFieldArray({
    control,
    name: 'preferredDates'
  });

  const consent = watch('consent');

  const onSubmit = async (data: KenyanExperiencesFormData) => {
    try {
      // Save to database
      const { kenyanExperiencesService } = await import('@/services/programRegistrationService');
      const registration = await kenyanExperiencesService.create(data);

      // Capture lead
      await leadsService.createLead({
        full_name: data.parentLeader,
        email: data.email,
        phone: data.phone,
        program_type: 'kenyan-experiences',
        program_name: data.circuit,
        form_data: data,
        source: 'website_registration'
      });

      // Send confirmation email
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('send-program-confirmation', {
        body: {
          email: data.email,
          name: data.parentLeader,
          programType: 'kenyan-experiences',
          details: {
            circuit: data.circuit,
            participants: data.participants,
            transport: data.transport
          },
          totalAmount: 0, // TBD - will be confirmed by team
          registrationId: registration && 'id' in registration ? registration.id : undefined
        }
      });

      toast.success('Registration submitted successfully! Check your email for confirmation.');
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      toast.error(error?.message || 'Failed to submit registration. Please try again.');
    }
  };

  const circuits = [
    {
      id: 'mt-kenya',
      title: 'Mount Kenya Experiences',
      description: 'Alpine hike, bushcraft, team course',
      ageGroups: [
        { range: '9–12', focus: 'Independence' },
        { range: '13–17', focus: 'Expedition Leadership' }
      ],
      features: ['Alpine Environment', 'Bushcraft Skills', 'Team Challenges', 'Leadership Development']
    },
    {
      id: 'coast',
      title: 'Swahili Coastal Experiences',
      description: 'Marine ecology, kayaking, Swahili culture',
      ageGroups: [
        { range: '9–12', focus: 'Water Confidence' },
        { range: '13–17', focus: 'Marine Stewardship' }
      ],
      features: ['Marine Ecology', 'Cultural Immersion', 'Water Sports', 'Conservation Focus']
    },
    {
      id: 'mara',
      title: 'Mara Experiences',
      description: 'Game drives, Maasai culture immersion',
      ageGroups: [
        { range: '9–12', focus: 'Wildlife Journaling' },
        { range: '13–17', focus: 'Conservation Projects' }
      ],
      features: ['Wildlife Observation', 'Cultural Exchange', 'Conservation Education', 'Photography']
    },
    {
      id: 'chalbi',
      title: 'Rift-valley Experiences',
      description: 'Desert trek, camel safari, shelter build',
      ageGroups: [
        { range: '9–12', focus: 'Resilience' },
        { range: '13–17', focus: 'Desert Survival Challenge' }
      ],
      features: ['Desert Navigation', 'Survival Skills', 'Cultural Learning', 'Resilience Building']
    },
    {
      id: 'western',
      title: 'Western Experiences',
      description: 'Kakamega biodiversity, cultural visits',
      ageGroups: [
        { range: '9–12', focus: 'Curiosity' },
        { range: '13–17', focus: 'Community Project Leadership' }
      ],
      features: ['Biodiversity Study', 'Community Engagement', 'Forest Ecology', 'Project Leadership']
    }
  ];

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
                  <Mountain className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    Kenyan Experiences
                  </h1>
                  <p className="text-lg text-muted-foreground">(5-Day Programs)</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Each 5-day camp is designed to progressively build resilience, teamwork, cultural awareness, and outdoor confidence through immersive experiences across Kenya's diverse landscapes.
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <img 
                src={adventureImage} 
                alt="Kenyan landscape adventures"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Circuit Details */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary">Available Circuits</h3>
              <div className="space-y-6">
                {circuits.map((circuit) => (
                  <Card key={circuit.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold mb-2">{circuit.title}</h4>
                        <p className="text-muted-foreground mb-4">{circuit.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {circuit.ageGroups.map((group, index) => (
                            <div key={index} className="bg-accent/30 p-3 rounded-lg">
                              <div className="font-medium text-primary">Age {group.range}</div>
                              <div className="text-sm text-muted-foreground">Focus: {group.focus}</div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {circuit.features.map((feature) => (
                            <span key={feature} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Program Benefits */}
            <Card className="p-6 bg-primary/5">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                5-Day Progressive Learning
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Day 1-2:</strong> Orientation and skill building</li>
                <li>• <strong>Day 3:</strong> Challenge application and teamwork</li>
                <li>• <strong>Day 4-5:</strong> Leadership development and reflection</li>
                <li>• <strong>Cultural Integration:</strong> Local community engagement throughout</li>
              </ul>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Register for Experience</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="parentLeader" className="text-base font-medium">Parent/Leader Name *</Label>
                <Input
                  id="parentLeader"
                  {...register('parentLeader')}
                  className="mt-2"
                  placeholder="Enter your full name"
                />
                {errors.parentLeader && (
                  <p className="text-destructive text-sm mt-1">{errors.parentLeader.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Participants *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendParticipant({ name: '', ageRange: '9-12' as const })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Participant
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {participantFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-sm">Participant Name</Label>
                          <Input
                            {...register(`participants.${index}.name`)}
                            className="mt-1"
                            placeholder="Enter full name"
                          />
                          {errors.participants?.[index]?.name && (
                            <p className="text-destructive text-sm mt-1">{errors.participants[index]?.name?.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-sm">Age Range</Label>
                          <Controller
                            name={`participants.${index}.ageRange`}
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select age range" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="9-12">9-12 years</SelectItem>
                                  <SelectItem value="13-17">13-17 years</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.participants?.[index]?.ageRange && (
                            <p className="text-destructive text-sm mt-1">{errors.participants[index]?.ageRange?.message}</p>
                          )}
                        </div>
                      </div>
                      
                      {participantFields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeParticipant(index)}
                          className="mt-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.participants && typeof errors.participants.message === 'string' && (
                  <p className="text-destructive text-sm mt-1">{errors.participants.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Circuit *</Label>
                <Select onValueChange={(value) => setValue('circuit', value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a circuit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mt-kenya">Mt Kenya</SelectItem>
                    <SelectItem value="coast">Coast</SelectItem>
                    <SelectItem value="mara">Mara</SelectItem>
                    <SelectItem value="chalbi">Chalbi</SelectItem>
                    <SelectItem value="western">Western</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Preferred Dates * (5-day program)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendDate({ date: undefined as any })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Date
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {dateFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Controller
                          name={`preferredDates.${index}.date`}
                          control={control}
                          render={({ field }) => (
                            <DatePickerField
                              label=""
                              placeholder="Select start date of 5-day program"
                              value={field.value}
                              onChange={field.onChange}
                              error={errors.preferredDates?.[index]?.date?.message}
                            />
                          )}
                        />
                      </div>
                      
                      {dateFields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeDate(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.preferredDates && typeof errors.preferredDates.message === 'string' && (
                  <p className="text-destructive text-sm mt-1">{errors.preferredDates.message}</p>
                )}
              </div>

              <div className="bg-accent/30 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="transport"
                    {...register('transport')}
                  />
                  <Label htmlFor="transport" className="text-base">
                    Transport Required
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-2 ml-7">
                  Check if you need transportation to/from the circuit location
                </p>
              </div>

              <div>
                <Label htmlFor="specialMedicalNeeds" className="text-base font-medium">Special/Medical Needs (Optional)</Label>
                <Textarea
                  id="specialMedicalNeeds"
                  {...register('specialMedicalNeeds')}
                  className="mt-2"
                  placeholder="Please describe any special needs, medical conditions, or dietary requirements"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="mt-2"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    className="mt-2"
                    placeholder="+254 700 000 000"
                  />
                  {errors.phone && (
                    <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <ConsentDialog
                checked={consent}
                onCheckedChange={(checked) => setValue('consent', checked)}
                error={errors.consent?.message}
              />

              <RefundPolicyDialog />

              <Button
                type="submit" 
                className="w-full h-12 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Register for Experience'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KenyanExperiencesProgram;