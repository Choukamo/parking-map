import { NextResponse } from "next/server";
import { transformParisApiResponse, ParisApiResponse, ParisRawRecord } from "@/lib/adapters/paris";
import type { ParkingsResponse } from "@/types/parking";

const API_BASE_URL =
  "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/stationnement-en-ouvrage/records";

export const revalidate = 3600; // Cache 1h sur Next.js ISR

export async function GET() {
  try {
    // Le jeu de données contient actuellement 125 parkings concédés.
    // L'API Opendatasoft plafonnant la limite à 100 par requête, on effectue 2 requêtes paginées avec timeout.
    const fetchPage = async (offset: number) => {
      const res = await fetch(`${API_BASE_URL}?limit=100&offset=${offset}`, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        throw new Error(`Erreur API Paris Data (offset ${offset}): ${res.status} ${res.statusText}`);
      }
      const data: ParisApiResponse = await res.json();
      return data;
    };

    const [page1Data, page2Data] = await Promise.all([
      fetchPage(0),
      fetchPage(100).catch((err) => {
        console.warn("Échec page 2 de Paris Data, conservation de la page 1 :", err);
        return { total_count: 0, results: [] } as ParisApiResponse;
      }),
    ]);

    let allRecords: ParisRawRecord[] = page1Data.results || [];
    if (Array.isArray(page2Data.results)) {
      allRecords = allRecords.concat(page2Data.results);
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

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Échec de récupération des données parkings Paris :", error);
    return NextResponse.json(
      {
        error: "Impossible de charger les données de stationnement de Paris.",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
