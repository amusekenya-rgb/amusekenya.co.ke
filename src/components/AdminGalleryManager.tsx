
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { GalleryUploadForm } from './gallery/GalleryUploadForm';
import { GalleryGrid } from './gallery/GalleryGrid';
import { GalleryEditDialog } from './gallery/GalleryEditDialog';
import { supabase } from '@/integrations/supabase/client';

interface ImageItem {
  id: string;
  url: string;
  alt: string;
  section: string;
  uploadedAt: string;
}

interface AdminGalleryManagerProps {
  currentAdminUsername: string;
}

const AdminGalleryManager: React.FC<AdminGalleryManagerProps> = ({ currentAdminUsername }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);
  const [newImageAlt, setNewImageAlt] = useState<string>('');

  // Load images from Supabase on mount
  useEffect(() => {
    loadGalleryImages();
  }, []);

  const loadGalleryImages = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('marketing-assets')
        .list('gallery-images', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const imageItems: ImageItem[] = files.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('marketing-assets')
          .getPublicUrl(`gallery-images/${file.name}`);

        return {
          id: file.id,
          url: publicUrl,
          alt: file.name.replace(/\.[^/.]+$/, ''),
          section: 'gallery',
          uploadedAt: file.created_at || new Date().toISOString()
        };
      });

      setImages(imageItems);
    } catch (error) {
      console.error('Error loading gallery images:', error);
      toast({
        title: 'Failed to load images',
        description: 'Could not load gallery images',
        variant: 'destructive'
      });
    }
  };

  // Filter only gallery images
  const galleryImages = images.filter(img => img.section === 'gallery');

  const handleUpload = async (file: File, caption: string) => {
    setIsUploading(true);

    try {
      // Validate file type (including HEIC/HEIF)
      const lowerFileName = file.name.toLowerCase();
      const isImage = file.type.startsWith('image/') || 
                      lowerFileName.endsWith('.heic') || 
                      lowerFileName.endsWith('.heif');
      
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

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${caption.replace(/\s+/g, '-')}.${fileExt}`;
      const filePath = `gallery-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('marketing-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Reload images
      await loadGalleryImages();
      
      toast({
        title: "Gallery image added",
        description: "Your image has been added to the gallery",
      });

      // Log the action for audit purposes
      console.log(`Admin ${currentAdminUsername} added gallery image: ${fileName}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this gallery image?')) {
      try {
        // Find the image to get its path
        const imageToDelete = images.find(img => img.id === id);
        
        if (imageToDelete) {
          // Extract file name from URL
          const fileName = imageToDelete.url.split('/').pop();
          if (fileName) {
            const filePath = `gallery-images/${fileName}`;
            
            const { error } = await supabase.storage
              .from('marketing-assets')
              .remove([filePath]);

            if (error) throw error;
          }
        }
        
        // Reload images
        await loadGalleryImages();
        
        toast({
          title: "Image deleted",
          description: "The image has been removed from the gallery",
        });

        // Log the action for audit purposes
        console.log(`Admin ${currentAdminUsername} deleted gallery image: ${id}`);
      } catch (error) {
        console.error('Error deleting image:', error);
        toast({
          title: "Delete failed",
          description: "Could not delete the image",
          variant: "destructive"
        });
      }
    }
  };

  const openEditDialog = (image: ImageItem) => {
    setCurrentImage(image);
    setNewImageAlt(image.alt);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!currentImage) return;

    const updatedImages = images.map(img => 
      img.id === currentImage.id ? {...img, alt: newImageAlt} : img
    );

    setImages(updatedImages);
    setEditDialogOpen(false);
    
    toast({
      title: "Image updated",
      description: "The caption has been updated successfully",
    });

    // Log the action for audit purposes
    console.log(`Admin ${currentAdminUsername} updated gallery image: ${currentImage.id}`);
  };

  return (
    <div className="space-y-6">
      <GalleryUploadForm onUpload={handleUpload} isUploading={isUploading} />

      <GalleryGrid 
        galleryImages={galleryImages} 
        onEdit={openEditDialog} 
        onDelete={handleDelete} 
      />

      <GalleryEditDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentImage={currentImage}
        newAlt={newImageAlt}
        onAltChange={setNewImageAlt}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default AdminGalleryManager;
