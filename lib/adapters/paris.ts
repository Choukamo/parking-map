import type { ParkingAvailability, ParkingStatus, FacilityType } from "../../types/parking";

export interface ParisRawRecord {
  id?: string;
  nom?: string;
  adresse?: string;
  url?: string;
  deleg?: string;
  arrdt?: string;
  horaire_na?: string;
  nb_places?: number | null;
  nb_pmr?: number | null;
  nb_velo?: number | null;
  nb_2_rm?: number | null;
  tarif_1h?: number | null;
  tarif_2h?: number | null;
  tarif_3h?: number | null;
  tarif_24h?: number | null;
  mis_a_jour?: string;
  xlong?: number | null;
  ylat?: number | null;
  geo_point_2d?: {
    lon: number;
    lat: number;
  };
}

export interface ParisApiResponse {
  total_count?: number;
  results?: ParisRawRecord[];
}

/**
 * Normalise le nom du parking pour un affichage lisible
 */
export function cleanParkingName(name?: string): string {
  if (!name) return "Parking public";
  const trimmed = name.trim();
  // Remplacer les majuscules intégrales par une casse soignée
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .split(/([\s\-'’]+)/)
      .map((token) => {
        if (/^[\s\-'’]+$/.test(token)) return token;
        return token.charAt(0).toUpperCase() + token.slice(1);
      })
      .join("");
  }
  return trimmed;
}

/**
 * Formate l'arrondissement parisien ou le département périphérique de manière rigoureuse
 */
export function formatArrondissement(arrdt?: string): string | undefined {
  if (!arrdt) return undefined;
  const trimmed = arrdt.trim();
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return trimmed;
  if (num === 1) return "1er arr.";
  if (num >= 2 && num <= 20) return `${num}e arr.`;
  if (num > 20) return `Dép. ${num}`;
  return `${trimmed}e arr.`;
}

/**
 * Détermine le statut d'ouverture d'après le libellé horaire
 */
export function parseStatus(horaire?: string): ParkingStatus {
  if (!horaire) return "unknown";
  const lower = horaire.toLowerCase();
  if (lower.includes("fermé") || lower.includes("ferme")) {
    return "closed";
  }
  if (lower.includes("24h") || lower.includes("7j") || lower.includes("ouvert")) {
    return "open";
  }
  return "unknown";
}

/**
 * Vérifie si les coordonnées géographiques sont valides et situées dans la région parisienne
 */
export function isValidParisLocation(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= 48.7 &&
    lat <= 49.05 &&
    lon >= 2.1 &&
    lon <= 2.55
  );
}

/**
 * Adaptateur pour le jeu de données "stationnement-en-ouvrage" de la Ville de Paris.
 * Source officielle : https://opendata.paris.fr/explore/dataset/stationnement-en-ouvrage/
 * Licence : Licence Ouverte (Etalab 2.0)
 */
export function adaptParisParkingRecord(
  record: ParisRawRecord
): ParkingAvailability | null {
  if (!record || !record.id) {
    return null;
  }

  // Coordonnées géographiques (priorité à geo_point_2d, fallback sur ylat/xlong)
  const latitude = record.geo_point_2d?.lat ?? record.ylat;
  const longitude = record.geo_point_2d?.lon ?? record.xlong;

  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude === null ||
    longitude === null ||
    !isValidParisLocation(latitude, longitude)
  ) {
    // Rejeter les enregistrements sans localisation valide
    return null;
  }

  // Détection des installations dédiées aux vélos (ex: Vélostation Van Gogh / Montparnasse)
  const isBicycleStation =
    (!record.nb_places || record.nb_places === 0) &&
    Boolean(record.nb_velo && record.nb_velo > 0);

  const facilityType: FacilityType = isBicycleStation ? "bicycle-station" : "car";

  // Capacité totale (voitures si car, sinon vélos si vélostation)
  let capacity: number | undefined = undefined;
  if (
    record.nb_places !== null &&
    record.nb_places !== undefined &&
    record.nb_places > 0
  ) {
    capacity = Math.floor(record.nb_places);
  } else if (isBicycleStation && record.nb_velo) {
    capacity = Math.floor(record.nb_velo);
  }

  // RÈGLE FONDAMENTALE : Ne jamais inventer de places disponibles si la source ne les fournit pas
  // Ce dataset municipal officiel ne transmettant pas de capteurs temps réel de places libres,
  // availableSpaces reste strictement undefined (jamais 0).
  const availableSpaces: number | undefined = undefined;

  return {
    id: `paris-${record.id}`,
    name: cleanParkingName(record.nom),
    location: {
      latitude,
      longitude,
    },
    capacity,
    availableSpaces,
    status: parseStatus(record.horaire_na),
    observedAt: record.mis_a_jour || new Date().toISOString(),
    sourceId: "paris-data-stationnement-en-ouvrage",
    confidence: "unknown", // Donnée officielle statique/référentielle
    facilityType,
    address: record.adresse?.trim() || undefined,
    operator: record.deleg?.trim() || undefined,
    arrondissement: formatArrondissement(record.arrdt),
    openingHours: record.horaire_na?.trim() || undefined,
    pricing: {
      oneHour: record.tarif_1h ?? undefined,
      twoHours: record.tarif_2h ?? undefined,
      threeHours: record.tarif_3h ?? undefined,
      twentyFourHours: record.tarif_24h ?? undefined,
    },
    prmSpaces: record.nb_pmr && record.nb_pmr > 0 ? record.nb_pmr : undefined,
    bicycleSpaces: record.nb_velo && record.nb_velo > 0 ? record.nb_velo : undefined,
    motorcycleSpaces: record.nb_2_rm && record.nb_2_rm > 0 ? record.nb_2_rm : undefined,
    url: record.url?.trim() || undefined,
  };
}

/**
 * Transforme l'ensemble de la réponse de l'API OpenData Paris
 */
export function transformParisApiResponse(
  apiData: ParisApiResponse
): ParkingAvailability[] {
  if (!apiData || !Array.isArray(apiData.results)) {
    return [];
  }

  return apiData.results
    .map(adaptParisParkingRecord)
    .filter((item): item is ParkingAvailability => item !== null);
}
