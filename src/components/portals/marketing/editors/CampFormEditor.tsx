import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';
import { MultiDatePicker } from '@/components/forms/MultiDatePicker';

interface CampFormEditorProps {
  isOpen: boolean;
  onClose: () => void;
  formSlug: string | null;
  onSave: () => void;
}

export const CampFormEditor: React.FC<CampFormEditorProps> = ({ isOpen, onClose, formSlug, onSave }) => {
  const [formData, setFormData] = useState({
    pricing: {
      halfDayRate: 1500,
      fullDayRate: 2500,
      currency: 'KES'
    },
    fields: {
      parentName: { label: 'Parent/Guardian Name', placeholder: 'Enter your full name', required: true },
      childName: { label: "Child's Full Name", placeholder: "Enter child's full name", required: true },
      dateOfBirth: { label: 'Date of Birth', placeholder: 'Select date', required: true },
      ageRange: { label: 'Age Range', placeholder: 'Select age range', required: true },
      numberOfDays: { label: 'Number of Days', placeholder: 'Enter number of days (1-60)', helpText: 'Enter how many days you want to register for' },
      sessionType: { label: 'Session Type', halfDayLabel: 'Half Day (8AM-12PM)', fullDayLabel: 'Full Day (8AM-5PM)' },
      specialNeeds: { label: 'Special Needs/Medical Information', placeholder: 'Please describe any special needs, allergies, or medical conditions' },
      emergencyContact: { label: 'Emergency Contact Name', placeholder: 'Enter emergency contact name', required: true },
      email: { label: 'Email Address', placeholder: 'your.email@example.com', required: true },
      phone: { label: 'Phone Number', placeholder: '+254 XXX XXX XXX', required: true }
    },
    buttons: {
      registerOnly: 'Register Only',
      registerAndPay: 'Register & Pay Now',
      addChild: 'Add Another Child',
      removeChild: 'Remove'
    },
    messages: {
      registrationSuccess: "Registration submitted successfully! We'll contact you shortly.",
      registrationError: 'Failed to submit registration. Please try again.',
      chooseOption: 'Choose your registration option:',
      paymentComingSoon: 'Payment integration coming soon. Both options will complete your registration.'
    },
    specialNeedsSection: {
      title: 'Special Needs & Medical Information',
      description: 'Please provide any information about allergies, medical conditions, or special accommodations needed.'
    },
    availableDates: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (formSlug && isOpen) {
      loadFormData();
    }
  }, [formSlug, isOpen]);

  const loadFormData = async () => {
    if (!formSlug) return;
    
    const data = await cmsService.getCampFormConfig(formSlug.replace('-form', ''));
    if (data?.metadata?.formConfig) {
      setFormData({
        ...formData,
        ...data.metadata.formConfig,
        specialNeedsSection: {
          ...formData.specialNeedsSection,
          ...(data.metadata.formConfig.specialNeedsSection || {})
        },
        availableDates: data.metadata.formConfig.availableDates || []
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formType = formSlug?.replace('-form', '') || '';
      
      const result = await cmsService.updateCampFormConfig(formType, formData);
      
      if (result) {
        toast.success('Camp form updated successfully');
        onSave();
        onClose();
      } else {
        toast.error('Failed to update camp form - please check permissions');
      }
    } catch (error) {
      console.error('Error saving camp form:', error);
      toast.error('Failed to update camp form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Camp Form Configuration</DialogTitle>
          <DialogDescription>Customize all form labels, pricing, and messages</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="pricing" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="dates">Session Dates</TabsTrigger>
              <TabsTrigger value="fields">Field Labels</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="halfDayRate">Half Day Rate</Label>
                  <Input
                    id="halfDayRate"
                    type="number"
                    value={formData.pricing.halfDayRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, halfDayRate: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="fullDayRate">Full Day Rate</Label>
                  <Input
                    id="fullDayRate"
                    type="number"
                    value={formData.pricing.fullDayRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, fullDayRate: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.pricing.currency}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, currency: e.target.value }
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Available Camp Dates</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select specific dates when this camp will be available. Supports complex schedules like weekdays only, specific weeks, or custom date combinations.
                  </p>
                </div>

                <MultiDatePicker
                  selectedDates={formData.availableDates}
                  onChange={(dates) => setFormData({ ...formData, availableDates: dates })}
                />
              </div>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4 pt-4">
              {Object.entries(formData.fields).map(([key, field]) => (
                <div key={key} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${key}-label`}>Label</Label>
                      <Input
                        id={`${key}-label`}
                        value={field.label}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: {
                            ...formData.fields,
                            [key]: { ...field, label: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${key}-placeholder`}>Placeholder</Label>
                      <Input
                        id={`${key}-placeholder`}
                        value={'placeholder' in field ? field.placeholder : ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: {
                            ...formData.fields,
                            [key]: { ...field, placeholder: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {'helpText' in field && field.helpText && (
                    <div>
                      <Label htmlFor={`${key}-help`}>Help Text</Label>
                      <Input
                        id={`${key}-help`}
                        value={field.helpText}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: {
                            ...formData.fields,
                            [key]: { ...field, helpText: e.target.value }
                          }
                        })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="buttons" className="space-y-4 pt-4">
              {Object.entries(formData.buttons).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`btn-${key}`} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Input
                    id={`btn-${key}`}
                    value={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      buttons: { ...formData.buttons, [key]: e.target.value }
                    })}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 pt-4">
              {Object.entries(formData.messages).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`msg-${key}`} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Textarea
                    id={`msg-${key}`}
                    value={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      messages: { ...formData.messages, [key]: e.target.value }
                    })}
                    rows={2}
                  />
                </div>
              ))}

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Special Needs Section</h4>
                <div>
                  <Label htmlFor="special-title">Title</Label>
                  <Input
                    id="special-title"
                    value={formData.specialNeedsSection.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      specialNeedsSection: { ...formData.specialNeedsSection, title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="special-desc">Description</Label>
                  <Textarea
                    id="special-desc"
                    value={formData.specialNeedsSection.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      specialNeedsSection: { ...formData.specialNeedsSection, description: e.target.value }
                    })}
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
