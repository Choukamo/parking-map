import { NextResponse } from "next/server";
import { transformParisApiResponse, ParisApiResponse, ParisRawRecord } from "@/lib/adapters/paris";
import type { ParkingsResponse } from "@/types/parking";

const API_BASE_URL =
  "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/stationnement-en-ouvrage/records";

export const revalidate = 3600; // Cache 1h sur Next.js / Vercel

export async function GET() {
  try {
    // Le jeu de données contient actuellement 125 parkings concédés.
    // L'API ODS plafonnant la limite à 100 par requête, on effectue 2 appels paginés (0-99 et 100-199).
    const [page1Res, page2Res] = await Promise.all([
      fetch(`${API_BASE_URL}?limit=100&offset=0`, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      }),
      fetch(`${API_BASE_URL}?limit=100&offset=100`, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      }),
    ]);

    if (!page1Res.ok) {
      throw new Error(`Erreur API Paris Data (Page 1): ${page1Res.status} ${page1Res.statusText}`);
    }

    const data1: ParisApiResponse = await page1Res.json();
    let allRecords: ParisRawRecord[] = data1.results || [];

    if (page2Res.ok) {
      const data2: ParisApiResponse = await page2Res.json();
      if (Array.isArray(data2.results)) {
        allRecords = allRecords.concat(data2.results);
      }
    }

    const parkings = transformParisApiResponse({
      total_count: allRecords.length,
      results: allRecords,
    });

    const responsePayload: ParkingsResponse = {
      city: "Paris",
      sourceName: "Stationnement en ouvrage concédé — Ville de Paris (Paris Data)",
      sourceUrl: "https://opendata.paris.fr/explore/dataset/stationnement-en-ouvrage/",
      total: parkings.length,
      updatedAt: new Date().toISOString(),
      parkings,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Échec de récupération des données parkings Paris :", error);
    return NextResponse.json(
      {
        error: "Impossible de charger les données de stationnement de Paris.",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 502 }
    );
  }
}
