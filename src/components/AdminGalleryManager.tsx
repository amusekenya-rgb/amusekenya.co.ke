
import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { GalleryUploadForm } from './gallery/GalleryUploadForm';
import { GalleryGrid } from './gallery/GalleryGrid';
import { GalleryEditDialog } from './gallery/GalleryEditDialog';

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
  const [images, setImages] = useLocalStorage<ImageItem[]>('site-images', []);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);
  const [newImageAlt, setNewImageAlt] = useState<string>('');

  // Filter only gallery images
  const galleryImages = images.filter(img => img.section === 'gallery');

  const handleUpload = async (file: File, caption: string) => {
    setIsUploading(true);

    try {
      const imageUrl = URL.createObjectURL(file);

      const newImage: ImageItem = {
        id: `gallery_${Date.now()}`,
        url: imageUrl,
        alt: caption,
        section: 'gallery',
        uploadedAt: new Date().toISOString(),
      };

      setImages([...images, newImage]);
      
      toast({
        title: "Gallery image added",
        description: "Your image has been added to the gallery",
      });

      // Log the action for audit purposes
      console.log(`Admin ${currentAdminUsername} added gallery image: ${newImage.id}`);
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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this gallery image?')) {
      // Find the image to get its URL before removing
      const imageToDelete = images.find(img => img.id === id);
      
      // Filter out the deleted image
      setImages(images.filter(img => img.id !== id));
      
      // Clean up blob URL if applicable
      if (imageToDelete?.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.url);
      }
      
      toast({
        title: "Image deleted",
        description: "The image has been removed from the gallery",
      });

      // Log the action for audit purposes
      console.log(`Admin ${currentAdminUsername} deleted gallery image: ${id}`);
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
