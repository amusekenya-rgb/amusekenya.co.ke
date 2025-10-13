import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { seedAllContent } from '@/scripts/seedCMSContent';
import { toast } from '@/hooks/use-toast';

const SeedCMSButton: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingComplete, setSeedingComplete] = useState(false);

  const handleSeedContent = async () => {
    setIsSeeding(true);
    try {
      const success = await seedAllContent();
      
      if (success) {
        setSeedingComplete(true);
        toast({
          title: "Content Seeded Successfully",
          description: "All existing website content has been imported into the CMS. You can now manage it from the Marketing Portal.",
        });
      } else {
        toast({
          title: "Seeding Failed",
          description: "There was an error importing content. Please check the console for details.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Seeding error:', error);
      toast({
        title: "Error",
        description: "Failed to seed content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <CardTitle>Import Existing Content</CardTitle>
        </div>
        <CardDescription>
          Migrate all existing website content (hero slides, programs, testimonials, team members) into the CMS database so you can manage it from the Marketing Portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">What will be imported:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Hero Section Slides (4 slides)</li>
            <li>✓ Programs (6 programs)</li>
            <li>✓ Testimonials (3 testimonials)</li>
            <li>✓ Team Members (3 members)</li>
            <li>✓ Site Settings (footer, contact info)</li>
          </ul>
        </div>

        {seedingComplete ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Content successfully imported!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              Note: This will create new CMS entries. Run this only once to avoid duplicates.
            </span>
          </div>
        )}

        <Button 
          onClick={handleSeedContent} 
          disabled={isSeeding || seedingComplete}
          className="w-full"
        >
          {isSeeding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing Content...
            </>
          ) : seedingComplete ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Content Imported
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Import Existing Content to CMS
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SeedCMSButton;
