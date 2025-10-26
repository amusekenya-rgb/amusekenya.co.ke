import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  CheckSquare,
  Calendar,
  Megaphone,
  Target,
  UserPlus,
  TrendingUp,
  BookOpen,
  CreditCard,
  DollarSign,
  Receipt,
  Clock,
  Building,
  Shield,
  Database,
  MessageSquare,
  Menu,
  X,
  Tent
} from "lucide-react";
import { ROLES } from '@/services/roleService';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface PortalSidebarProps {
  userRole: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  username: string;
  department: string;
  children: React.ReactNode;
}

const PortalSidebar: React.FC<PortalSidebarProps> = ({ 
  userRole, 
  activeTab, 
  onTabChange, 
  username, 
  department, 
  children 
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTabsForRole = (role: string) => {
    const baseTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ];

    switch (role) {
      case ROLES.CEO:
        return [
          ...baseTabs,
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'approvals', label: 'Approvals', icon: CheckSquare },
          { id: 'planning', label: 'Planning', icon: Calendar },
          { id: 'communication', label: 'Communication', icon: MessageSquare },
          { id: 'cross-analytics', label: 'Cross Analytics', icon: TrendingUp },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      
      case ROLES.MARKETING:
        return [
          ...baseTabs,
          { id: 'leads', label: 'Leads (CRM)', icon: Target },
          { id: 'content', label: 'Content (CMS)', icon: FileText },
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'faq', label: 'FAQ Manager', icon: MessageSquare },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'communication', label: 'Messages', icon: MessageSquare }
        ];
      
      case ROLES.HR:
        return [
          ...baseTabs,
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'recruitment', label: 'Recruitment', icon: UserPlus },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'training', label: 'Training', icon: BookOpen },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'communication', label: 'Messages', icon: MessageSquare }
        ];
      
      case ROLES.ACCOUNTS:
        return [
          ...baseTabs,
          { id: 'invoices', label: 'Invoices', icon: FileText },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'budget', label: 'Budget', icon: DollarSign },
          { id: 'expenses', label: 'Expenses', icon: Receipt },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'communication', label: 'Messages', icon: MessageSquare }
        ];
      
      case ROLES.COACH:
        return [
          ...baseTabs,
          { id: 'programs', label: 'Programs', icon: Calendar },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'schedule', label: 'Schedule', icon: Clock },
          { id: 'resources', label: 'Resources', icon: BookOpen },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'communication', label: 'Messages', icon: MessageSquare }
        ];
      
      case ROLES.GOVERNANCE:
        return [
          ...baseTabs,
          { id: 'documents', label: 'Document Management', icon: FileText },
          { id: 'compliance', label: 'GDPR Compliance', icon: Shield },
          { id: 'risk', label: 'Risk Management', icon: TrendingUp },
          { id: 'policies', label: 'Policy Management', icon: BookOpen },
          { id: 'audit', label: 'Audit Logs', icon: Database },
          { id: 'data-governance', label: 'Data Governance', icon: Settings },
          { id: 'communication', label: 'Messages', icon: MessageSquare }
        ];
      
      case ROLES.ADMIN:
        return [
          ...baseTabs,
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'customers', label: 'Customer Management', icon: Users },
          { id: 'camp-registrations', label: 'Camp Registrations', icon: Tent },
          { id: 'system', label: 'System Admin', icon: Database },
          { id: 'settings', label: 'System Settings', icon: Settings },
          { id: 'audit', label: 'Audit Logs', icon: FileText },
          { id: 'company', label: 'Company Config', icon: Building },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'communication', label: 'Messages', icon: MessageSquare },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      
      default:
        return baseTabs;
    }
  };

  const tabs = getTabsForRole(userRole);

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white">
      {/* Brand */}
      <div className="px-6 py-4 border-b">
        <h1 className="text-lg font-semibold text-gray-800">Amuse.Ke Portal</h1>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-auto w-full items-center justify-start rounded-md px-2 py-2 text-sm font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt={username} />
                  <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-left">
                  <div className="font-semibold">{username}</div>
                  <div className="text-xs text-gray-500">{department}</div>
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`w-full justify-start ${activeTab === tab.id ? 'text-blue-600 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{tab.label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-base font-semibold text-gray-800">Amuse.Ke Portal</h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt={username} />
                  <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>{username}</div>
                <div className="text-xs text-gray-500 font-normal">{department}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="w-64 flex-shrink-0 border-r">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
};

export default PortalSidebar;
