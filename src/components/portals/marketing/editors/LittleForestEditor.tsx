import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';
import { defaultLittleForestConfig, LittleForestFormConfig } from '@/hooks/useLittleForestConfig';
import { MultiDatePicker } from '@/components/forms/MultiDatePicker';

interface LittleForestEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const LittleForestEditor: React.FC<LittleForestEditorProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<LittleForestFormConfig>(defaultLittleForestConfig);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  const loadFormData = async () => {
    const data = await cmsService.getContentBySlug('little-forest-form');
    if (data?.metadata?.formConfig) {
      // Merge with defaults to ensure all fields exist
      setFormData({
        ...defaultLittleForestConfig,
        ...data.metadata.formConfig,
        pricing: {
          ...defaultLittleForestConfig.pricing,
          ...data.metadata.formConfig.pricing
        }
      });
    } else {
      setFormData(defaultLittleForestConfig);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if content exists
      const existingContent = await cmsService.getContentBySlug('little-forest-form');
      
      if (existingContent) {
        // Update existing
        const result = await cmsService.updateContent(existingContent.id, {
          metadata: { formConfig: formData }
        });
        
        if (result) {
          toast.success('Little Forest form updated successfully');
          onSave();
          onClose();
        } else {
          toast.error('Failed to update form - please check permissions');
        }
      } else {
        // Create new
        const result = await cmsService.createContent({
          title: 'Little Forest Explorers Form',
          slug: 'little-forest-form',
          content_type: 'camp_form',
          status: 'published',
          metadata: { formConfig: formData }
        });
        
        if (result) {
          toast.success('Little Forest form created successfully');
          onSave();
          onClose();
        } else {
          toast.error('Failed to create form');
        }
      }
    } catch (error) {
      console.error('Error saving Little Forest form:', error);
      toast.error('Failed to save form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvailableDatesChange = (dates: string[]) => {
    setFormData({
      ...formData,
      availableDates: dates
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Little Forest Explorers Form</DialogTitle>
          <DialogDescription>Customize all form labels, pricing, session dates, and messages</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="dates" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dates">Session Dates</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="fields">Field Labels</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="dates" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Available Session Dates</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the specific dates when Little Forest sessions are available. 
                    Parents will be able to choose from these dates on the registration form.
                  </p>
                </div>
                
                <MultiDatePicker
                  selectedDates={formData.availableDates || []}
                  onChange={handleAvailableDatesChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionRate">Session Rate (per date)</Label>
                  <Input
                    id="sessionRate"
                    type="number"
                    value={formData.pricing.sessionRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, sessionRate: Number(e.target.value) }
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Price per session date selected</p>
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
              <div className="bg-muted/50 rounded p-4">
                <p className="text-sm font-medium mb-2">Pricing Summary</p>
                <p className="text-sm text-muted-foreground">
                  Each session date costs: {formData.pricing.currency} {formData.pricing.sessionRate.toLocaleString()}
                </p>
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
                    {'placeholder' in field && (
                      <div>
                        <Label htmlFor={`${key}-placeholder`}>Placeholder</Label>
                        <Input
                          id={`${key}-placeholder`}
                          value={field.placeholder}
                          onChange={(e) => setFormData({
                            ...formData,
                            fields: {
                              ...formData.fields,
                              [key]: { ...field, placeholder: e.target.value }
                            }
                          })}
                        />
                      </div>
                    )}
                  </div>
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