"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { ParkingAvailability, ParkingsResponse } from "@/types/parking";

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

function createParkingIcon(isSelected: boolean) {
  return L.divIcon({
    className: "custom-map-pin-container",
    html: `
      <div class="custom-marker ${isSelected ? "selected" : ""}" title="Parking public">
        <span class="marker-letter">P</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function MapController({
  target,
}: {
  target: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.latitude, target.longitude], 15, {
        duration: 1,
      });
    }
  }, [target, map]);

  return null;
}

export function ParkingMap() {
  const [parkings, setParkings] = useState<ParkingAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedParking, setSelectedParking] = useState<ParkingAvailability | null>(null);

  useEffect(() => {
    async function loadParkings() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/parkings/paris");
        if (!res.ok) {
          throw new Error(`Erreur réseau (${res.status})`);
        }
        const data: ParkingsResponse = await res.json();
        setParkings(data.parkings || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les données de stationnement."
        );
      } finally {
        setLoading(false);
      }
    }

    loadParkings();
  }, []);

  const filteredParkings = useMemo(() => {
    if (!search.trim()) return parkings;
    const q = search.toLowerCase();
    return parkings.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.operator && p.operator.toLowerCase().includes(q)) ||
        (p.arrondissement && p.arrondissement.toLowerCase().includes(q))
    );
  }, [parkings, search]);

  const handleSelectParking = (parking: ParkingAvailability) => {
    setSelectedParking(parking);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              P
            </div>
            <div>
              <p className="brand-name">Parking Map</p>
              <span className="brand-badge">Paris — Données Officielles</span>
            </div>
          </div>

          <div>
            <p className="eyebrow">Stationnement en ouvrage</p>
            <h1>Trouvez où vous garer à Paris.</h1>
          </div>

          <div
            className={`status-card ${error ? "has-error" : ""}`}
            role="status"
          >
            <span
              className={`status-dot ${loading ? "pending" : error ? "error" : "online"}`}
              aria-hidden="true"
            />
            <div>
              {loading ? (
                <>
                  <strong>Connexion aux données de Paris...</strong>
                  <span>Interrogation du portail officiel Paris Data</span>
                </>
              ) : error ? (
                <>
                  <strong>Erreur de synchronisation</strong>
                  <span>{error}</span>
                </>
              ) : (
                <>
                  <strong>{parkings.length} parkings officiels connectés</strong>
                  <span>
                    Source : Ville de Paris (Paris Data, Licence Ouverte)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="search-section">
          <label htmlFor="parking-search" className="sr-only">
            Rechercher un parking
          </label>
          <div className="search-input-wrap">
            <input
              id="parking-search"
              type="search"
              className="search-input"
              placeholder="Rechercher par nom, rue, arrdt, Indigo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
              >
                &times;
              </button>
            )}
          </div>
          <div className="search-meta">
            <span>
              {filteredParkings.length} parking{filteredParkings.length > 1 ? "s" : ""} affiché{filteredParkings.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="parking-list" role="list">
          {filteredParkings.map((p) => {
            const isSelected = selectedParking?.id === p.id;
            return (
              <article
                key={p.id}
                role="listitem"
                className={`parking-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectParking(p)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectParking(p);
                  }
                }}
              >
                <div className="parking-item-header">
                  <h3 className="parking-item-title">{p.name}</h3>
                  {p.operator && (
                    <span className="parking-operator-badge">{p.operator}</span>
                  )}
                </div>
                {p.address && <p className="parking-item-addr">{p.address}</p>}
                <div className="parking-item-footer">
                  {p.capacity ? (
                    <span className="parking-capacity-badge">
                      {p.capacity} places
                    </span>
                  ) : (
                    <span className="parking-capacity-badge muted">
                      Capacité non renseignée
                    </span>
                  )}
                  {p.pricing?.oneHour ? (
                    <span className="parking-price">
                      {p.pricing.oneHour.toFixed(2)} € / 1h
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="legend">
          <p className="legend-title">Légende & Transparence</p>
          <div className="legend-row">
            <span className="legend-marker official" aria-hidden="true" />
            <span>Donnée officielle de référence (Ville de Paris)</span>
          </div>
          <div className="legend-row">
            <span className="legend-marker pending" aria-hidden="true" />
            <span>Disponibilité temps réel : non diffusée par la Ville</span>
          </div>
        </div>
      </aside>

      <section className="map-wrap" aria-label="Carte des disponibilités">
        <div className="map-overlay">
          <strong>Paris — 125 parcs en ouvrage</strong>
          <span>
            Cliquez sur un parking pour consulter capacité, tarifs et horaires officiels.
          </span>
        </div>

        <MapContainer
          className="map"
          center={PARIS_CENTER}
          zoom={12}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController target={selectedParking ? selectedParking.location : null} />

          {filteredParkings.map((p) => {
            const isSelected = selectedParking?.id === p.id;
            return (
              <Marker
                key={p.id}
                position={[p.location.latitude, p.location.longitude]}
                icon={createParkingIcon(isSelected)}
                eventHandlers={{
                  click: () => setSelectedParking(p),
                }}
              >
                <Popup className="custom-popup">
                  <div className="popup-body">
                    <div className="popup-header">
                      <span className="popup-operator">{p.operator || "Ville de Paris"}</span>
                      {p.arrondissement && (
                        <span className="popup-arrdt">{p.arrondissement}</span>
                      )}
                    </div>
                    <h2 className="popup-title">{p.name}</h2>
                    {p.address && <p className="popup-addr">{p.address}</p>}

                    <div className="popup-stats-grid">
                      <div className="popup-stat">
                        <span className="stat-label">Capacité totale</span>
                        <strong className="stat-val">
                          {p.capacity ? `${p.capacity} places` : "Non précisée"}
                        </strong>
                      </div>
                      <div className="popup-stat">
                        <span className="stat-label">Horaires</span>
                        <strong className="stat-val">
                          {p.openingHours || "Non communiqués"}
                        </strong>
                      </div>
                    </div>

                    <div className="popup-dispo-card">
                      <div className="dispo-indicator" />
                      <div>
                        <strong>Disponibilité en direct</strong>
                        <p>
                          Non communiquée par l&apos;Open Data municipal. Aucune fausse
                          place n&apos;est simulée.
                        </p>
                      </div>
                    </div>

                    {p.pricing && (p.pricing.oneHour || p.pricing.twentyFourHours) && (
                      <div className="popup-pricing-table">
                        <span className="pricing-title">Tarifs indicatifs :</span>
                        <div className="pricing-chips">
                          {p.pricing.oneHour && (
                            <span className="chip">1h : {p.pricing.oneHour.toFixed(2)} €</span>
                          )}
                          {p.pricing.twoHours && (
                            <span className="chip">2h : {p.pricing.twoHours.toFixed(2)} €</span>
                          )}
                          {p.pricing.twentyFourHours && (
                            <span className="chip">24h : {p.pricing.twentyFourHours.toFixed(2)} €</span>
                          )}
                        </div>
                      </div>
                    )}

                    {(p.prmSpaces || p.bicycleSpaces || p.motorcycleSpaces) && (
                      <div className="popup-amenities">
                        {p.prmSpaces ? (
                          <span className="amenity">♿ {p.prmSpaces} PMR</span>
                        ) : null}
                        {p.bicycleSpaces ? (
                          <span className="amenity">🚲 {p.bicycleSpaces} Vélos</span>
                        ) : null}
                        {p.motorcycleSpaces ? (
                          <span className="amenity">🏍️ {p.motorcycleSpaces} Deux-roues</span>
                        ) : null}
                      </div>
                    )}

                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="popup-link"
                      >
                        Consulter sur le site officiel &rarr;
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </section>
    </main>
  );
}
