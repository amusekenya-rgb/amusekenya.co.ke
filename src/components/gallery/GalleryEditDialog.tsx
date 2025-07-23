
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageItem {
  id: string;
  url: string;
  alt: string;
  section: string;
  uploadedAt: string;
}

interface GalleryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage: ImageItem | null;
  newAlt: string;
  onAltChange: (value: string) => void;
  onSave: () => void;
}

export const GalleryEditDialog: React.FC<GalleryEditDialogProps> = ({
  open,
  onOpenChange,
  currentImage,
  newAlt,
  onAltChange,
  onSave
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Gallery Image</DialogTitle>
          <DialogDescription>
            Update the caption for this gallery image
          </DialogDescription>
        </DialogHeader>
        
        {currentImage && (
          <div className="grid gap-4 py-4">
            <div className="mx-auto w-full max-w-xs aspect-square overflow-hidden rounded-md border">
              <img 
                src={currentImage.url} 
                alt={currentImage.alt}
                className="h-full w-full object-cover"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-caption" className="text-right">
                Caption
              </Label>
              <Input
                id="edit-caption"
                value={newAlt}
                onChange={(e) => onAltChange(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
