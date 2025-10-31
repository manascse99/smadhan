import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/roles';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole, department?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('loksamadhan_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in production this would call an API
    const mockUser: User = {
      id: '1',
      email,
      fullName: 'Test User',
      role: UserRole.CITIZEN,
      isApproved: true,
    };
    
    setUser(mockUser);
    localStorage.setItem('loksamadhan_user', JSON.stringify(mockUser));
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole, department?: string) => {
    // Mock signup
    const newUser: User = {
      id: Date.now().toString(),
      email,
      fullName,
      role,
      department,
      isApproved: role === UserRole.CITIZEN, // Citizens are auto-approved, officers need admin approval
    };

    if (role === UserRole.OFFICER) {
      // Store pending officer for admin approval
      const pendingOfficers = JSON.parse(localStorage.getItem('pending_officers') || '[]');
      pendingOfficers.push(newUser);
      localStorage.setItem('pending_officers', JSON.stringify(pendingOfficers));
    } else {
      setUser(newUser);
      localStorage.setItem('loksamadhan_user', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('loksamadhan_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
