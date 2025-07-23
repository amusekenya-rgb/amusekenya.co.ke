
import React from 'react';
import InvoiceManagement from './accounts/InvoiceManagement';
import MessageCenter from '../communication/MessageCenter';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import AccountsDashboard from './accounts/AccountsDashboard';
import { PaymentsTab, BudgetTab, ExpensesTab } from './accounts/AccountsPlaceholderTabs';

interface AccountsPortalProps {
  activeTab: string;
}

const AccountsPortal: React.FC<AccountsPortalProps> = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AccountsDashboard />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'communication':
        return <MessageCenter />;
      case 'reports':
        return <AnalyticsDashboard />;
      case 'payments':
        return <PaymentsTab />;
      case 'budget':
        return <BudgetTab />;
      case 'expenses':
        return <ExpensesTab />;
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Accounts Portal</h2>
            <p>Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
};

export default AccountsPortal;
