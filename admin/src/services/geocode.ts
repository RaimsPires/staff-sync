import type { LatLng } from "@/features/onboarding/types";

export interface GeocodeResult {
  id: string;
  line1: string;
  line2: string;
  position: LatLng;
}

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

/**
 * Address search backed by OpenStreetMap Nominatim (free, rate limited to about 1 request/second,
 * so callers debounce). Swap for the backend geocoder or a paid provider in production.
 */
export async function searchAddress(query: string, language: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ format: "jsonv2", addressdetails: "1", limit: "5", q: query, "accept-language": language });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const items = (await res.json()) as NominatimItem[];
  return items.map((i) => {
    const a = i.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const city = a.city ?? a.town ?? a.village;
    return {
      id: String(i.place_id),
      line1: street || i.name || i.display_name.split(",")[0],
      line2: [a.postcode, city, a.country].filter(Boolean).join(" "),
      position: [Number(i.lat), Number(i.lon)] as LatLng,
    };
  });
}
