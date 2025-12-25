import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, UserWithRole, AuthState, ROLE_ROUTES } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  loginWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchUserWithRole = async (userId: string, email: string): Promise<UserWithRole | null> => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (!roleData) {
        return null;
      }

      return {
        id: userId,
        email,
        name: profile?.name || email.split('@')[0],
        role: roleData.role as UserRole,
        phone: profile?.phone || null,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({ ...prev, session }));
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(async () => {
            const userWithRole = await fetchUserWithRole(session.user.id, session.user.email || '');
            setState({
              user: userWithRole,
              session,
              isAuthenticated: !!userWithRole,
              isLoading: false,
            });
          }, 0);
        } else {
          setState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userWithRole = await fetchUserWithRole(session.user.id, session.user.email || '');
        setState({
          user: userWithRole,
          session,
          isAuthenticated: !!userWithRole,
          isLoading: false,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const loginWithPhone = async (phone: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const verifyOtp = async (phone: string, token: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Insert user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role });

      if (roleError) {
        console.error('Error inserting role:', roleError);
        return { error: 'Failed to set user role. Please try again.' };
      }
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithPhone, verifyOtp, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    } else if (!isLoading && isAuthenticated && user && allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        navigate(ROLE_ROUTES[user.role]);
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, navigate]);

  return { user, isAuthenticated, isLoading };
}
