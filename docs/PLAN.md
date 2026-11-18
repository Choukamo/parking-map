# Plan d'action

## Objectif

Construire progressivement une application qui affiche les disponibilités de stationnement à partir de données réelles, officielles et vérifiables.

Le projet a démarré avec la ville pilote de **Paris** et privilégie la rigueur : aucune fausse place, aucune simulation fictive.

---

## État des étapes

### Étape 0 — Squelette & Déploiement
- [x] Application web déployable sur Vercel (Next.js 15 App Router).
- [x] Carte interactive Leaflet sans aucune donnée fictive.
- [x] Documentation initiale des décisions et limites (`docs/`).
- [x] Choix de la première ville : **Paris (Paris Data)**.

### Étape 1 — Cartographier les parkings parisiens
- [x] Connexion à l'API officielle Paris Data (`stationnement-en-ouvrage`).
- [x] Adaptateur dédié et typé : `lib/adapters/paris.ts`.
- [x] Route API avec cache ISR (`revalidate = 3600`) : `app/api/parkings/paris/route.ts`.
- [x] Récupération et normalisation des 125 parkings en ouvrage concédés (Indigo, Saemes, Q-Park...).
- [x] Nettoyage et validation des coordonnées géographiques, adresses, capacités, tarifs horaires, places PMR/vélos.
- [x] Tests unitaires sur l'adaptateur (`tests/paris-adapter.test.ts` — 6/6 tests validés).

### Étape 2 — Modèle de données commun
- [x] Standardisé dans `types/parking.ts` :
```ts
export type ParkingAvailability = {
  id: string;
  name: string;
  location: { latitude: number; longitude: number };
  capacity?: number;
  availableSpaces?: number;
  status: "open" | "closed" | "unknown";
  tarifs?: {
    tarif1h?: number;
    tarif2h?: number;
    tarif24h?: number;
  };
  hasPMR?: boolean;
  hasBicycle?: boolean;
  has2RM?: boolean;
  openingHours?: string;
  operator?: string;
  url?: string;
  observedAt: string;
  sourceId: string;
  confidence: "official-realtime" | "historical-estimate" | "unknown";
};
```

### Étape 3 — Expérience utilisateur & Ergonomie Mobile
- [x] **Fond de carte minimaliste** : Remplacement des tuiles OpenStreetMap surchargées par **CartoDB Positron** pour éliminer le bruit visuel (immeubles superflus, sentiers, POI parasites).
- [x] **Recherche par rayon de proximité** : Limitation de l'affichage aux parkings dans un rayon sélectionnable (500 m, 1 km, 2 km, 5 km, ou Tout Paris) au lieu d'afficher 125 marqueurs encombrants.
- [x] **Cercle visuel de zone** : Affichage d'un cercle semi-transparent sur la carte autour de la position de référence.
- [x] **Géolocalisation "Autour de moi"** : Détection GPS de l'utilisateur avec bouton flottant dédié et calcul de distance Haversine précise.
- [x] **Tri multicritère** : Plus proche d'abord, plus éloigné, moins cher d'abord, plus cher d'abord.
- [x] **Filtres avancés** : Prix horaire max, ouvert 24h/24, accès PMR, exploitant (Saemes, Indigo, etc.).
- [x] **Tiroir de filtres mobile (Bottom Sheet)** : Interface coulissante moderne au pouce.
- [x] **Fiche d'aperçu & Itinéraire** : Carte compacte en bas d'écran au toucher d'un parking avec bouton direct **Itinéraire Google Maps**.
- [x] **Suppression du bandeau répétitif** : Retrait du cadre d'alerte jaune dans toutes les fiches pour aérer la lecture.
- [x] **Tests unitaires géographiques et filtres** : 10 tests validés dans `tests/geo-utils.test.ts` (total 16/16).

---

## Prochaines étapes

### Étape 4 — Deuxième ville avec temps réel actif
Certaines métropoles françaises publient le décompte exact des places libres en temps réel (contrairement à Paris où l'open data actuel est statique/tarifaire).
- [ ] Sélectionner une ville compatible temps réel (ex: **Nantes Métropole**, **Strasbourg Eurométropole**, ou **Bordeaux**).
- [ ] Créer `lib/adapters/<ville>.ts` et son API route correspondante.
- [ ] Configurer un sélecteur de métropole ou une détection automatique selon la position GPS de l'utilisateur.
- [ ] Valider avec des tests unitaires dédiés.

### Étape 5 — Améliorations PWA & Mode Déconnecté
- [ ] Ajouter un fichier `manifest.json` et des icônes pour installation sur l'écran d'accueil du smartphone (PWA).
- [ ] Mise en cache locale (Service Worker / LocalStorage) pour consultation rapide en mobilité même avec un réseau faible.

---

## Hors périmètre volontaire

- Pas de signalements communautaires non modérés.
- Pas de capteurs physiques à déployer.
- Pas de contournement de protections ou de scraping de données privées.
- Pas de simulation de fausses places libres lorsque l'open data officiel ne fournit pas de capteur temps réel.
