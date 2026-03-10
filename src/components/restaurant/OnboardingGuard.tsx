import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMyRestaurantFull } from '@/hooks/useRestaurantOnboarding';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { data: restaurant, isLoading } = useMyRestaurantFull();
  const location = useLocation();

  // Allow access to onboarding and notification pages always
  if (location.pathname === '/restaurant/onboarding' ||
      location.pathname === '/restaurant/notifications' ||
      location.pathname === '/restaurant/notification-settings') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  // No restaurant or not verified → redirect to onboarding
  const status = (restaurant as any)?.verification_status;
  if (!restaurant || (status && status !== 'verified')) {
    return <Navigate to="/restaurant/onboarding" replace />;
  }

  return <>{children}</>;
}
