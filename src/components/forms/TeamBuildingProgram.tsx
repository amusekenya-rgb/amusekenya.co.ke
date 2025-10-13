import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PartyPopper, Users, Target, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import birthdayImage from '@/assets/birthday.jpg';
import adventureImage from '@/assets/adventure.jpg';
import campingImage from '@/assets/camping.jpg';
import DatePickerField from './DatePickerField';
import { ConsentDialog } from './ConsentDialog';

const teamBuildingSchema = z.object({
  occasion: z.enum(['birthday', 'family', 'corporate']),
  adultsNumber: z.string().min(1, 'Number of adults is required'),
  childrenNumber: z.string().min(1, 'Number of children is required'),
  ageRange: z.enum(['3-below', '4-6', '7-10', '11-13', '14-17', '18+']),
  package: z.enum(['adventure', 'bushcraft', 'nature-carnival', 'family-corporate']),
  eventDate: z.date({ required_error: 'Event date is required' }),
  location: z.enum(['karura-gate-f', 'karura-gate-a', 'tigoni', 'ngong']),
  decor: z.boolean().default(false),
  catering: z.boolean().default(false),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().refine(val => val === true, 'Consent is required')
});

type TeamBuildingFormData = z.infer<typeof teamBuildingSchema>;

const TeamBuildingProgram = () => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TeamBuildingFormData>({
    resolver: zodResolver(teamBuildingSchema),
    defaultValues: {
      decor: false,
      catering: false,
      consent: false
    }
  });

  const consent = watch('consent');

  const onSubmit = async (data: TeamBuildingFormData) => {
    try {
      console.log('Team Building form submission:', data);
      toast.success('Registration submitted successfully! We will contact you soon.');
    } catch (error) {
      toast.error('Failed to submit registration. Please try again.');
    }
  };

  const packages = [
    {
      id: 'adventure',
      title: 'Adventure Party',
      image: birthdayImage,
      description: 'Arrival Icebreaker • Obstacle Challenge • Water Game • Treasure Hunt • Cake & Awards • Closing Circle',
      features: ['Team Communication', 'Problem-Solving', '90% Fun + 10% Reflection']
    },
    {
      id: 'bushcraft',
      title: 'Bushcraft Bash',
      image: campingImage,
      description: 'Fire-making challenges, shelter building, navigation skills, and outdoor cooking activities.',
      features: ['Survival Skills', 'Leadership', 'Outdoor Confidence']
    },
    {
      id: 'nature-carnival',
      title: 'Nature Carnival',
      image: adventureImage,
      description: 'Nature games, eco-friendly activities, wildlife exploration, and environmental challenges.',
      features: ['Environmental Awareness', 'Teamwork', 'Creative Problem-Solving']
    },
    {
      id: 'family-corporate',
      title: 'Family/Corporate Build',
      image: adventureImage,
      description: 'Customized team building experiences for families and corporate groups with measurable outcomes.',
      features: ['Custom Activities', 'Team Bonding', 'Measurable Results']
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
                  <PartyPopper className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    Team Building & Parties
                  </h1>
                  <p className="text-lg text-muted-foreground">(All Ages)</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Create safe, fun, memory-filled experiences with measurable outcomes. Each package is 90% fun + 10% reflection, focusing on team communication and problem-solving.
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <img 
                src={birthdayImage} 
                alt="Team building activities"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Package Details */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary">Available Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className="overflow-hidden">
                    <div className="relative h-48">
                      <img 
                        src={pkg.image} 
                        alt={pkg.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-lg font-bold text-white">{pkg.title}</h4>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-muted-foreground mb-3 text-sm">{pkg.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {pkg.features.map((feature) => (
                          <span key={feature} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sample Flow */}
            <Card className="p-6 bg-accent/50">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Sample Adventure Party Flow
              </h4>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Arrival Icebreaker</strong> - Welcome activities and team formation</p>
                <p><strong>Obstacle Challenge</strong> - Physical and mental challenges</p>
                <p><strong>Water Game</strong> - Fun water-based team activities</p>
                <p><strong>Treasure Hunt</strong> - Problem-solving adventure</p>
                <p><strong>Cake & Awards</strong> - Celebration and recognition</p>
                <p><strong>Closing Circle</strong> - Reflection and key takeaways</p>
              </div>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Book Your Experience</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label className="text-base font-medium">Occasion *</Label>
                <Select onValueChange={(value) => setValue('occasion', value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adultsNumber" className="text-base font-medium">Adults *</Label>
                  <Input
                    id="adultsNumber"
                    {...register('adultsNumber')}
                    type="number"
                    className="mt-2"
                    placeholder="Number of adults"
                  />
                  {errors.adultsNumber && (
                    <p className="text-destructive text-sm mt-1">{errors.adultsNumber.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="childrenNumber" className="text-base font-medium">Children *</Label>
                  <Input
                    id="childrenNumber"
                    {...register('childrenNumber')}
                    type="number"
                    className="mt-2"
                    placeholder="Number of children"
                  />
                  {errors.childrenNumber && (
                    <p className="text-destructive text-sm mt-1">{errors.childrenNumber.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Age Range *</Label>
                <Select onValueChange={(value) => setValue('ageRange', value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-below">3 & Below</SelectItem>
                    <SelectItem value="4-6">4-6 years</SelectItem>
                    <SelectItem value="7-10">7-10 years</SelectItem>
                    <SelectItem value="11-13">11-13 years</SelectItem>
                    <SelectItem value="14-17">14-17 years</SelectItem>
                    <SelectItem value="18+">18+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.ageRange && (
                  <p className="text-destructive text-sm mt-1">{errors.ageRange.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Package *</Label>
                <Select onValueChange={(value) => setValue('package', value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adventure">Adventure Party</SelectItem>
                    <SelectItem value="bushcraft">Bushcraft Bash</SelectItem>
                    <SelectItem value="nature-carnival">Nature Carnival</SelectItem>
                    <SelectItem value="family-corporate">Family/Corporate Build</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Controller
                name="eventDate"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    label="Event Date"
                    placeholder="Select event date"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.eventDate?.message}
                    required
                  />
                )}
              />

              <div>
                <Label className="text-base font-medium">Location *</Label>
                <Select onValueChange={(value) => setValue('location', value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="karura-gate-f">Karura Gate F</SelectItem>
                    <SelectItem value="karura-gate-a">Karura Gate A</SelectItem>
                    <SelectItem value="tigoni">Tigoni</SelectItem>
                    <SelectItem value="ngong">Ngong</SelectItem>
                  </SelectContent>
                </Select>
                {errors.location && (
                  <p className="text-destructive text-sm mt-1">{errors.location.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="decor" {...register('decor')} />
                    <Label htmlFor="decor">Decoration</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="catering" {...register('catering')} />
                    <Label htmlFor="catering">Catering</Label>
                  </div>
                </div>
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

              <Button 
                type="submit" 
                className="w-full h-12 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Book Experience'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamBuildingProgram;