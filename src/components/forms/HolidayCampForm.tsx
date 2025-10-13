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
import { Plus, Trash2 } from 'lucide-react';
import { ConsentDialog } from './ConsentDialog';

const childSchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(100),
  ageRange: z.enum(['3-below', '4-6', '7-10', '11-13', '14-17'], { required_error: 'Age range is required' }),
  specialNeeds: z.string().max(500).optional()
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

const HolidayCampForm = ({ campType, campTitle }: HolidayCampFormProps) => {
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
      children: [{ childName: '', ageRange: '3-below' as const, specialNeeds: '' }],
      campType: campType,
      consent: false
    }
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: 'children'
  });

  const consent = watch('consent');

  const onSubmit = async (data: HolidayCampFormData) => {
    try {
      console.log(`${campTitle} form submission:`, data);
      toast.success('Registration submitted successfully! We will contact you soon.');
    } catch (error) {
      toast.error('Failed to submit registration. Please try again.');
    }
  };

  return (
    <Card className="p-8 sticky top-8">
      <h3 className="text-2xl font-bold text-primary mb-6">Register for {campTitle}</h3>
      
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
          {isSubmitting ? 'Submitting...' : `Register for ${campTitle}`}
        </Button>
      </form>
    </Card>
  );
};

export default HolidayCampForm;
