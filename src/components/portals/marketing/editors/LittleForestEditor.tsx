import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';
import { defaultLittleForestConfig, LittleForestFormConfig } from '@/hooks/useLittleForestConfig';

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
      setFormData(data.metadata.formConfig);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Little Forest Explorers Form</DialogTitle>
          <DialogDescription>Customize all form labels, pricing, and messages</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="pricing" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="schedule">Session Schedule</TabsTrigger>
              <TabsTrigger value="fields">Field Labels</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionRate">Session Rate (per day)</Label>
                  <Input
                    id="sessionRate"
                    type="number"
                    value={formData.pricing.sessionRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, sessionRate: Number(e.target.value) }
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
              <p className="text-sm text-muted-foreground">
                Current pricing: {formData.pricing.currency} {formData.pricing.sessionRate} per session (Monday or Friday)
              </p>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 pt-4">
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Weekly Session Dates</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure the specific calendar dates for Monday and Friday sessions. These dates will appear on the registration form.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monday Session Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.sessionSchedule?.Monday && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.sessionSchedule?.Monday ? (
                            format(new Date(formData.sessionSchedule.Monday), "PPP")
                          ) : (
                            <span>Pick Monday date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.sessionSchedule?.Monday ? new Date(formData.sessionSchedule.Monday) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({
                                ...formData,
                                sessionSchedule: {
                                  ...formData.sessionSchedule,
                                  Monday: format(date, 'yyyy-MM-dd')
                                }
                              });
                            }
                          }}
                          disabled={(date) => date.getDay() !== 1} // Only allow Mondays
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">Select a Monday for the session</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Friday Session Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.sessionSchedule?.Friday && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.sessionSchedule?.Friday ? (
                            format(new Date(formData.sessionSchedule.Friday), "PPP")
                          ) : (
                            <span>Pick Friday date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.sessionSchedule?.Friday ? new Date(formData.sessionSchedule.Friday) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({
                                ...formData,
                                sessionSchedule: {
                                  ...formData.sessionSchedule,
                                  Friday: format(date, 'yyyy-MM-dd')
                                }
                              });
                            }
                          }}
                          disabled={(date) => date.getDay() !== 5} // Only allow Fridays
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">Select a Friday for the session</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded p-3">
                  <p className="text-sm font-medium mb-1">Preview</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.sessionSchedule?.Monday || formData.sessionSchedule?.Friday ? (
                      <>
                        When users select days on the form, they will see: <br />
                        {formData.sessionSchedule?.Monday && (
                          <span className="font-medium block">
                            ✓ Monday ({format(new Date(formData.sessionSchedule.Monday), 'MMM dd, yyyy')})
                          </span>
                        )}
                        {formData.sessionSchedule?.Friday && (
                          <span className="font-medium block">
                            ✓ Friday ({format(new Date(formData.sessionSchedule.Friday), 'MMM dd, yyyy')})
                          </span>
                        )}
                      </>
                    ) : (
                      'Set dates to see how they will appear on the form'
                    )}
                  </p>
                </div>
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
