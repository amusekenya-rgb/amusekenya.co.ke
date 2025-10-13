import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Baby, Clock, Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import dailyActivitiesImage from '@/assets/daily-activities.jpg';
import { ConsentDialog } from './ConsentDialog';

const littleForestSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required').max(100),
  childName: z.string().min(1, 'Child name is required').max(100),
  childAge: z.enum(['1-2', '2-3', '3-below']),
  daySelection: z.array(z.string()).min(1, 'Please select at least one day'),
  nannyOption: z.boolean().default(false),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().refine(val => val === true, 'Consent is required')
});

type LittleForestFormData = z.infer<typeof littleForestSchema>;

const LittleForestProgram = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<LittleForestFormData>({
    resolver: zodResolver(littleForestSchema),
    defaultValues: {
      daySelection: [],
      nannyOption: false,
      consent: false
    }
  });

  const watchedDays = watch('daySelection') || [];
  const consent = watch('consent');

  const onSubmit = async (data: LittleForestFormData) => {
    try {
      console.log('Little Forest Explorers form submission:', data);
      toast.success('Registration submitted successfully! We will contact you soon.');
    } catch (error) {
      toast.error('Failed to submit registration. Please try again.');
    }
  };

  const handleDayChange = (day: string, checked: boolean) => {
    const currentDays = watchedDays;
    if (checked) {
      setValue('daySelection', [...currentDays, day]);
    } else {
      setValue('daySelection', currentDays.filter(d => d !== day));
    }
  };

  const schedule = [
    { time: '10:00', activity: 'Welcome Song & Nature Walk', skills: 'Language, Motor' },
    { time: '10:30', activity: 'Mud Kitchen & Sensory Play', skills: 'Sensory Exploration' },
    { time: '11:00', activity: 'Swahili Story Circle', skills: 'Listening' },
    { time: '11:30', activity: 'Nature Craft & Drumming', skills: 'Rhythm' },
    { time: '12:15', activity: 'Snack & Free Play', skills: 'Social Skills' },
    { time: '12:45', activity: 'Closing Song', skills: 'Routine & Transition' }
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
              <img 
                src={dailyActivitiesImage} 
                alt="Little children exploring nature"
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
                <Label htmlFor="parentName" className="text-base font-medium">Parent Name *</Label>
                <Input
                  id="parentName"
                  {...register('parentName')}
                  className="mt-2"
                  placeholder="Enter your full name"
                />
                {errors.parentName && (
                  <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="childName" className="text-base font-medium">Child Name *</Label>
                  <Input
                    id="childName"
                    {...register('childName')}
                    className="mt-2"
                    placeholder="Child's name"
                  />
                  {errors.childName && (
                    <p className="text-destructive text-sm mt-1">{errors.childName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="childAge" className="text-base font-medium">Child Age *</Label>
                  <Select onValueChange={(value) => setValue('childAge', value as any)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 years</SelectItem>
                      <SelectItem value="2-3">2-3 years</SelectItem>
                      <SelectItem value="3-below">3 & below</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.childAge && (
                    <p className="text-destructive text-sm mt-1">{errors.childAge.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Day Selection *</Label>
                <div className="mt-3 flex gap-6">
                  {['Monday', 'Friday'].map((day) => (
                    <div key={day} className="flex items-center space-x-3">
                      <Checkbox
                        id={day}
                        checked={watchedDays.includes(day)}
                        onCheckedChange={(checked) => handleDayChange(day, checked as boolean)}
                      />
                      <Label htmlFor={day} className="text-base">{day}</Label>
                    </div>
                  ))}
                </div>
                {errors.daySelection && (
                  <p className="text-destructive text-sm mt-1">{errors.daySelection.message}</p>
                )}
              </div>

              <div className="bg-accent/30 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="nannyOption"
                    {...register('nannyOption')}
                  />
                  <Label htmlFor="nannyOption" className="text-base">
                    Nanny Required (Optional)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-2 ml-7">
                  Check if you need nanny services for your child during the program
                </p>
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
                {isSubmitting ? 'Submitting...' : 'Register Little Explorer'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LittleForestProgram;