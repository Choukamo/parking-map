export type ParkingStatus = "open" | "closed" | "unknown";

export type ParkingConfidence = "official-realtime" | "historical-estimate" | "unknown";

export type FacilityType = "car" | "bicycle-station";

export interface ParkingPricing {
  oneHour?: number;
  twoHours?: number;
  threeHours?: number;
  twentyFourHours?: number;
}

export interface ParkingAvailability {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity?: number;
  availableSpaces?: number;
  status: ParkingStatus;
  observedAt: string;
  sourceId: string;
  confidence: ParkingConfidence;
  facilityType?: FacilityType;

  // Métadonnées officielles complémentaires
  address?: string;
  operator?: string;
  arrondissement?: string;
  openingHours?: string;
  pricing?: ParkingPricing;
  prmSpaces?: number;
  bicycleSpaces?: number;
  motorcycleSpaces?: number;
  url?: string;
}

export interface ParkingsResponse {
  city: string;
  sourceName: string;
  sourceUrl: string;
  total: number;
  updatedAt: string;
  parkings: ParkingAvailability[];
}
