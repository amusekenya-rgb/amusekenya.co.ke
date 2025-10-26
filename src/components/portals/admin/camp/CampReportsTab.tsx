import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export const CampReportsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Reports & Analytics
        </CardTitle>
        <CardDescription>
          View attendance statistics and payment summaries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Reports Dashboard</p>
          <p className="text-sm">Coming soon - Analytics and insights</p>
        </div>
      </CardContent>
    </Card>
  );
};
