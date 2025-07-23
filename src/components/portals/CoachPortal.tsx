
import React from 'react';
import { Badge } from "@/components/ui/badge";
import MessageCenter from '../communication/MessageCenter';
import CoachDashboard from './coach/CoachDashboard';
import { ProgramsTab, ScheduleTab, StudentsTab, ResourcesTab, ReportsTab } from './coach/CoachTabs';

interface CoachPortalProps {
  activeTab: string;
}

const CoachPortal: React.FC<CoachPortalProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'programs':
        return <ProgramsTab />;
      case 'schedule':
        return <ScheduleTab />;
      case 'students':
        return <StudentsTab />;
      case 'resources':
        return <ResourcesTab />;
      case 'reports':
        return <ReportsTab />;
      case 'communication':
        return <MessageCenter />;
      default:
        return <CoachDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Coach Portal</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Coaching Management
        </Badge>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default CoachPortal;
