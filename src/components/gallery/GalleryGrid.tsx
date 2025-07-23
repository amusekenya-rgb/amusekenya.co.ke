
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ImageIcon, Edit, Trash2 } from 'lucide-react';

interface ImageItem {
  id: string;
  url: string;
  alt: string;
  section: string;
  uploadedAt: string;
}

interface GalleryGridProps {
  galleryImages: ImageItem[];
  onEdit: (image: ImageItem) => void;
  onDelete: (id: string) => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ galleryImages, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery Images</CardTitle>
        <CardDescription>
          {galleryImages.length} images in gallery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {galleryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2" />
              <p>No gallery images found</p>
              <p className="text-sm">Upload images to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
                <div key={image.id} className="group relative">
                  <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                    <img 
                      src={image.url} 
                      alt={image.alt}
                      className="h-full w-full object-cover transition-all hover:scale-105"
                    />
                  </div>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-white/80 hover:bg-white"
                      onClick={() => onEdit(image)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDelete(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1 text-xs truncate">{image.alt}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
