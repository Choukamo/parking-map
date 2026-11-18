import type { ParkingAvailability } from "@/types/parking";

export type SortOption =
  | "default"
  | "distance-asc"
  | "distance-desc"
  | "price-asc"
  | "price-desc"
  | "capacity-desc";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type ParkingWithDistance = ParkingAvailability & {
  distanceKm?: number;
};

/**
 * Calcule la distance orthodromique (en kilomètres) entre deux coordonnées GPS
 * en utilisant la formule de Haversine.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Formate une distance en kilomètres pour un affichage lisible
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Génère le lien universel d'itinéraire vers Google Maps
 */
export function getGoogleMapsDirectionsUrl(
  lat: number,
  lon: number,
  parkingName?: string
): string {
  const query = parkingName ? `${parkingName}, Paris` : `${lat},${lon}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(
    query
  )}`;
}

/**
 * Trie une liste de parkings selon l'option choisie et la position utilisateur
 */
export function sortParkings(
  parkings: ParkingAvailability[],
  sortOption: SortOption,
  userLocation: Coordinates | null
): ParkingWithDistance[] {
  const listWithDistance: ParkingWithDistance[] = parkings.map((p) => {
    if (userLocation) {
      const distanceKm = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        p.location.latitude,
        p.location.longitude
      );
      return { ...p, distanceKm };
    }
    return { ...p, distanceKm: undefined };
  });

  return listWithDistance.sort((a, b) => {
    switch (sortOption) {
      case "distance-asc": {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      }
      case "distance-desc": {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return b.distanceKm - a.distanceKm;
      }
      case "price-asc": {
        const priceA = a.pricing?.oneHour;
        const priceB = b.pricing?.oneHour;
        if (priceA === undefined && priceB === undefined) return 0;
        if (priceA === undefined) return 1;
        if (priceB === undefined) return -1;
        return priceA - priceB;
      }
      case "price-desc": {
        const priceA = a.pricing?.oneHour;
        const priceB = b.pricing?.oneHour;
        if (priceA === undefined && priceB === undefined) return 0;
        if (priceA === undefined) return 1;
        if (priceB === undefined) return -1;
        return priceB - priceA;
      }
      case "capacity-desc": {
        const capA = a.capacity || 0;
        const capB = b.capacity || 0;
        return capB - capA;
      }
      case "default":
      default:
        return 0;
    }
  });
}
