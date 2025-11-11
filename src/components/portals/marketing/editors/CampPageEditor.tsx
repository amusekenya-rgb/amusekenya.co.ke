import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Plus, Upload } from 'lucide-react';

interface CampPageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  campSlug: string | null;
  onSave: () => void;
}

export const CampPageEditor: React.FC<CampPageEditorProps> = ({ isOpen, onClose, campSlug, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    heroImage: '',
    duration: '',
    ageGroup: '',
    location: '',
    time: '',
    highlights: ['']
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (campSlug && isOpen) {
      loadCampData();
    } else if (!isOpen) {
      setImagePreview('');
    }
  }, [campSlug, isOpen]);

  const loadCampData = async () => {
    if (!campSlug) return;
    
    const data = await cmsService.getCampPageConfig(campSlug.replace('-page', ''));
    if (data?.metadata?.pageConfig) {
      const config = data.metadata.pageConfig;
      setFormData({
        title: config.title || '',
        description: config.description || '',
        heroImage: config.heroImage || '',
        duration: config.duration || '',
        ageGroup: config.ageGroup || '',
        location: config.location || '',
        time: config.time || '',
        highlights: config.highlights || ['']
      });
      setImagePreview(config.heroImage || '');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check for HEIC/HEIF files (not web-compatible)
    const fileName = file.name.toLowerCase();
    const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif');
    
    if (isHeic) {
      toast.error('HEIC format not supported. Please convert to JPG or PNG first.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `camp-heroes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('marketing-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, heroImage: publicUrl });
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const campType = campSlug?.replace('-page', '') || '';
      const result = await cmsService.updateCampPageConfig(campType, formData);
      
      if (result) {
        toast.success('Camp page updated successfully');
        onSave();
        onClose();
        // Force page reload to fetch fresh data from database
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error('Failed to update camp page - please check permissions');
      }
    } catch (error) {
      console.error('Error saving camp page:', error);
      toast.error('Failed to update camp page');
    } finally {
      setIsLoading(false);
    }
  };

  const addHighlight = () => {
    setFormData({ ...formData, highlights: [...formData.highlights, ''] });
  };

  const removeHighlight = (index: number) => {
    const newHighlights = formData.highlights.filter((_, i) => i !== index);
    setFormData({ ...formData, highlights: newHighlights });
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData({ ...formData, highlights: newHighlights });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Camp Page Content</DialogTitle>
          <DialogDescription>Customize the camp page hero section and details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Camp Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Easter Camp"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A brief description of the camp..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="heroImage">Hero Image *</Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  id="heroImage"
                  value={formData.heroImage}
                  onChange={(e) => {
                    setFormData({ ...formData, heroImage: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://... or /src/assets/camping.jpg"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('heroImageUpload')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                <input
                  id="heroImageUpload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              {imagePreview && (
                <div className="relative w-full h-40 rounded-md overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload from device or paste image URL
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="5 Days"
                required
              />
            </div>

            <div>
              <Label htmlFor="ageGroup">Age Group *</Label>
              <Input
                id="ageGroup"
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                placeholder="4-12 years"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Amuse Nature Experience Center"
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="8:00 AM - 5:00 PM"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Camp Highlights *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
                <Plus className="w-4 h-4 mr-1" />
                Add Highlight
              </Button>
            </div>
            <div className="space-y-2">
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={highlight}
                    onChange={(e) => updateHighlight(index, e.target.value)}
                    placeholder="Easter egg hunts in nature"
                    required
                  />
                  {formData.highlights.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeHighlight(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
