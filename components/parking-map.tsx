"use client";

import { MapContainer, TileLayer } from "react-leaflet";

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

export function ParkingMap() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            P
          </div>
          <p className="brand-name">Parking Map</p>
        </div>

        <div>
          <p className="eyebrow">Prototype de départ</p>
          <h1>Trouvez plus facilement où vous garer.</h1>
        </div>

        <p className="intro">
          Cette carte est volontairement vide pour le moment. Les prochaines
          étapes consisteront à connecter des sources officielles et à afficher
          leur niveau de fiabilité.
        </p>

        <div className="status-card" role="status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>Aucune donnée connectée</strong>
            <span>
              Aucun parking ou signalement n&apos;est inventé dans cette
              version.
            </span>
          </div>
        </div>

        <div className="legend">
          <p className="legend-title">Légende prévue</p>
          <div className="legend-row">
            <span className="legend-marker" aria-hidden="true" />
            <span>Donnée officielle en temps réel</span>
          </div>
          <div className="legend-row">
            <span className="legend-marker pending" aria-hidden="true" />
            <span>Estimation historique à confirmer</span>
          </div>
        </div>
      </aside>

      <section className="map-wrap" aria-label="Carte des disponibilités">
        <div className="map-overlay">
          <strong>Paris — zone de départ</strong>
          <span>
            Les données seront ajoutées après validation de leur source et de
            leur licence.
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
        </MapContainer>
      </section>
    </main>
  );
}
