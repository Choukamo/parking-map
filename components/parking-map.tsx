"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { ParkingAvailability, ParkingsResponse } from "@/types/parking";
import {
  calculateDistanceKm,
  formatDistance,
  getGoogleMapsDirectionsUrl,
  filterAndSortParkings,
  type Coordinates,
  type ParkingFilters,
  type ParkingWithDistance,
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
        duration: 1,
      });
    }
  }, [target, map]);

  return null;
}

const DEFAULT_FILTERS: ParkingFilters = {
  search: "",
  sortOption: "default",
  maxDistanceKm: undefined,
  maxPriceOneHour: undefined,
  operator: "all",
  onlyOpen24: false,
  onlyPrm: false,
  onlyBicycle: false,
  onlyMotorcycle: false,
};

export function ParkingMap() {
  const [parkings, setParkings] = useState<ParkingAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Position utilisateur & géolocalisation
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Filtres
  const [filters, setFilters] = useState<ParkingFilters>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Navigation & sélection
  const [selectedParking, setSelectedParking] = useState<ParkingWithDistance | null>(null);
  const [mapTarget, setMapTarget] = useState<MapTarget | null>(null);

  // Vue Mobile : 'map' ou 'list'
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");

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
      setGeoError("La géolocalisation n'est pas supportée sur cet appareil.");
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
        setFilters((prev) => ({
          ...prev,
          sortOption: "distance-asc",
        }));
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Veuillez autoriser la géolocalisation pour afficher les parkings autour de vous.");
        } else if (err.code === err.TIMEOUT) {
          setGeoError("Délai de géolocalisation dépassé.");
        } else {
          setGeoError("Position introuvable.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  const processedParkings = useMemo(() => {
    return filterAndSortParkings(parkings, filters, userLocation);
  }, [parkings, filters, userLocation]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.sortOption !== "default") count++;
    if (filters.maxDistanceKm !== undefined) count++;
    if (filters.maxPriceOneHour !== undefined) count++;
    if (filters.operator && filters.operator !== "all") count++;
    if (filters.onlyOpen24) count++;
    if (filters.onlyPrm) count++;
    if (filters.onlyBicycle) count++;
    if (filters.onlyMotorcycle) count++;
    return count;
  }, [filters]);

  const handleSelectParking = (parking: ParkingWithDistance) => {
    setSelectedParking(parking);
    setMapTarget({
      latitude: parking.location.latitude,
      longitude: parking.location.longitude,
      zoom: 15,
    });
    // Sur mobile, si l'utilisateur était en vue liste et sélectionne un parking, on bascule sur la carte
    if (mobileTab === "list") {
      setMobileTab("map");
    }
  };

  const resetFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      search: filters.search, // conserver le texte de recherche
    });
  };

  return (
    <div className="app-shell">
      {/* BARRE FLOTTANTE MOBILE HAUT DE PAGE */}
      <header className="mobile-header" role="banner">
        <div className="mobile-search-bar">
          <input
            type="search"
            placeholder="Rechercher à Paris..."
            value={filters.search || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="mobile-search-input"
          />
          {filters.search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              aria-label="Effacer la recherche"
            >
              &times;
            </button>
          )}
          <button
            type="button"
            className={`mobile-filter-trigger ${activeFiltersCount > 0 ? "has-active" : ""}`}
            onClick={() => setIsFilterOpen(true)}
            aria-label="Ouvrir les filtres"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            {activeFiltersCount > 0 && (
              <span className="filter-badge-pill">{activeFiltersCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`mobile-geoloc-trigger ${userLocation ? "active" : ""}`}
            onClick={handleGeolocate}
            disabled={geoLoading}
            title="Autour de moi"
            aria-label="Me géolocaliser"
          >
            {geoLoading ? "⏳" : "📍"}
          </button>
        </div>

        {geoError && (
          <div className="mobile-geo-alert">
            <span>{geoError}</span>
            <button type="button" onClick={() => setGeoError(null)}>
              &times;
            </button>
          </div>
        )}
      </header>

      {/* SIDEBAR DESKTOP & LISTE MOBILE */}
      <aside className={`sidebar ${mobileTab === "list" ? "mobile-visible" : ""}`}>
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

          <div className="sidebar-intro">
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
                  <strong>Chargement des données...</strong>
                  <span>Portail officiel Paris Data</span>
                </>
              ) : error ? (
                <>
                  <strong>Erreur de synchronisation</strong>
                  <span>{error}</span>
                </>
              ) : (
                <>
                  <strong>{parkings.length} parkings publics répertoriés</strong>
                  <span>Capacités et tarifs officiels (Ville de Paris)</span>
                </>
              )}
            </div>
          </div>

          {/* Bouton Géolocalisation */}
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

          {/* Bouton d'ouverture des filtres */}
          <div className="filter-open-bar">
            <button
              type="button"
              className="filter-modal-btn"
              onClick={() => setIsFilterOpen(true)}
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
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filtres avancés</span>
              {activeFiltersCount > 0 && (
                <span className="filter-count-chip">{activeFiltersCount}</span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                className="filter-reset-quick"
                onClick={resetFilters}
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Section Recherche & Tris Rapides */}
        <div className="search-section">
          <div className="search-input-wrap desktop-search">
            <input
              id="parking-search-desktop"
              type="search"
              className="search-input"
              placeholder="Rechercher (nom, rue, Indigo, 15e...)"
              value={filters.search || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
            {filters.search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                aria-label="Effacer la recherche"
              >
                &times;
              </button>
            )}
          </div>

          <div className="search-meta">
            <span>
              {processedParkings.length} parking{processedParkings.length > 1 ? "s" : ""} trouvé{processedParkings.length > 1 ? "s" : ""}
            </span>
            {userLocation && (
              <span className="user-located-tag">Position GPS détectée</span>
            )}
          </div>
        </div>

        {/* Liste des parkings */}
        <div className="parking-list" role="list">
          {processedParkings.length === 0 ? (
            <div className="empty-results">
              <p>Aucun parking ne correspond à vos filtres.</p>
              <button
                type="button"
                className="reset-btn"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            processedParkings.map((p) => {
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
                      <span
                        className="parking-distance-badge"
                        title="Distance depuis votre position"
                      >
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
                      <span className="parking-price muted">Tarif 1h N/C</span>
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
                      <span>Itinéraire Google Maps ↗</span>
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="legend">
          <div className="legend-row">
            <span className="legend-marker official" aria-hidden="true" />
            <span>Données officielles (Ville de Paris — Open Data)</span>
          </div>
          {userLocation && (
            <div className="legend-row">
              <span className="legend-marker user" aria-hidden="true" />
              <span>Votre position actuelle</span>
            </div>
          )}
        </div>
      </aside>

      {/* SECTION CARTE */}
      <section className="map-wrap" aria-label="Carte des disponibilités">
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

          {/* Marqueur de position utilisateur */}
          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={createUserIcon()}
            >
              <Popup className="user-popup">
                <div style={{ padding: "8px 10px", fontSize: "13px" }}>
                  <strong>📍 Votre position</strong>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "11.5px" }}>
                    Distances calculées en temps réel.
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
                {/* Popup Leaflet pour Desktop */}
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

                    {/* Bouton Itinéraire Google Maps */}
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
                        <span className="stat-label">Capacité</span>
                        <strong className="stat-val">
                          {p.capacity ? `${p.capacity} places` : "Non précisée"}
                        </strong>
                      </div>
                      <div className="popup-stat">
                        <span className="stat-label">Tarif 1h</span>
                        <strong className="stat-val">
                          {p.pricing?.oneHour
                            ? `${p.pricing.oneHour.toFixed(2)} €`
                            : "Non communiqué"}
                        </strong>
                      </div>
                    </div>

                    {p.openingHours && (
                      <div className="popup-hours-badge">
                        ⏱️ {p.openingHours}
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

        {/* BOTTOM CARD MOBILE AU CLIC SUR UN PARKING */}
        {selectedParking && (
          <aside className="mobile-bottom-card" aria-label="Détail du parking sélectionné">
            <button
              type="button"
              className="bottom-card-close"
              onClick={() => setSelectedParking(null)}
              aria-label="Fermer"
            >
              &times;
            </button>

            <div className="bottom-card-header">
              <span className="popup-operator">
                {selectedParking.operator || "Ville de Paris"}
              </span>
              {selectedParking.distanceKm !== undefined && (
                <span className="popup-distance">
                  📍 à {formatDistance(selectedParking.distanceKm)}
                </span>
              )}
              {selectedParking.arrondissement && (
                <span className="popup-arrdt">{selectedParking.arrondissement}</span>
              )}
            </div>

            <h3 className="bottom-card-title">{selectedParking.name}</h3>
            {selectedParking.address && (
              <p className="bottom-card-addr">{selectedParking.address}</p>
            )}

            <div className="bottom-card-meta">
              {selectedParking.capacity ? (
                <span className="chip-meta">
                  🚗 {selectedParking.capacity} places
                </span>
              ) : null}
              {selectedParking.pricing?.oneHour ? (
                <span className="chip-meta price">
                  💶 {selectedParking.pricing.oneHour.toFixed(2)} € / 1h
                </span>
              ) : null}
              {selectedParking.openingHours && (
                <span className="chip-meta">
                  ⏱️ {selectedParking.openingHours}
                </span>
              )}
            </div>

            <a
              href={getGoogleMapsDirectionsUrl(
                selectedParking.location.latitude,
                selectedParking.location.longitude,
                selectedParking.name
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-itinerary-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>Lancer l&apos;itinéraire Google Maps</span>
            </a>
          </aside>
        )}

        {/* BOUTON FLOTTANT MOBILE : BASCULEMENT CARTE / LISTE */}
        <div className="mobile-view-toggle-bar">
          <button
            type="button"
            className="mobile-view-pill"
            onClick={() => setMobileTab(mobileTab === "map" ? "list" : "map")}
          >
            {mobileTab === "map" ? (
              <>
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
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span>Voir la liste ({processedParkings.length})</span>
              </>
            ) : (
              <>
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
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span>Voir la carte</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* MODAL / BOTTOM SHEET DE FILTRES AVANCÉS */}
      {isFilterOpen && (
        <div
          className="filter-modal-backdrop"
          onClick={() => setIsFilterOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-modal-title"
        >
          <div
            className="filter-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="filter-sheet-header">
              <div className="sheet-handle" />
              <div className="sheet-title-row">
                <h2 id="filter-modal-title">Filtres & Préférences</h2>
                <button
                  type="button"
                  className="sheet-close-btn"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Fermer les filtres"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="filter-sheet-body">
              {/* TRI */}
              <div className="filter-group">
                <span className="filter-group-title">Trier les résultats</span>
                <div className="filter-chips-grid">
                  <button
                    type="button"
                    className={`filter-chip ${filters.sortOption === "default" ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, sortOption: "default" }))
                    }
                  >
                    Défaut
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.sortOption === "distance-asc" ? "active" : ""}`}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, sortOption: "distance-asc" }));
                      if (!userLocation) handleGeolocate();
                    }}
                  >
                    📍 Plus proche
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.sortOption === "price-asc" ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, sortOption: "price-asc" }))
                    }
                  >
                    💶 Moins cher (1h)
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.sortOption === "price-desc" ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, sortOption: "price-desc" }))
                    }
                  >
                    💶 Plus cher (1h)
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.sortOption === "capacity-desc" ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, sortOption: "capacity-desc" }))
                    }
                  >
                    🚗 Capacité max
                  </button>
                </div>
              </div>

              {/* DISTANCE MAX */}
              <div className="filter-group">
                <span className="filter-group-title">
                  Distance max (autour de moi)
                </span>
                <div className="filter-chips-grid">
                  <button
                    type="button"
                    className={`filter-chip ${filters.maxDistanceKm === undefined ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, maxDistanceKm: undefined }))
                    }
                  >
                    Illimité
                  </button>
                  {[0.5, 1, 2, 5].map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      className={`filter-chip ${filters.maxDistanceKm === dist ? "active" : ""}`}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, maxDistanceKm: dist }));
                        if (!userLocation) handleGeolocate();
                      }}
                    >
                      &lt; {dist < 1 ? `${dist * 1000} m` : `${dist} km`}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRIX MAX */}
              <div className="filter-group">
                <span className="filter-group-title">Tarif horaire max (1h)</span>
                <div className="filter-chips-grid">
                  <button
                    type="button"
                    className={`filter-chip ${filters.maxPriceOneHour === undefined ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, maxPriceOneHour: undefined }))
                    }
                  >
                    Tous tarifs
                  </button>
                  {[3.5, 4.5, 5.5].map((price) => (
                    <button
                      key={price}
                      type="button"
                      className={`filter-chip ${filters.maxPriceOneHour === price ? "active" : ""}`}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, maxPriceOneHour: price }))
                      }
                    >
                      &le; {price.toFixed(2)} €
                    </button>
                  ))}
                </div>
              </div>

              {/* OPÉRATEUR */}
              <div className="filter-group">
                <span className="filter-group-title">Gestionnaire</span>
                <div className="filter-chips-grid">
                  <button
                    type="button"
                    className={`filter-chip ${filters.operator === "all" ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, operator: "all" }))
                    }
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.operator === "INDIGO" ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, operator: "INDIGO" }))
                    }
                  >
                    Indigo
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.operator === "SAEMES" ? "active" : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, operator: "SAEMES" }))
                    }
                  >
                    Saemes
                  </button>
                </div>
              </div>

              {/* SERVICES & ÉQUIPEMENTS */}
              <div className="filter-group">
                <span className="filter-group-title">Services & Équipements</span>
                <div className="filter-toggles-list">
                  <label className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={!!filters.onlyOpen24}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          onlyOpen24: e.target.checked,
                        }))
                      }
                    />
                    <span>⏱️ Ouvert 24h / 24</span>
                  </label>

                  <label className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={!!filters.onlyPrm}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          onlyPrm: e.target.checked,
                        }))
                      }
                    />
                    <span>♿ Places PMR disponibles</span>
                  </label>

                  <label className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={!!filters.onlyBicycle}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          onlyBicycle: e.target.checked,
                        }))
                      }
                    />
                    <span>🚲 Emplacements Vélos</span>
                  </label>

                  <label className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={!!filters.onlyMotorcycle}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          onlyMotorcycle: e.target.checked,
                        }))
                      }
                    />
                    <span>🏍️ Emplacements Deux-roues</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="filter-sheet-footer">
              <button
                type="button"
                className="filter-sheet-clear-btn"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>
              <button
                type="button"
                className="filter-sheet-apply-btn"
                onClick={() => setIsFilterOpen(false)}
              >
                Afficher {processedParkings.length} parking{processedParkings.length > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
