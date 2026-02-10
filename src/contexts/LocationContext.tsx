import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface LocationState {
  city: string | null;
  isDetecting: boolean;
  error: string | null;
}

interface LocationContextType extends LocationState {
  setCity: (city: string) => void;
  detectCity: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const CITY_STORAGE_KEY = 'foodyzone_city';

// Reverse geocode using free Nominatim API
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address;
    return addr?.city || addr?.town || addr?.village || addr?.state_district || addr?.state || null;
  } catch {
    return null;
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>({
    city: null,
    isDetecting: true,
    error: null,
  });

  const setCity = useCallback((city: string) => {
    const normalized = city.trim();
    sessionStorage.setItem(CITY_STORAGE_KEY, normalized);
    setState({ city: normalized, isDetecting: false, error: null });
  }, []);

  const detectCity = useCallback(() => {
    setState(prev => ({ ...prev, isDetecting: true, error: null }));

    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, isDetecting: false, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const city = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (city) {
          setCity(city);
        } else {
          setState(prev => ({ ...prev, isDetecting: false, error: 'Could not detect city' }));
        }
      },
      () => {
        setState(prev => ({ ...prev, isDetecting: false, error: 'Location permission denied' }));
      },
      { timeout: 10000 }
    );
  }, [setCity]);

  useEffect(() => {
    const saved = sessionStorage.getItem(CITY_STORAGE_KEY);
    if (saved) {
      setState({ city: saved, isDetecting: false, error: null });
    } else {
      detectCity();
    }
  }, [detectCity]);

  return (
    <LocationContext.Provider value={{ ...state, setCity, detectCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
}
