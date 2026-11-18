"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { ParkingAvailability, ParkingsResponse } from "@/types/parking";
import {
  calculateDistanceKm,
  formatDistance,
  getGoogleMapsDirectionsUrl,
  sortParkings,
  type SortOption,
  type Coordinates,
} from "@/lib/utils/geo";

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

function createUserIcon() {
  return L.divIcon({
    className: "custom-user-pin-container",
    html: `
      <div class="user-marker" title="Votre position actuelle">
        <div class="user-pulse"></div>
        <div class="user-core"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

interface MapTarget {
  latitude: number;
  longitude: number;
  zoom?: number;
}

function MapController({ target }: { target: MapTarget | null }) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.latitude, target.longitude], target.zoom || 15, {
        duration: 1.1,
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

  // Position utilisateur & géolocalisation
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [mapTarget, setMapTarget] = useState<MapTarget | null>(null);

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

  const handleGeolocate = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        setMapTarget({
          latitude: coords.latitude,
          longitude: coords.longitude,
          zoom: 14,
        });
        setSortOption("distance-asc");
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Autorisation refusée. Activez la géolocalisation dans votre navigateur.");
        } else if (err.code === err.TIMEOUT) {
          setGeoError("Délai de géolocalisation dépassé.");
        } else {
          setGeoError("Impossible de déterminer votre position.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
    if ((newSort === "distance-asc" || newSort === "distance-desc") && !userLocation) {
      handleGeolocate();
    }
  };

  const processedParkings = useMemo(() => {
    let list = parkings;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.address && p.address.toLowerCase().includes(q)) ||
          (p.operator && p.operator.toLowerCase().includes(q)) ||
          (p.arrondissement && p.arrondissement.toLowerCase().includes(q))
      );
    }
    return sortParkings(list, sortOption, userLocation);
  }, [parkings, search, sortOption, userLocation]);

  const handleSelectParking = (parking: ParkingAvailability) => {
    setSelectedParking(parking);
    setMapTarget({
      latitude: parking.location.latitude,
      longitude: parking.location.longitude,
      zoom: 15,
    });
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

          {/* Bouton Géolocalisation "Autour de moi" */}
          <div className="geoloc-section">
            <button
              type="button"
              className={`geoloc-btn ${userLocation ? "active" : ""}`}
              onClick={handleGeolocate}
              disabled={geoLoading}
            >
              <span className="geoloc-icon" aria-hidden="true">
                {geoLoading ? "⏳" : "📍"}
              </span>
              <span>
                {geoLoading
                  ? "Localisation en cours..."
                  : userLocation
                  ? "Autour de vous (activé)"
                  : "Afficher les parkings autour de moi"}
              </span>
            </button>
            {geoError && <p className="geoloc-error">{geoError}</p>}
          </div>
        </div>

        {/* Section Recherche & Tris */}
        <div className="search-section">
          <div className="search-input-wrap">
            <input
              id="parking-search"
              type="search"
              className="search-input"
              placeholder="Rechercher (nom, rue, Indigo, 15e...)"
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

          {/* Sélecteur de Tri */}
          <div className="sort-controls">
            <label htmlFor="sort-select" className="sort-label">
              Trier par :
            </label>
            <select
              id="sort-select"
              className="sort-select"
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
            >
              <option value="default">Défaut (recensement officiel)</option>
              <option value="distance-asc">📍 Plus proche</option>
              <option value="distance-desc">📍 Plus éloigné</option>
              <option value="price-asc">💶 Moins cher (tarif 1h)</option>
              <option value="price-desc">💶 Plus cher (tarif 1h)</option>
              <option value="capacity-desc">🚗 Plus de places (capacité)</option>
            </select>
          </div>

          <div className="search-meta">
            <span>
              {processedParkings.length} parking{processedParkings.length > 1 ? "s" : ""}
            </span>
            {userLocation && (
              <span className="user-located-tag">Position détectée</span>
            )}
          </div>
        </div>

        {/* Liste des parkings */}
        <div className="parking-list" role="list">
          {processedParkings.map((p) => {
            const isSelected = selectedParking?.id === p.id;
            const distanceText =
              p.distanceKm !== undefined ? formatDistance(p.distanceKm) : null;
            const directionsUrl = getGoogleMapsDirectionsUrl(
              p.location.latitude,
              p.location.longitude,
              p.name
            );

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

                <div className="parking-item-badges">
                  {distanceText && (
                    <span className="parking-distance-badge" title="Distance depuis votre position">
                      📍 {distanceText}
                    </span>
                  )}
                  {p.capacity ? (
                    <span className="parking-capacity-badge">
                      {p.capacity} places
                    </span>
                  ) : null}
                  {p.pricing?.oneHour ? (
                    <span className="parking-price">
                      {p.pricing.oneHour.toFixed(2)} € / 1h
                    </span>
                  ) : (
                    <span className="parking-price muted">Prix 1h N/C</span>
                  )}
                </div>

                <div className="parking-item-actions">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="itinerary-quick-btn"
                    title="Ouvrir l'itinéraire Google Maps"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    <span>Itinéraire</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <div className="legend">
          <p className="legend-title">Légende & Transparence</p>
          <div className="legend-row">
            <span className="legend-marker official" aria-hidden="true" />
            <span>Donnée officielle (Ville de Paris)</span>
          </div>
          <div className="legend-row">
            <span className="legend-marker user" aria-hidden="true" />
            <span>Votre position actuelle</span>
          </div>
        </div>
      </aside>

      <section className="map-wrap" aria-label="Carte des disponibilités">
        <div className="map-overlay">
          <strong>Paris — 125 parcs en ouvrage</strong>
          <span>
            Cliquez sur un parking pour consulter capacité, tarifs et lancer l&apos;itinéraire Google Maps.
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

          <MapController target={mapTarget} />

          {/* Marqueur de position de l'utilisateur */}
          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={createUserIcon()}
            >
              <Popup className="user-popup">
                <div style={{ padding: "8px 10px", fontSize: "13px" }}>
                  <strong>📍 Votre position</strong>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "11.5px" }}>
                    Les distances et tris sont calculés à partir d&apos;ici.
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marqueurs des parkings */}
          {processedParkings.map((p) => {
            const isSelected = selectedParking?.id === p.id;
            const distance = userLocation
              ? calculateDistanceKm(
                  userLocation.latitude,
                  userLocation.longitude,
                  p.location.latitude,
                  p.location.longitude
                )
              : undefined;
            const directionsUrl = getGoogleMapsDirectionsUrl(
              p.location.latitude,
              p.location.longitude,
              p.name
            );

            return (
              <Marker
                key={p.id}
                position={[p.location.latitude, p.location.longitude]}
                icon={createParkingIcon(isSelected)}
                eventHandlers={{
                  click: () => {
                    setSelectedParking(p);
                    setMapTarget({
                      latitude: p.location.latitude,
                      longitude: p.location.longitude,
                      zoom: 15,
                    });
                  },
                }}
              >
                <Popup className="custom-popup">
                  <div className="popup-body">
                    <div className="popup-header">
                      <span className="popup-operator">{p.operator || "Ville de Paris"}</span>
                      {distance !== undefined && (
                        <span className="popup-distance">
                          📍 à {formatDistance(distance)}
                        </span>
                      )}
                      {p.arrondissement && (
                        <span className="popup-arrdt">{p.arrondissement}</span>
                      )}
                    </div>

                    <h2 className="popup-title">{p.name}</h2>
                    {p.address && <p className="popup-addr">{p.address}</p>}

                    {/* Bouton Itinéraire Google Maps mis en valeur */}
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="popup-itinerary-btn"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      <span>Itinéraire Google Maps ↗</span>
                    </a>

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
