
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon, Upload } from 'lucide-react';

interface GalleryUploadFormProps {
  onUpload: (file: File, alt: string) => void;
  isUploading: boolean;
}

export const GalleryUploadForm: React.FC<GalleryUploadFormProps> = ({ onUpload, isUploading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, imageAlt || selectedFile.name);
      setSelectedFile(null);
      setImageAlt('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery Management</CardTitle>
        <CardDescription>
          Upload and manage images for the gallery section
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gallery-upload">Select Image</Label>
                <Input 
                  id="gallery-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-caption">Caption</Label>
                <Input
                  id="image-caption"
                  placeholder="Enter a caption for this image"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !selectedFile}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Add to Gallery"}
              </Button>
            </div>
            
            <div className="border rounded-md p-4">
              {selectedFile ? (
                <div className="aspect-square flex items-center justify-center overflow-hidden rounded-md bg-muted">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <span className="text-sm">Image preview will appear here</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
