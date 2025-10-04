import React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Clock, MapPin, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import dailyActivitiesImage from '@/assets/daily-activities.jpg';
import { ConsentDialog } from './ConsentDialog';
const childSchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(100),
  ageRange: z.enum(['3-below', '4-6', '7-10', '11-13', '14-17'], { required_error: 'Age range is required' }),
  specialNeeds: z.string().max(500).optional()
});

const dayCampsSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required').max(100),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  duration: z.enum(['day', 'week', 'month'], { required_error: 'Duration is required' }),
  location: z.enum(['karura-f', 'ngong'], { required_error: 'Location is required' }),
  emergencyContact: z.string().min(1, 'Emergency contact is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().refine(val => val === true, 'Consent is required')
});
type DayCampsFormData = z.infer<typeof dayCampsSchema>;
const DayCampsProgram = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<DayCampsFormData>({
    resolver: zodResolver(dayCampsSchema),
    defaultValues: {
      children: [{ childName: '', ageRange: '3-below' as const, specialNeeds: '' }],
      consent: false
    }
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: 'children'
  });

  const consent = watch('consent');
  const onSubmit = async (data: DayCampsFormData) => {
    try {
      console.log('Day Camps form submission:', data);
      toast.success('Registration submitted successfully! We will contact you soon.');
    } catch (error) {
      toast.error('Failed to submit registration. Please try again.');
    }
  };
  const ageGroups = [{
    age: '3 & Below',
    locations: 'Karura Gate F, Tigoni',
    schedule: '9:30 Songs • 10:00 Walk • 10:45 Snack • 11:15 Craft • 12:00 Story • 12:30 Close',
    skills: 'Sensory, Language, Motor Skills',
    color: 'bg-blue-50 border-blue-200'
  }, {
    age: '4–6',
    locations: 'Karura Gate F, Tigoni',
    schedule: '9:30 Warmup • 10:00 Bushcraft Basics • 11:30 Snack • 12:00 Games • 1:00 Creative Craft',
    skills: 'Confidence, Social Play, Curiosity',
    color: 'bg-green-50 border-green-200'
  }, {
    age: '7–10',
    locations: 'Karura Gate F',
    schedule: '8:30 Safety Brief • 9:00 Rope Course • 10:30 Orienteering • 12:00 Lunch • 2:00 Group Game',
    skills: 'Survival Basics, Teamwork',
    color: 'bg-yellow-50 border-yellow-200'
  }, {
    age: '11–13',
    locations: 'Karura Gate A, Ngong',
    schedule: '8:30 Navigation Skills • 10:30 Survival Task • 1:00 Leadership Challenge • 3:30 Reflection',
    skills: 'Leadership, Resilience',
    color: 'bg-orange-50 border-orange-200'
  }, {
    age: '14–17',
    locations: 'Karura Gate A, Ngong',
    schedule: '8:00 Expedition Simulation • 11:00 River Crossing • 2:00 Team Strategy Game',
    skills: 'Problem-Solving, Decision Making',
    color: 'bg-red-50 border-red-200'
  }];
  return <div className="min-h-screen bg-background">
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
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    Day Camps
                  </h1>
                  <p className="text-lg text-muted-foreground">(Nairobi Circuit)</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Structured daily experiences to build confidence, friendships, and life skills while reinforcing Amuse's mission of enriching kids through nature. Programs run across Karura Gate F and Ngong Sanctuary.
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <img src={dailyActivitiesImage} alt="Children enjoying day camp activities" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">Locations</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Karura Gate F
                    </span>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Age Group Details */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary">Age Groups & Schedules</h3>
              <div className="space-y-4">
                {ageGroups.map((group, index) => <Card key={index} className={`p-6 border-2 ${group.color}`}>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h4 className="text-xl font-semibold text-primary">Age {group.age}</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{group.locations}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium text-sm text-primary mb-1">Daily Schedule:</h5>
                            <p className="text-sm text-muted-foreground">{group.schedule}</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-sm text-primary mb-1">Key Skills:</h5>
                            <div className="flex flex-wrap gap-1">
                              {group.skills.split(', ').map(skill => <span key={skill} className="bg-white/80 text-primary text-xs px-2 py-1 rounded-full">
                                  {skill}
                                </span>)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>)}
              </div>
            </div>

            {/* Special Note */}
            <Card className="p-6 bg-primary/5">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Special Needs Accommodation
              </h4>
              <p className="text-muted-foreground">
                We provide specialized support and adapted activities for children with special needs. Please indicate any requirements during registration so we can ensure the best possible experience for your child.
              </p>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Register for Day Camp</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="parentName" className="text-base font-medium">Parent Name *</Label>
                <Input id="parentName" {...register('parentName')} className="mt-2" placeholder="Enter your full name" />
                {errors.parentName && <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Children Information *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendChild({ childName: '', ageRange: '3-below' as const, specialNeeds: '' })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Child
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
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-sm">Child Name</Label>
                        <Input
                          {...register(`children.${index}.childName`)}
                          className="mt-1"
                          placeholder="Enter child's full name"
                        />
                        {errors.children?.[index]?.childName && (
                          <p className="text-destructive text-sm mt-1">{errors.children[index]?.childName?.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-sm">Age Range</Label>
                        <Controller
                          name={`children.${index}.ageRange`}
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select age range" />
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
                        <Label className="text-sm">Special/Medical Needs (Optional)</Label>
                        <Input
                          {...register(`children.${index}.specialNeeds`)}
                          className="mt-1"
                          placeholder="Allergies, medical conditions, etc."
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
                <Label className="text-base font-medium">Registration Duration *</Label>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Single Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.duration && (
                  <p className="text-destructive text-sm mt-1">{errors.duration.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Camp Location *</Label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="karura-f">Karura F</SelectItem>
                        <SelectItem value="ngong">Ngong Sanctuary (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.location && (
                  <p className="text-destructive text-sm mt-1">{errors.location.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="emergencyContact" className="text-base font-medium">Emergency Contact *</Label>
                <Input id="emergencyContact" {...register('emergencyContact')} className="mt-2" placeholder="Emergency contact name and phone" />
                {errors.emergencyContact && <p className="text-destructive text-sm mt-1">{errors.emergencyContact.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">Email *</Label>
                  <Input id="email" type="email" {...register('email')} className="mt-2" placeholder="your@email.com" />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">Phone Number *</Label>
                  <Input id="phone" {...register('phone')} className="mt-2" placeholder="+254 700 000 000" />
                  {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <ConsentDialog checked={consent} onCheckedChange={checked => setValue('consent', checked)} error={errors.consent?.message} />

              <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Register for Day Camp'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>;
};
export default DayCampsProgram;