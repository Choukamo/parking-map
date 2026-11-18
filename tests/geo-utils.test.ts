import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateDistanceKm,
  formatDistance,
  getGoogleMapsDirectionsUrl,
  sortParkings,
} from "../lib/utils/geo.ts";
import type { ParkingAvailability } from "../types/parking.ts";

describe("Geo Utilities & Sorting", () => {
  it("should calculate correct Haversine distance between two points", () => {
    // Tour Eiffel : 48.8584, 2.2945
    // Cathédrale Notre-Dame : 48.8530, 2.3499
    const distance = calculateDistanceKm(48.8584, 2.2945, 48.8530, 2.3499);
    // Distance réelle ~ 4.1 - 4.3 km
    assert.ok(distance > 4.0 && distance < 4.4, `Calculated distance: ${distance}`);
  });

  it("should format distance correctly (< 1km in meters, >= 1km in km)", () => {
    assert.equal(formatDistance(0.35), "350 m");
    assert.equal(formatDistance(0.05), "50 m");
    assert.equal(formatDistance(1.234), "1.2 km");
    assert.equal(formatDistance(12.78), "12.8 km");
  });

  it("should generate a valid Google Maps directions URL", () => {
    const url = getGoogleMapsDirectionsUrl(48.8566, 2.3522, "Parking Hôtel de Ville");
    assert.ok(url.startsWith("https://www.google.com/maps/dir/"));
    assert.ok(url.includes("destination=48.8566,2.3522"));
    assert.ok(url.includes("Parking%20H%C3%B4tel%20de%20Ville"));
  });

  const sampleParkings: ParkingAvailability[] = [
    {
      id: "p1",
      name: "Parking Châtelet",
      location: { latitude: 48.858, longitude: 2.347 },
      capacity: 500,
      status: "open",
      observedAt: "2026-11-18T10:00:00Z",
      sourceId: "paris-data",
      confidence: "unknown",
      pricing: { oneHour: 4.8 },
    },
    {
      id: "p2",
      name: "Parking Montparnasse",
      location: { latitude: 48.842, longitude: 2.321 },
      capacity: 800,
      status: "open",
      observedAt: "2026-11-18T10:00:00Z",
      sourceId: "paris-data",
      confidence: "unknown",
      pricing: { oneHour: 3.5 },
    },
    {
      id: "p3",
      name: "Parking Bastille",
      location: { latitude: 48.853, longitude: 2.369 },
      capacity: 300,
      status: "open",
      observedAt: "2026-11-18T10:00:00Z",
      sourceId: "paris-data",
      confidence: "unknown",
      pricing: { oneHour: 5.5 },
    },
  ];

  it("should sort parkings by price ascending (cheapest first)", () => {
    const sorted = sortParkings(sampleParkings, "price-asc", null);
    assert.equal(sorted[0].id, "p2"); // 3.5€
    assert.equal(sorted[1].id, "p1"); // 4.8€
    assert.equal(sorted[2].id, "p3"); // 5.5€
  });

  it("should sort parkings by price descending (most expensive first)", () => {
    const sorted = sortParkings(sampleParkings, "price-desc", null);
    assert.equal(sorted[0].id, "p3"); // 5.5€
    assert.equal(sorted[1].id, "p1"); // 4.8€
    assert.equal(sorted[2].id, "p2"); // 3.5€
  });

  it("should sort parkings by distance ascending when user location is provided", () => {
    // Proche de Châtelet
    const user = { latitude: 48.8585, longitude: 2.3475 };
    const sorted = sortParkings(sampleParkings, "distance-asc", user);
    assert.equal(sorted[0].id, "p1"); // Châtelet le plus proche
    assert.ok(sorted[0].distanceKm !== undefined);
  });

  it("should sort parkings by capacity descending", () => {
    const sorted = sortParkings(sampleParkings, "capacity-desc", null);
    assert.equal(sorted[0].id, "p2"); // 800
    assert.equal(sorted[1].id, "p1"); // 500
    assert.equal(sorted[2].id, "p3"); // 300
  });
});
