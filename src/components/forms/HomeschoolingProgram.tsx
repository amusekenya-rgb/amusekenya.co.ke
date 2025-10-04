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
import { Clock, Users, Target, CheckCircle, ArrowLeft, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import schoolsImage from '@/assets/schools.jpg';
import { ConsentDialog } from './ConsentDialog';

const currentYear = new Date().getFullYear();
const birthYears = Array.from({ length: 18 }, (_, i) => currentYear - i - 3);

const homeschoolingSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required').max(100),
  children: z.array(z.object({
    name: z.string().min(1, 'Child name is required').max(100),
    birthYear: z.string().min(1, 'Birth year is required')
  })).min(1, 'Please add at least one child'),
  package: z.enum(['1-day-discovery', 'weekly-pod', 'project-based']),
  focus: z.array(z.string()).min(1, 'Please select at least one focus area'),
  transport: z.boolean().default(false),
  meal: z.boolean().default(false),
  allergies: z.string().max(500),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().refine(val => val === true, 'Consent is required')
});

type HomeschoolingFormData = z.infer<typeof homeschoolingSchema>;

const HomeschoolingProgram = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting }
  } = useForm<HomeschoolingFormData>({
    resolver: zodResolver(homeschoolingSchema),
    defaultValues: {
      children: [{ name: '', birthYear: '' }],
      focus: [],
      transport: false,
      meal: false,
      consent: false
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children'
  });

  const watchedFocus = watch('focus') || [];
  const consent = watch('consent');

  const onSubmit = async (data: HomeschoolingFormData) => {
    try {
      console.log('Homeschooling form submission:', data);
      toast.success('Registration submitted successfully! We will contact you soon.');
    } catch (error) {
      toast.error('Failed to submit registration. Please try again.');
    }
  };

  const handleFocusChange = (focus: string, checked: boolean) => {
    const currentFocus = watchedFocus;
    if (checked) {
      setValue('focus', [...currentFocus, focus]);
    } else {
      setValue('focus', currentFocus.filter(f => f !== focus));
    }
  };

  const packages = [
    {
      id: '1-day-discovery',
      title: '1-Day Discovery',
      itinerary: '10:00 Nature Circle | 10:15 Guided Lesson | 11:15 Journaling | 12:30 Project Build | 1:30 Math-in-Nature | 2:30 Reflection',
      skills: ['Observation', 'Sports', 'Teamwork', 'Journaling']
    },
    {
      id: 'weekly-pod',
      title: 'Weekly Pod Plan (4-Weeks)',
      itinerary: 'Week 1 – Ecology, Week 2 – Navigation, Week 3 – Survival, Week 4 – Showcase',
      skills: ['Progressive Learning', 'Leadership', 'Presentation Skills']
    },
    {
      id: 'project-based',
      title: 'Project-Based Module (5 Days)',
      itinerary: 'Day 1 – Research, Day 2 – Build, Day 3 – Field Study, Day 4 – Prepare Presentation, Day 5 – Present',
      skills: ['Research', 'Collaboration', 'Critical Thinking']
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
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                Homeschooling Outdoor Experiences
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Structured integration of physical education and nature immersion. Sports modules include mini athletics, relay races, and cooperative games to build physical literacy.
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <img 
                src={schoolsImage} 
                alt="Homeschooling outdoor activities"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Package Details */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary">Available Packages</h3>
              {packages.map((pkg) => (
                <Card key={pkg.id} className="p-6">
                  <h4 className="text-xl font-semibold mb-3">{pkg.title}</h4>
                  <p className="text-muted-foreground mb-4">{pkg.itinerary}</p>
                  <div className="flex flex-wrap gap-2">
                    {pkg.skills.map((skill) => (
                      <span key={skill} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Rainy Day Activities */}
            <Card className="p-6 bg-accent/50">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Rainy Day Activities
              </h4>
              <p className="text-muted-foreground">
                Nature crafts, mapping indoors, nature storytime - ensuring learning continues regardless of weather with adaptability and sensory play focus.
              </p>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Register Now</h3>
            
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

              <div>
                <Label className="text-base font-medium mb-2 block">Children *</Label>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Input
                          {...register(`children.${index}.name`)}
                          placeholder="Child's name"
                          className="w-full"
                        />
                        {errors.children?.[index]?.name && (
                          <p className="text-destructive text-sm mt-1">{errors.children[index]?.name?.message}</p>
                        )}
                      </div>
                      <div className="w-32">
                        <Controller
                          name={`children.${index}.birthYear`}
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Birth year" />
                              </SelectTrigger>
                              <SelectContent>
                                {birthYears.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.children?.[index]?.birthYear && (
                          <p className="text-destructive text-sm mt-1">{errors.children[index]?.birthYear?.message}</p>
                        )}
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => remove(index)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: '', birthYear: '' })}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Child
                  </Button>
                  {errors.children && typeof errors.children.message === 'string' && (
                    <p className="text-destructive text-sm mt-1">{errors.children.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Package *</Label>
                <Select onValueChange={(value) => setValue('package', value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-day-discovery">1-Day Discovery</SelectItem>
                    <SelectItem value="weekly-pod">Weekly Pod Plan (4-Weeks)</SelectItem>
                    <SelectItem value="project-based">Project-Based Module (5 Days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Focus Areas *</Label>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {['STEM', 'History', 'Multi-Subject'].map((focus) => (
                    <div key={focus} className="flex items-center space-x-3">
                      <Checkbox
                        id={focus}
                        checked={watchedFocus.includes(focus)}
                        onCheckedChange={(checked) => handleFocusChange(focus, checked as boolean)}
                      />
                      <Label htmlFor={focus}>{focus}</Label>
                    </div>
                  ))}
                </div>
                {errors.focus && (
                  <p className="text-destructive text-sm mt-1">{errors.focus.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="transport" {...register('transport')} />
                    <Label htmlFor="transport">Transport</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="meal" {...register('meal')} />
                    <Label htmlFor="meal">Meal</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="allergies" className="text-base font-medium">Allergies (Optional)</Label>
                <Textarea
                  id="allergies"
                  {...register('allergies')}
                  className="mt-2"
                  placeholder="Please list any allergies or dietary restrictions"
                  rows={2}
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

              <Button 
                type="submit" 
                className="w-full h-12 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeschoolingProgram;