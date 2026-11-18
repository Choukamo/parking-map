import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  adaptParisParkingRecord,
  transformParisApiResponse,
  type ParisRawRecord,
} from "../lib/adapters/paris.ts";

describe("Paris Open Data Parking Adapter", () => {
  it("should correctly adapt a valid parking record", () => {
    const raw: ParisRawRecord = {
      id: "75107-P-060",
      nom: "INVALIDES",
      adresse: "24 rue de constantine, 75007, Paris",
      url: "https://fr.parkindigo.com/parking/paris-75007/invalides-75070100",
      deleg: "INDIGO",
      arrdt: "7",
      horaire_na: "24h / 24",
      nb_places: 894,
      nb_pmr: 3,
      nb_velo: 10,
      nb_2_rm: 34,
      tarif_1h: 5.4,
      tarif_2h: 10.8,
      tarif_3h: 16.2,
      tarif_24h: 48.6,
      mis_a_jour: "2026-06-01T02:00:00+00:00",
      geo_point_2d: {
        lon: 2.31465998,
        lat: 48.85928758,
      },
    };

    const result = adaptParisParkingRecord(raw);

    assert.ok(result);
    assert.equal(result.id, "paris-75107-P-060");
    assert.equal(result.name, "Invalides");
    assert.equal(result.capacity, 894);
    assert.equal(result.availableSpaces, undefined, "availableSpaces must be undefined, not 0");
    assert.equal(result.status, "open");
    assert.equal(result.confidence, "unknown");
    assert.equal(result.location.latitude, 48.85928758);
    assert.equal(result.location.longitude, 2.31465998);
    assert.equal(result.operator, "INDIGO");
    assert.equal(result.arrondissement, "7e arr.");
    assert.equal(result.pricing?.oneHour, 5.4);
    assert.equal(result.pricing?.twentyFourHours, 48.6);
    assert.equal(result.prmSpaces, 3);
    assert.equal(result.bicycleSpaces, 10);
    assert.equal(result.motorcycleSpaces, 34);
  });

  it("should reject records outside the Paris region", () => {
    const raw: ParisRawRecord = {
      id: "invalid-geo",
      nom: "Parking hors zone",
      geo_point_2d: {
        lat: 43.6047, // Toulouse
        lon: 1.4442,
      },
    };

    const result = adaptParisParkingRecord(raw);
    assert.equal(result, null);
  });

  it("should reject records with missing or invalid coordinates", () => {
    const raw: ParisRawRecord = {
      id: "no-geo",
      nom: "Parking sans coordonnées",
    };

    const result = adaptParisParkingRecord(raw);
    assert.equal(result, null);
  });

  it("should handle missing capacity cleanly without setting 0", () => {
    const raw: ParisRawRecord = {
      id: "no-capa",
      nom: "Petit parking",
      nb_places: null,
      geo_point_2d: {
        lat: 48.8566,
        lon: 2.3522,
      },
    };

    const result = adaptParisParkingRecord(raw);
    assert.ok(result);
    assert.equal(result.capacity, undefined);
    assert.equal(result.availableSpaces, undefined);
  });

  it("should detect closed status", () => {
    const raw: ParisRawRecord = {
      id: "closed-park",
      nom: "Parking Fermé pour Travaux",
      horaire_na: "Actuellement fermé pour travaux",
      geo_point_2d: {
        lat: 48.8566,
        lon: 2.3522,
      },
    };

    const result = adaptParisParkingRecord(raw);
    assert.ok(result);
    assert.equal(result.status, "closed");
  });

  it("should filter out invalid items from API response array", () => {
    const apiResponse = {
      total_count: 3,
      results: [
        {
          id: "valid-1",
          nom: "Parking Un",
          geo_point_2d: { lat: 48.85, lon: 2.35 },
        },
        {
          id: "invalid-coords",
          nom: "Parking Deux",
          geo_point_2d: { lat: 0, lon: 0 },
        },
        {
          id: "valid-2",
          nom: "Parking Trois",
          geo_point_2d: { lat: 48.86, lon: 2.36 },
        },
      ],
    };

    const results = transformParisApiResponse(apiResponse);
    assert.equal(results.length, 2);
    assert.equal(results[0].id, "paris-valid-1");
    assert.equal(results[1].id, "paris-valid-2");
  });
});
