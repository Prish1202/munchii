export interface Coords { lat: number; lng: number }

/** Great-circle distance in km (haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export async function reverseGeocodeFull(lat: number, lng: number): Promise<{ city: string | null; label: string | null }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const city = a.city || a.town || a.village || a.state_district || a.state || null;
    const local = a.suburb || a.neighbourhood || a.road || a.quarter || null;
    const label = [local, city].filter(Boolean).join(', ') || data.display_name || null;
    return { city, label };
  } catch {
    return { city: null, label: null };
  }
}
