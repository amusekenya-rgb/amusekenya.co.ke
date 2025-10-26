import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

export const GroundRegistrationTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Ground Registration
        </CardTitle>
        <CardDescription>
          Register walk-in participants directly at the camp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Ground Registration Form</p>
          <p className="text-sm">Coming soon - Register participants on-site</p>
        </div>
      </CardContent>
    </Card>
  );
};
