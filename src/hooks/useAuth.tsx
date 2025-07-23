
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticateAdmin, getAdminByUsername, initializeAdminUsers } from '@/utils/adminAuth';
import { ROLE_PERMISSIONS } from '@/services/roleService';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    try {
      const storedUser = localStorage.getItem('currentAdmin');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsSuperAdmin(!!parsedUser.isSuperAdmin || parsedUser.role === 'CEO');
        console.log('Auth restored for:', parsedUser.username, 'Role:', parsedUser.role);
      }
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      localStorage.removeItem('currentAdmin');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Login attempt for:', username);
      
      // Ensure we have the correct admin users structure
      const adminUsersData = localStorage.getItem('adminUsersData');
      if (!adminUsersData) {
        console.log('No admin users found, initializing...');
        initializeAdminUsers();
      } else {
        try {
          const adminUsers = JSON.parse(adminUsersData);
          const firstUser = adminUsers[0];
          if (!firstUser.role || !firstUser.permissions) {
            console.log('Old admin structure detected, reinitializing...');
            initializeAdminUsers();
          }
        } catch (parseError) {
          console.log('Error parsing admin data, reinitializing...');
          initializeAdminUsers();
        }
      }

      const isAuthenticated = authenticateAdmin(username, password);
      console.log('Authentication result:', isAuthenticated);
      
      if (isAuthenticated) {
        const adminUser = getAdminByUsername(username);
        console.log('Admin user found:', adminUser);
        
        if (adminUser) {
          const userToStore = {
            id: adminUser.id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
            department: adminUser.department,
            permissions: adminUser.permissions,
            companyId: adminUser.companyId,
            isSuperAdmin: adminUser.isSuperAdmin || adminUser.role === 'CEO'
          };
          
          localStorage.setItem('currentAdmin', JSON.stringify(userToStore));
          setUser(userToStore);
          setIsSuperAdmin(!!userToStore.isSuperAdmin);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('currentAdmin');
    setUser(null);
    setIsSuperAdmin(false);
  };

  // Create the context value object
  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
