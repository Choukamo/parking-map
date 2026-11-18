import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateDistanceKm,
  formatDistance,
  getGoogleMapsDirectionsUrl,
  filterAndSortParkings,
  type ParkingFilters,
} from "../lib/utils/geo.ts";
import type { ParkingAvailability } from "../types/parking.ts";

describe("Geo Utilities & Advanced Filters", () => {
  it("should calculate correct Haversine distance between two points", () => {
    const distance = calculateDistanceKm(48.8584, 2.2945, 48.8530, 2.3499);
    assert.ok(distance > 4.0 && distance < 4.4, `Calculated distance: ${distance}`);
  });

  it("should format distance correctly (< 1km in meters, >= 1km in km)", () => {
    assert.equal(formatDistance(0.35), "350 m");
    assert.equal(formatDistance(0.05), "50 m");
    assert.equal(formatDistance(1.234), "1.2 km");
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
      operator: "INDIGO",
      openingHours: "24h / 24",
      pricing: { oneHour: 4.8 },
      prmSpaces: 10,
      bicycleSpaces: 20,
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
      operator: "SAEMES",
      openingHours: "07h - 22h",
      pricing: { oneHour: 3.5 },
      motorcycleSpaces: 30,
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
      operator: "INDIGO",
      openingHours: "24h / 24",
      pricing: { oneHour: 5.5 },
      prmSpaces: 5,
    },
  ];

  it("should sort parkings by price ascending (cheapest first)", () => {
    const filters: ParkingFilters = { sortOption: "price-asc" };
    const sorted = filterAndSortParkings(sampleParkings, filters, null);
    assert.equal(sorted[0].id, "p2"); // 3.5€
    assert.equal(sorted[1].id, "p1"); // 4.8€
    assert.equal(sorted[2].id, "p3"); // 5.5€
  });

  it("should filter by maximum price (e.g. <= 4.0€)", () => {
    const filters: ParkingFilters = { sortOption: "default", maxPriceOneHour: 4.0 };
    const filtered = filterAndSortParkings(sampleParkings, filters, null);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "p2");
  });

  it("should filter by operator (e.g. SAEMES)", () => {
    const filters: ParkingFilters = { sortOption: "default", operator: "SAEMES" };
    const filtered = filterAndSortParkings(sampleParkings, filters, null);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "p2");
  });

  it("should filter by 24h/24 opening", () => {
    const filters: ParkingFilters = { sortOption: "default", onlyOpen24: true };
    const filtered = filterAndSortParkings(sampleParkings, filters, null);
    assert.equal(filtered.length, 2);
    assert.ok(filtered.some((p) => p.id === "p1"));
    assert.ok(filtered.some((p) => p.id === "p3"));
  });

  it("should filter by PMR presence", () => {
    const filters: ParkingFilters = { sortOption: "default", onlyPrm: true };
    const filtered = filterAndSortParkings(sampleParkings, filters, null);
    assert.equal(filtered.length, 2);
    assert.ok(!filtered.some((p) => p.id === "p2"));
  });

  it("should filter by radius when reference coordinates are provided", () => {
    const user = { latitude: 48.8585, longitude: 2.3475 };
    // p1 est à ~0.1 km, p2 et p3 sont à > 1.5 km
    const filters: ParkingFilters = { sortOption: "default", radiusKm: 1.0 };
    const filtered = filterAndSortParkings(sampleParkings, filters, user);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "p1");
  });

  it("should return all parkings when radiusKm is 'all'", () => {
    const user = { latitude: 48.8585, longitude: 2.3475 };
    const filters: ParkingFilters = { sortOption: "default", radiusKm: "all" };
    const filtered = filterAndSortParkings(sampleParkings, filters, user);
    assert.equal(filtered.length, 3);
  });
});
