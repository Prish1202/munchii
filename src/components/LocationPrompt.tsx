import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';

const ASKED_KEY = 'munchii_location_asked_session';

/** Right after login/signup, ask customers for their live location once per session. */
export function LocationPrompt() {
  const { isAuthenticated, user } = useAuth();
  const { requestLiveLocation } = useLocation();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') return;
    if (sessionStorage.getItem(ASKED_KEY)) return;
    sessionStorage.setItem(ASKED_KEY, '1');
    requestLiveLocation();
  }, [isAuthenticated, user?.role, requestLiveLocation]);

  return null;
}
