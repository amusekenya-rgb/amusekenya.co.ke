import React from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PartyPopper, Gift, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import birthdayImage from "@/assets/birthday.jpg";
import DatePickerField from "./DatePickerField";
import { ConsentDialog } from "./ConsentDialog";
import { RefundPolicyDialog } from "./RefundPolicyDialog";
import { leadsService } from '@/services/leadsService';

const childSchema = z.object({
  childName: z.string().min(1, "Child name is required").max(100),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  specialNeeds: z.string().max(500).optional(),
});

const partiesSchema = z.object({
  occasion: z.enum(["birthday", "anniversary", "reunion", "other"]),
  parentName: z.string().min(1, "Parent/Organizer name is required").max(100),
  children: z.array(childSchema).min(1, "At least one child is required"),
  guestsNumber: z.string().min(1, "Number of guests is required"),
  packageType: z.enum(["half-day", "full-day"]),
  eventTiming: z.enum(["day", "night", "both"], { required_error: "Event timing is required" }),
  eventDate: z.date({ required_error: "Event date is required" }),
  startTime: z.string().min(1, "Start time is required").regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().min(1, "End time is required").regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  location: z.enum(["karura-f", "tigoni"]),
  decor: z.boolean().default(false),
  catering: z.boolean().default(false),
  photography: z.boolean().default(false),
  activities: z.boolean().default(false),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(20),
  consent: z.boolean().refine((val) => val === true, "Consent is required"),
});

type PartiesFormData = z.infer<typeof partiesSchema>;

const PartiesProgram = () => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartiesFormData>({
    resolver: zodResolver(partiesSchema),
    defaultValues: {
      children: [{ childName: "", dateOfBirth: undefined, specialNeeds: "" }],
      decor: false,
      catering: false,
      photography: false,
      activities: false,
      consent: false,
    },
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "children",
  });

  const consent = watch("consent");

  const onSubmit = async (data: PartiesFormData) => {
    try {
      // Save to database
      const { partiesService } = await import('@/services/programRegistrationService');
      const registration = await partiesService.create(data);

      // Capture lead
      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: 'parties',
        program_name: data.occasion,
        form_data: data,
        source: 'website_registration'
      });

      // Send confirmation email via Resend
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: data.email,
          programType: 'parties',
          registrationDetails: {
            parentName: data.parentName,
            occasion: data.occasion,
            packageType: data.packageType,
            eventTiming: data.eventTiming,
            guestsNumber: data.guestsNumber,
            eventDate: data.eventDate,
            startTime: data.startTime,
            endTime: data.endTime,
            registrationId: registration && 'id' in registration ? registration.id : undefined
          }
        }
      });

      toast.success("Party booking submitted successfully! Check your email for confirmation.");
      reset();
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      toast.error(error?.message || "Failed to submit booking. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/group-activities/parties" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
            <ArrowLeft size={20} />
            Back to Parties Info
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Party Information */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <PartyPopper className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">Party Booking</h1>
                  <p className="text-lg text-muted-foreground">Celebrations & Events</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Book your unforgettable outdoor party experience. Perfect for birthdays, family gatherings, and special celebrations.
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <img src={birthdayImage} alt="Party celebrations" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* What's Included */}
            <Card className="p-6 bg-accent/50">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Standard Package Includes
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Dedicated party area</li>
                <li>• Outdoor adventure activities</li>
                <li>• Party games and entertainment</li>
                <li>• Professional event coordination</li>
                <li>• Safety equipment and supervision</li>
                <li>• Basic decorations setup</li>
              </ul>
            </Card>
          </div>

          {/* Booking Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Book Your Party</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label className="text-base font-medium">Occasion *</Label>
                <Select onValueChange={(value) => setValue("occasion", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday Party</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="reunion">Family Reunion</SelectItem>
                    <SelectItem value="other">Other Celebration</SelectItem>
                  </SelectContent>
                </Select>
                {errors.occasion && <p className="text-destructive text-sm mt-1">{errors.occasion.message}</p>}
              </div>

              <div>
                <Label htmlFor="parentName" className="text-base font-medium">
                  Organizer Name *
                </Label>
                <Input
                  id="parentName"
                  {...register("parentName")}
                  className="mt-2"
                  placeholder="Enter your full name"
                />
                {errors.parentName && (
                  <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Children Information *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendChild({ childName: "", dateOfBirth: undefined, specialNeeds: "" })}
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

                      <Controller
                        name={`children.${index}.dateOfBirth`}
                        control={control}
                        render={({ field }) => (
                          <DatePickerField
                            label="Date of Birth"
                            placeholder="Select date of birth"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.children?.[index]?.dateOfBirth?.message}
                            required
                          />
                        )}
                      />

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
                {errors.children && typeof errors.children.message === "string" && (
                  <p className="text-destructive text-sm mt-1">{errors.children.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="guestsNumber" className="text-base font-medium">
                  Number of Guests *
                </Label>
                <Input
                  id="guestsNumber"
                  {...register("guestsNumber")}
                  type="number"
                  className="mt-2"
                  placeholder="Total number of guests (10-50)"
                />
                {errors.guestsNumber && (
                  <p className="text-destructive text-sm mt-1">{errors.guestsNumber.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Package Type *</Label>
                <Select onValueChange={(value) => setValue("packageType", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="half-day">Half-Day Package</SelectItem>
                    <SelectItem value="full-day">Full-Day Package</SelectItem>
                  </SelectContent>
                </Select>
                {errors.packageType && <p className="text-destructive text-sm mt-1">{errors.packageType.message}</p>}
              </div>

              <div>
                <Label className="text-base font-medium">Event Timing *</Label>
                <Select onValueChange={(value) => setValue("eventTiming", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select event timing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">During the Day</SelectItem>
                    <SelectItem value="night">During the Night</SelectItem>
                    <SelectItem value="both">Both Day and Night</SelectItem>
                  </SelectContent>
                </Select>
                {errors.eventTiming && <p className="text-destructive text-sm mt-1">{errors.eventTiming.message}</p>}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-base font-medium">
                    Start Time *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register("startTime")}
                    className="mt-2"
                  />
                  {errors.startTime && (
                    <p className="text-destructive text-sm mt-1">{errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endTime" className="text-base font-medium">
                    End Time *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register("endTime")}
                    className="mt-2"
                  />
                  {errors.endTime && (
                    <p className="text-destructive text-sm mt-1">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Location *</Label>
                <Select onValueChange={(value) => setValue("location", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="karura-f">Karura Gate F</SelectItem>
                    <SelectItem value="tigoni">Tigoni</SelectItem>
                  </SelectContent>
                </Select>
                {errors.location && <p className="text-destructive text-sm mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="decor" {...register("decor")} />
                    <Label htmlFor="decor">Enhanced Decoration Package</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="catering" {...register("catering")} />
                    <Label htmlFor="catering">Catering Services</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="photography" {...register("photography")} />
                    <Label htmlFor="photography">Professional Photography</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="activities" {...register("activities")} />
                    <Label htmlFor="activities">Special Activities (Rock Climbing, Kayaking)</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    Email *
                  </Label>
                  <Input id="email" type="email" {...register("email")} className="mt-2" placeholder="your@email.com" />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">
                    Phone Number *
                  </Label>
                  <Input id="phone" {...register("phone")} className="mt-2" placeholder="+254 700 000 000" />
                  {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <ConsentDialog
                checked={consent}
                onCheckedChange={(checked) => setValue("consent", checked)}
                error={errors.consent?.message}
              />

              <RefundPolicyDialog />

              <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Book Party"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PartiesProgram;
