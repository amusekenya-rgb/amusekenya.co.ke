import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cmsService } from '@/services/cmsService';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettingsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SiteSettingsEditor: React.FC<SiteSettingsEditorProps> = ({ isOpen, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    footer_description: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    contact_hours: '',
    social_instagram: '',
    social_twitter: '',
    social_facebook: '',
    copyright_text: '',
    schedule_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const settings = await cmsService.getSiteSettings();
    if (settings?.metadata) {
      setFormData(prev => ({ ...prev, ...settings.metadata }));
    }
  };

  const handleScheduleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only for schedules)
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `schedule-${Date.now()}.${fileExt}`;
      const filePath = `schedules/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, schedule_url: publicUrl }));
      
      toast({ title: 'Schedule uploaded successfully' });
    } catch (error) {
      console.error('Error uploading schedule:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading the schedule',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const settings = await cmsService.getSiteSettings();
      
      if (settings) {
        await cmsService.updateContent(settings.id, {
          metadata: formData,
          status: 'published'
        });
      } else {
        await cmsService.createContent({
          title: 'Site Settings',
          slug: 'site-settings',
          content_type: 'site_settings',
          status: 'published',
          metadata: formData
        });
      }

      toast({ title: 'Site settings updated successfully' });
      onSave();
      onClose();
    } catch (error) {
      toast({ title: 'Error updating site settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Site Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Footer Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="footer_description">Footer Description</Label>
                <Textarea
                  id="footer_description"
                  value={formData.footer_description}
                  onChange={(e) => setFormData({ ...formData, footer_description: e.target.value })}
                  placeholder="Forest adventures and outdoor education..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact_phone">Phone Number</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="0114 705 763"
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Email Address</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="info@amusekenya.co.ke"
                />
              </div>
              <div>
                <Label htmlFor="contact_address">Address</Label>
                <Textarea
                  id="contact_address"
                  value={formData.contact_address}
                  onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                  placeholder="Karura Forest, Gate F, Thigiri Ridge"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="contact_hours">Operating Hours</Label>
                <Input
                  id="contact_hours"
                  value={formData.contact_hours}
                  onChange={(e) => setFormData({ ...formData, contact_hours: e.target.value })}
                  placeholder="Monday to Sunday: 08:00am - 05:00pm"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Social Media Links</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="social_instagram">Instagram URL</Label>
                <Input
                  id="social_instagram"
                  value={formData.social_instagram}
                  onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                  placeholder="https://instagram.com/amusekenya"
                />
              </div>
              <div>
                <Label htmlFor="social_twitter">Twitter URL</Label>
                <Input
                  id="social_twitter"
                  value={formData.social_twitter}
                  onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                  placeholder="https://twitter.com/amusekenya"
                />
              </div>
              <div>
                <Label htmlFor="social_facebook">Facebook URL</Label>
                <Input
                  id="social_facebook"
                  value={formData.social_facebook}
                  onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                  placeholder="https://facebook.com/amusekenya"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="copyright_text">Copyright Text (Optional)</Label>
            <Input
              id="copyright_text"
              value={formData.copyright_text}
              onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
              placeholder="Amuse Kenya. All rights reserved."
            />
          </div>

          <div>
            <h3 className="font-semibold mb-4">Program Schedules</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="schedule_url">Schedule Document (PDF)</Label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      id="schedule_url"
                      value={formData.schedule_url}
                      onChange={(e) => setFormData({ ...formData, schedule_url: e.target.value })}
                      placeholder="https://... or upload a file"
                    />
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleScheduleUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload PDF'}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Upload a PDF schedule document (max 10MB) that users can download from the navbar
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
