import { Session } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'restaurant' | 'delivery' | 'admin';

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
}

export interface AuthState {
  user: UserWithRole | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  restaurant: 'Restaurant Partner',
  delivery: 'Delivery Partner',
  admin: 'Admin',
};

export const SIGNUP_ROLES: UserRole[] = ['customer', 'restaurant', 'delivery'];

export const ROLE_ROUTES: Record<UserRole, string> = {
  customer: '/customer',
  restaurant: '/restaurant',
  delivery: '/delivery',
  admin: '/admin',
};
