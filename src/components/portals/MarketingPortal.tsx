
import React from 'react';
import { Badge } from "@/components/ui/badge";
import MessageCenter from '../communication/MessageCenter';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import MarketingDashboard from './marketing/MarketingDashboard';
import CustomerManagement from './marketing/CustomerManagement';
import LeadsManagement from './marketing/LeadsManagement';
import ContentManagement from './marketing/ContentManagement';
import { CampaignsTab, LeadGenerationTab, ReportsTab } from './marketing/MarketingTabs';

interface MarketingPortalProps {
  activeTab: string;
}

const MarketingPortal: React.FC<MarketingPortalProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'customers':
        return <CustomerManagement />;
      case 'leads':
        return <LeadsManagement />;
      case 'content':
        return <ContentManagement />;
      case 'campaigns':
        return <CampaignsTab />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'communication':
        return <MessageCenter />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <MarketingDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Marketing & CRM Portal</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Customer Relationship Management
        </Badge>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default MarketingPortal;
