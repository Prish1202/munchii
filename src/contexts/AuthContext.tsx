import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, UserWithRole, AuthState, ROLE_ROUTES } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string, role: UserRole, phone?: string, city?: string, state?: string, area?: string) => Promise<{ error: string | null }>;
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (!roleData) return null;

      const { data: contact } = await supabase
        .from('user_contact_info')
        .select('phone')
        .eq('user_id', userId)
        .maybeSingle();

      return {
        id: userId,
        email,
        name: profile?.name || email.split('@')[0],
        role: roleData.role as UserRole,
        phone: contact?.phone || null,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({ ...prev, session }));

        if (session?.user) {
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
          setState({ user: null, session: null, isAuthenticated: false, isLoading: false });
        }
      }
    );

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

  const login = async (identifier: string, password: string): Promise<{ error: string | null }> => {
    const id = identifier.trim();

    // Email login
    if (id.includes('@') && !id.startsWith('@')) {
      const { error } = await supabase.auth.signInWithPassword({ email: id, password });
      return { error: error?.message || null };
    }

    // Username login (Foodie accounts only) — resolved server-side
    try {
      const { data, error } = await supabase.functions.invoke('username-login', {
        body: { username: id, password },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let message = 'Invalid username or password';
        try {
          const body = await ctx?.json?.();
          if (body?.error) message = body.error;
        } catch { /* keep default */ }
        return { error: message };
      }
      if (!data?.access_token || !data?.refresh_token) {
        return { error: 'Invalid username or password' };
      }
      const { error: sessErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return { error: sessErr?.message || null };
    } catch (e: any) {
      return { error: e?.message || 'Could not sign in' };
    }
  };


  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    phone?: string,
    city?: string,
    state?: string,
    area?: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${PUBLIC_BASE_URL}/email-verified`,
        data: { name, role, phone, city, state, area },
      },
    });
    return { error: error?.message || null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!isLoading && isAuthenticated && user && allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        navigate(ROLE_ROUTES[user.role]);
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, navigate]);

  return { user, isAuthenticated, isLoading };
}
