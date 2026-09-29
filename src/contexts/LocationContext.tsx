import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Coords, reverseGeocodeFull } from '@/lib/geo';

interface LocationState {
  city: string | null;
  coords: Coords | null;
  addressLabel: string | null;
  isDetecting: boolean;
  error: string | null;
}

interface LocationContextType extends LocationState {
  setCity: (city: string) => void;
  detectCity: () => void;
  /** Ask for live location via the standard Geolocation API. */
  requestLiveLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const CITY_STORAGE_KEY = 'foodyzone_city';
const COORDS_KEY = 'munchii_live_coords';

function loadCoords(): { coords: Coords | null; label: string | null } {
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (!raw) return { coords: null, label: null };
    const p = JSON.parse(raw);
    if (typeof p.lat === 'number' && typeof p.lng === 'number') return { coords: { lat: p.lat, lng: p.lng }, label: p.label ?? null };
  } catch { /* ignore */ }
  return { coords: null, label: null };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const initial = loadCoords();
  const [state, setState] = useState<LocationState>({
    city: null,
    coords: initial.coords,
    addressLabel: initial.label,
    isDetecting: false,
    error: null,
  });

  const setCity = useCallback((city: string) => {
    const normalized = city.trim();
    localStorage.setItem(CITY_STORAGE_KEY, normalized);
    sessionStorage.setItem(CITY_STORAGE_KEY, normalized);
    setState(prev => ({ ...prev, city: normalized, isDetecting: false, error: null }));
  }, []);

  const requestLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, isDetecting: false, error: 'Geolocation not supported' }));
      return;
    }
    setState(prev => ({ ...prev, isDetecting: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setState(prev => ({ ...prev, coords, isDetecting: false }));
        const { city, label } = await reverseGeocodeFull(coords.lat, coords.lng);
        localStorage.setItem(COORDS_KEY, JSON.stringify({ ...coords, label }));
        if (city) {
          localStorage.setItem(CITY_STORAGE_KEY, city);
          sessionStorage.setItem(CITY_STORAGE_KEY, city);
        }
        setState(prev => ({ ...prev, coords, addressLabel: label, city: city || prev.city }));
      },
      () => setState(prev => ({ ...prev, isDetecting: false, error: 'Location permission denied' })),
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  }, []);

  const detectCity = requestLiveLocation;

  useEffect(() => {
    const saved = sessionStorage.getItem(CITY_STORAGE_KEY) || localStorage.getItem(CITY_STORAGE_KEY);
    if (saved) setState(prev => ({ ...prev, city: saved }));
  }, []);

  return (
    <LocationContext.Provider value={{ ...state, setCity, detectCity, requestLiveLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
}
