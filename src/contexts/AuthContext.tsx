import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/roles';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole, department?: string) => Promise<void>;
  sendOtp: (email: string, name: string) => Promise<void>;
  verifyCustomOtp: (email: string, code: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer data fetching to avoid blocking auth state update
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (profile && roleData) {
        setUser({
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: roleData.role as UserRole,
          department: profile.department || undefined,
          isApproved: true,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please verify your email address first.');
      }
      throw error;
    }
    
    // Set session and user immediately
    if (data.session) {
      setSession(data.session);
      if (data.user) {
        fetchUserData(data.user.id);
      }
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole, department?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role,
          department,
        }
      }
    });
    
    if (error) {
      if (error.message?.includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw error;
    }
  };

  const sendOtp = async (email: string, name: string) => {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email, name },
    });

    if (error) {
      console.error('Send OTP error:', error);
      throw new Error('Failed to send verification code');
    }

    if (data?.error) {
      throw new Error(data.error);
    }
  };

  const verifyCustomOtp = async (email: string, code: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: { email, code },
    });

    if (error) {
      console.error('Verify OTP error:', error);
      throw new Error('Failed to verify code');
    }

    if (!data?.valid) {
      throw new Error(data?.error || 'Invalid verification code');
    }

    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, sendOtp, verifyCustomOtp, logout, isAuthenticated: !!user }}>
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
