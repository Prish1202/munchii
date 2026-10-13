import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useCart } from '@/contexts/CartContext';

const ASKED_KEY = 'munchii_location_asked_session';
const LAST_USER_KEY = 'munchii_last_user';

/**
 * Keeps per-device data scoped to the signed-in account (a new account never
 * inherits the previous one's cart or location) and asks customers for their
 * live location on every new sign-in.
 */
export function LocationPrompt() {
  const { isAuthenticated, user } = useAuth();
  const { requestLiveLocation, resetLocation } = useLocation();
  const { clearCart } = useCart();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const last = localStorage.getItem(LAST_USER_KEY);
    if (last !== user.id) {
      localStorage.setItem(LAST_USER_KEY, user.id);
      clearCart();
      resetLocation();
      localStorage.removeItem('foodyzone_dashboard_city');
      sessionStorage.removeItem(ASKED_KEY);
    }
    if (user.role !== 'customer') return;
    if (sessionStorage.getItem(ASKED_KEY) === user.id) return;
    sessionStorage.setItem(ASKED_KEY, user.id);
    requestLiveLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, user?.role]);

  return null;
}
