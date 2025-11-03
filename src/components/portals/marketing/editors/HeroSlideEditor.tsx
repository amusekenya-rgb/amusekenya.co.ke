import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cmsService } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';

interface HeroSlide {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  buttonText: string;
  imageUrl: string;
  order: number;
}

interface HeroSlideEditorProps {
  isOpen: boolean;
  onClose: () => void;
  slide?: any; // ContentItem from CMS
  onSave: () => void;
}

export const HeroSlideEditor: React.FC<HeroSlideEditorProps> = ({ isOpen, onClose, slide, onSave }) => {
  const [formData, setFormData] = useState<HeroSlide>({
    title: slide?.title || '',
    subtitle: slide?.metadata?.subtitle || '',
    description: slide?.content || '',
    badge: slide?.metadata?.badge || '',
    buttonText: slide?.metadata?.buttonText || 'Book Now',
    imageUrl: slide?.metadata?.imageUrl || '',
    order: slide?.metadata?.order || 1
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (including HEIC/HEIF)
    const fileName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || 
                    fileName.endsWith('.heic') || 
                    fileName.endsWith('.heif');
    
    if (!isImage) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `hero-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imageUrl: publicUrl });
      
      toast({
        title: 'Image uploaded successfully',
        description: 'Your image has been uploaded'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Failed to upload image',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (slide?.id) {
        await cmsService.updateContent(slide.id, {
          title: formData.title,
          slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
          content: formData.description,
          metadata: {
            subtitle: formData.subtitle,
            badge: formData.badge,
            buttonText: formData.buttonText,
            imageUrl: formData.imageUrl,
            order: formData.order
          }
        });
        toast({ title: 'Hero slide updated successfully' });
      } else {
        await cmsService.createContent({
          title: formData.title,
          slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
          content: formData.description,
          content_type: 'hero_slide',
          status: 'draft',
          metadata: {
            subtitle: formData.subtitle,
            badge: formData.badge,
            buttonText: formData.buttonText,
            imageUrl: formData.imageUrl,
            order: formData.order
          }
        });
        toast({ title: 'Hero slide created successfully' });
      }
      onSave();
      onClose();
    } catch (error) {
      toast({ title: 'Error saving hero slide', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{slide ? 'Edit Hero Slide' : 'Create Hero Slide'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="badge">Badge Text</Label>
            <Input
              id="badge"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              placeholder="e.g., Outdoor Adventure"
            />
          </div>
          <div>
            <Label htmlFor="buttonText">Button Text</Label>
            <Input
              id="buttonText"
              value={formData.buttonText}
              onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
              required
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full mt-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload from Device'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Enter URL or upload image (max 5MB)
            </p>
          </div>
          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              min="1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Hero Slide'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
