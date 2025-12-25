export type UserRole = 'customer' | 'restaurant' | 'delivery' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  restaurant: 'Restaurant Partner',
  delivery: 'Delivery Partner',
  admin: 'Admin',
};

export const ROLE_ROUTES: Record<UserRole, string> = {
  customer: '/customer',
  restaurant: '/restaurant',
  delivery: '/delivery',
  admin: '/admin',
};
