import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, UserPlus, BarChart3 } from 'lucide-react';
import { AllRegistrationsTab } from './camp/AllRegistrationsTab';
import { AttendanceMarkingTab } from './camp/AttendanceMarkingTab';
import { GroundRegistrationTab } from './camp/GroundRegistrationTab';
import { CampReportsTab } from './camp/CampReportsTab';

export const CampRegistrationsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Camp Registrations</h2>
        <p className="text-muted-foreground">
          Manage camp registrations, attendance, and ground check-ins
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            All Registrations
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="ground" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Ground Registration
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AllRegistrationsTab />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceMarkingTab />
        </TabsContent>

        <TabsContent value="ground">
          <GroundRegistrationTab />
        </TabsContent>

        <TabsContent value="reports">
          <CampReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
