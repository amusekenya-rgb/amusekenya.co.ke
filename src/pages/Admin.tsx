import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Home, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import RoleBasedPortal from "@/components/RoleBasedPortal";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDisplayName } from "@/services/roleService";
import AuthSystemSetup from "@/components/admin/AuthSystemSetup";
const Admin = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    login,
    signup,
    logout
  } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setError('');
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in."
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const result = await signup(email, password);
      if (!result.success && result.error) {
        setError(result.error);
        toast({
          title: "Signup Failed",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration Submitted!",
          description: "Please check your email to confirm your account. Once confirmed, an administrator will review and approve your access.",
          duration: 6000
        });
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
    }
  };
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);
  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      duration: 3000
    });
  };
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
        <Button variant="ghost" size="icon" onClick={handleBackToHome} className="absolute top-4 left-4 z-10 rounded-full" aria-label="Back to home">
          <Home size={24} className="text-gray-700" />
        </Button>
        
        <div className="w-full max-w-md space-y-4">
          <AuthSystemSetup />
          
          <Card className="w-full">
          <CardHeader>
            <CardTitle>Portal Access</CardTitle>
            <CardDescription>
              Login or create an account to access your portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  {error && <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="pr-10" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            
          </CardContent>
        </Card>
        </div>
      </div>;
  }
  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-lg text-gray-700">Loading portal dashboard...</p>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
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
    </div>;
};
export default Admin;