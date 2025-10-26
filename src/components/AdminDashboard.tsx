import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, Settings, FileText, Shield, Building, Database, MessageSquare, BarChart3 } from "lucide-react";
import SystemAdministration from './SystemAdministration';
import { CampRegistrationsManager } from './portals/admin/CampRegistrationsManager';
import MessageCenter from './communication/MessageCenter';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import CustomerDashboard from './admin/CustomerDashboard';
import UserManagement from './admin/UserManagement';

interface AdminDashboardProps {
  activeTab: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'settings':
        return renderSystemSettings();
      case 'audit':
        return renderAuditLogs();
      case 'company':
        return renderCompanyConfig();
      case 'security':
        return renderSecurity();
      case 'system':
        return <SystemAdministration />;
      case 'communication':
        return <MessageCenter />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'customers':
        return <CustomerDashboard />;
      case 'camp-registrations':
        return <CampRegistrationsManager />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              Active system users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">
              Uptime this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">
              Currently logged in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No active alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Key system metrics and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <h4 className="font-medium">Database Status</h4>
                <p className="text-sm text-muted-foreground">All systems operational</p>
              </div>
              <Badge variant="default">Healthy</Badge>
            </div>
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <h4 className="font-medium">Backup Status</h4>
                <p className="text-sm text-muted-foreground">Last backup: 2 hours ago</p>
              </div>
              <Badge variant="default">Complete</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );


  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-gray-600">Configure system-wide settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">System-wide email settings</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex justify-between items-center p-4 border rounded">
              <div>
                <h4 className="font-medium">Session Timeout</h4>
                <p className="text-sm text-muted-foreground">User session management</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-gray-600">View system activity and audit trail</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">User Login</h4>
              <p className="text-sm text-muted-foreground">admin@company.com logged in • 2 hours ago</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">Program Created</h4>
              <p className="text-sm text-muted-foreground">New program "Summer Camp" created • 4 hours ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompanyConfig = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Company Configuration</h2>
        <p className="text-gray-600">Manage company-wide settings and branding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded">
              <div>
                <h4 className="font-medium">Company Details</h4>
                <p className="text-sm text-muted-foreground">Name, address, contact information</p>
              </div>
              <Button variant="outline">Edit</Button>
            </div>
            <div className="flex justify-between items-center p-4 border rounded">
              <div>
                <h4 className="font-medium">Branding</h4>
                <p className="text-sm text-muted-foreground">Logo, colors, theme settings</p>
              </div>
              <Button variant="outline">Customize</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Management</h2>
        <p className="text-gray-600">Monitor and configure security settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">Secure</div>
            <p className="text-sm text-muted-foreground">No threats detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed Login Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          System Administration
        </Badge>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default AdminDashboard;
