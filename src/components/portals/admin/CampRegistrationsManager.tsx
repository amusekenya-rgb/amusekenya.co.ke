import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Users, UserPlus, BarChart3, CalendarCheck } from 'lucide-react';
import { AllRegistrationsTab } from './camp/AllRegistrationsTab';
import { AttendanceMarkingTab } from './camp/AttendanceMarkingTab';
import { GroundRegistrationTab } from './camp/GroundRegistrationTab';
import { CampReportsTab } from './camp/CampReportsTab';
import { DailyOperationsView } from './camp/DailyOperationsView';

export const CampRegistrationsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Camp Registrations</h2>
        <p className="text-muted-foreground">
          Manage camp registrations, attendance, and ground check-ins
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto gap-1">
          <TabsTrigger value="daily" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
            <CalendarCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Daily Ops</span>
            <span className="sm:hidden">Today</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
            <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">All</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="ground" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Ground Reg</span>
            <span className="sm:hidden">Ground</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyOperationsView />
        </TabsContent>

        <TabsContent value="all">
          <AllRegistrationsTab />
        </TabsContent>

        <TabsContent value="ground">
          <GroundRegistrationTab />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceMarkingTab />
        </TabsContent>

        <TabsContent value="reports">
          <CampReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
