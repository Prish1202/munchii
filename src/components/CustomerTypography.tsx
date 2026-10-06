import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** Scope typography at the document level so customer dialogs inherit it too. */
export function CustomerTypography() {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const requestedRole = new URLSearchParams(search).get('role');
  const isMerchantOrAdminRoute = /^\/(restaurant|admin)(\/|$)/.test(pathname)
    || pathname === '/signup/restaurant'
    || requestedRole === 'restaurant'
    || requestedRole === 'admin';
  const isCustomerRoute = /^\/customer(\/|$)/.test(pathname)
    || pathname === '/signup/customer'
    || pathname === '/signup';
  const enabled = !isMerchantOrAdminRoute && (isCustomerRoute || !user || user.role === 'customer');

  useLayoutEffect(() => {
    document.body.classList.toggle('customer-typography', enabled);
    return () => document.body.classList.remove('customer-typography');
  }, [enabled]);

  return null;
}