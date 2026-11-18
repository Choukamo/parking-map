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

export interface ParkingFilters {
  search?: string;
  sortOption: SortOption;
  radiusKm?: number | "all"; // ex: 0.5, 1, 2, 5 ou "all"
  maxPriceOneHour?: number; // ex: 3.5, 4.5, 5.5
  operator?: string; // "all", "INDIGO", "SAEMES", etc.
  onlyOpen24?: boolean;
  onlyPrm?: boolean;
  onlyBicycle?: boolean;
  onlyMotorcycle?: boolean;
}

/**
 * Coordonnées par défaut du centre de Paris (Hôtel de Ville)
 */
export const PARIS_DEFAULT_COORDS: Coordinates = {
  latitude: 48.8566,
  longitude: 2.3522,
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
 * Filtre et trie une liste de parkings selon les critères et le point de référence (utilisateur ou centre)
 */
export function filterAndSortParkings(
  parkings: ParkingAvailability[],
  filters: ParkingFilters,
  referenceCoords: Coordinates | null
): ParkingWithDistance[] {
  // 1. Calcul de la distance par rapport au point de référence
  let list: ParkingWithDistance[] = parkings.map((p) => {
    if (referenceCoords) {
      const distanceKm = calculateDistanceKm(
        referenceCoords.latitude,
        referenceCoords.longitude,
        p.location.latitude,
        p.location.longitude
      );
      return { ...p, distanceKm };
    }
    return { ...p, distanceKm: undefined };
  });

  // 2. Filtre par rayon (ex: 0.5km, 1km, 2km, 5km)
  if (
    filters.radiusKm !== undefined &&
    filters.radiusKm !== "all" &&
    filters.radiusKm > 0
  ) {
    list = list.filter(
      (p) => p.distanceKm !== undefined && p.distanceKm <= (filters.radiusKm as number)
    );
  }

  // 3. Filtre textuel
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.operator && p.operator.toLowerCase().includes(q)) ||
        (p.arrondissement && p.arrondissement.toLowerCase().includes(q))
    );
  }

  // 4. Filtre prix max (tarif 1h)
  if (filters.maxPriceOneHour !== undefined && filters.maxPriceOneHour > 0) {
    list = list.filter(
      (p) =>
        p.pricing?.oneHour !== undefined &&
        p.pricing.oneHour <= filters.maxPriceOneHour!
    );
  }

  // 5. Filtre opérateur
  if (filters.operator && filters.operator !== "all") {
    const targetOp = filters.operator.toUpperCase();
    list = list.filter(
      (p) => p.operator && p.operator.toUpperCase().includes(targetOp)
    );
  }

  // 6. Filtre ouvert 24h
  if (filters.onlyOpen24) {
    list = list.filter((p) => {
      const h = (p.openingHours || "").toLowerCase();
      return h.includes("24h") || h.includes("24/24") || h.includes("7j");
    });
  }

  // 7. Filtre PMR
  if (filters.onlyPrm) {
    list = list.filter((p) => p.prmSpaces !== undefined && p.prmSpaces > 0);
  }

  // 8. Filtre vélos
  if (filters.onlyBicycle) {
    list = list.filter((p) => p.bicycleSpaces !== undefined && p.bicycleSpaces > 0);
  }

  // 9. Filtre 2 roues
  if (filters.onlyMotorcycle) {
    list = list.filter(
      (p) => p.motorcycleSpaces !== undefined && p.motorcycleSpaces > 0
    );
  }

  // 10. Tri
  return list.sort((a, b) => {
    switch (filters.sortOption) {
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
        // Par défaut, si une position est connue, trier naturellement par distance pour la pertinence
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
    }
  });
}
