
import React from 'react';
import { Badge } from "@/components/ui/badge";
import MessageCenter from '../communication/MessageCenter';
import GovernanceDashboard from './governance/GovernanceDashboard';
import DocumentManagement from './governance/DocumentManagement';
import ComplianceFramework from './governance/ComplianceFramework';
import RiskManagement from './governance/RiskManagement';
import PolicyManagement from './governance/PolicyManagement';
import AuditManagement from './governance/AuditManagement';
import DataGovernance from './governance/DataGovernance';

interface GovernancePortalProps {
  activeTab: string;
}

const GovernancePortal: React.FC<GovernancePortalProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'documents':
        return <DocumentManagement />;
      case 'compliance':
        return <ComplianceFramework />;
      case 'risk':
        return <RiskManagement />;
      case 'policies':
        return <PolicyManagement />;
      case 'audit':
        return <AuditManagement />;
      case 'data-governance':
        return <DataGovernance />;
      case 'communication':
        return <MessageCenter />;
      default:
        return <GovernanceDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Governance & Compliance Portal</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Risk & Compliance Management
        </Badge>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default GovernancePortal;
