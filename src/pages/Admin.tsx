
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/AdminSidebar";
import RoleBasedPortal from "@/components/RoleBasedPortal";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDisplayName } from "@/services/roleService";

const Admin = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user, isSuperAdmin, login, logout } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentAdminUsername, setCurrentAdminUsername] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleBackToHome = () => {
    navigate('/');
  };

  useSessionTimeout({
    timeoutDuration: 3 * 60 * 1000,
    warningDuration: 30 * 1000,
    redirectPath: '/',
    onTimeout: () => {
      logout();
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const success = await login(username, password);
      
      if (success) {
        setCurrentAdminUsername(username);
        setLoginError('');
        
        toast({
          title: `Welcome ${username}`,
          description: "You have successfully logged in.",
          duration: 3000,
        });
      } else {
        setLoginError('Invalid username or password');
        
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An error occurred during login');
      
      toast({
        title: "Login Error",
        description: "An unexpected error occurred during login.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      setIsLoading(false);
    } else {
      if (user) {
        setCurrentAdminUsername(user.username || 'admin');
      }
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      duration: 3000,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
        <Button 
          variant="ghost"
          size="icon"
          onClick={handleBackToHome}
          className="absolute top-4 left-4 z-10 rounded-full"
          aria-label="Back to home"
        >
          <Home size={24} className="text-gray-700" />
        </Button>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Portal Login</CardTitle>
            <CardDescription>
              Please login to access your portal dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col justify-center space-y-2">
            <p className="text-sm text-gray-500 mb-2">
              Demo Accounts (all use password: 'password')
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="px-2 py-1 bg-gray-100 rounded text-center">CEO: ceo</div>
              <div className="px-2 py-1 bg-gray-100 rounded text-center">Admin: admin</div>
              <div className="px-2 py-1 bg-gray-100 rounded text-center">HR: hr</div>
              <div className="px-2 py-1 bg-gray-100 rounded text-center">Marketing: marketing</div>
              <div className="px-2 py-1 bg-gray-100 rounded text-center">Accounts: accounts</div>
              <div className="px-2 py-1 bg-gray-100 rounded text-center">Coach: user</div>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-lg text-gray-700">Loading portal dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getRoleDisplayName(user?.role || 'ADMIN')} Portal
            </h1>
            <p className="text-sm text-gray-600">
              Welcome back, {user?.username} • {user?.department}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        <RoleBasedPortal />
      </div>
    </div>
  );
};

export default Admin;
