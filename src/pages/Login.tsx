
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      console.log('Attempting login with:', username, password);
      const success = await login(username, password);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "You have been successfully logged in.",
          variant: "default",
        });
        navigate('/admin');
      } else {
        setLoginError('Invalid username or password');
        toast({
          title: "Login failed",
          description: "Invalid username or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An error occurred during login');
      toast({
        title: "Login error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // For demo purposes, initialize the local storage with admin users if they don't exist
  useEffect(() => {
    const adminUsers = localStorage.getItem('adminUsersData');
    if (!adminUsers) {
      const initialAdmins = [
        {
          id: '1',
          username: 'admin',
          password: 'password', 
          email: 'admin@example.com',
          role: 'ADMIN',
          companyId: 'company-1',
          department: 'Administration',
          permissions: ['manage_users', 'system_config', 'manage_roles'],
          isSuperAdmin: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          username: 'user',
          password: 'password', 
          email: 'user@example.com',
          role: 'COACH',
          companyId: 'company-1',
          department: 'Programs',
          permissions: ['manage_programs', 'view_student_data', 'manage_schedules'],
          isSuperAdmin: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          username: 'ceo',
          password: 'password', 
          email: 'ceo@example.com',
          role: 'CEO',
          companyId: 'company-1',
          department: 'Executive',
          permissions: ['view_all_data', 'approve_expenses', 'view_financial_data'],
          isSuperAdmin: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          username: 'marketing',
          password: 'password', 
          email: 'marketing@example.com',
          role: 'MARKETING',
          companyId: 'company-1',
          department: 'Marketing',
          permissions: ['manage_customers', 'view_customer_data', 'manage_campaigns'],
          isSuperAdmin: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          username: 'hr',
          password: 'password', 
          email: 'hr@example.com',
          role: 'HR',
          companyId: 'company-1',
          department: 'Human Resources',
          permissions: ['manage_employees', 'view_hr_reports', 'manage_recruitment'],
          isSuperAdmin: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '6',
          username: 'accounts',
          password: 'password', 
          email: 'accounts@example.com',
          role: 'ACCOUNTS',
          companyId: 'company-1',
          department: 'Finance',
          permissions: ['view_financial_data', 'manage_invoices'],
          isSuperAdmin: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '7',
          username: 'governance',
          password: 'password', 
          email: 'governance@example.com',
          role: 'GOVERNANCE',
          companyId: 'company-1',
          department: 'Risk & Compliance',
          permissions: ['manage_policies', 'manage_compliance', 'manage_risk', 'view_audit_trails', 'manage_data_governance'],
          isSuperAdmin: false,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('adminUsersData', JSON.stringify(initialAdmins));
      console.log('Demo admin accounts created:', initialAdmins);
    } else {
      console.log('Existing admin accounts found in localStorage');
      try {
        const parsedAdmins = JSON.parse(adminUsers);
        console.log('Current admin accounts:', parsedAdmins);
      } catch (e) {
        console.error('Error parsing admin accounts:', e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-50 px-4 relative">
      <Button 
        variant="ghost"
        size="icon"
        onClick={handleBackToHome}
        className="absolute top-4 left-4 z-10 rounded-full"
        aria-label="Back to home"
      >
        <Home size={24} className="text-gray-700" />
      </Button>
      
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <span className="font-medium">Error</span>
              </span>
              <span className="block sm:inline ml-7">{loginError}</span>
            </div>
          )}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input 
              type="text" 
              id="username" 
              placeholder="Enter your username" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              type="password" 
              id="password" 
              placeholder="Enter your password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
          <p className="text-center text-sm text-gray-600 mt-2">
            Demo accounts available with different roles
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              CEO Portal: ceo/password
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              Admin Portal: admin/password
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              HR Portal: hr/password
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              Marketing: marketing/password
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              Accounts: accounts/password
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              Coach Portal: user/password
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              Governance: governance/password
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
