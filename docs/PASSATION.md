# Document de Passation Technique — Parking Map

> **Dernière mise à jour :** Novembre 2026  
> **Statut du projet :** Ville pilote (Paris) déployée en production sur Vercel avec 125 parkings réels, filtres avancés, carte épurée et ergonomie mobile-first.

---

## 1. Contexte & Vision

**Parking Map** est une application web conçue pour afficher les parkings et leurs disponibilités à partir de données réelles, ouvertes et vérifiables.

### Principes directeurs non-négociables :
1. **Zéro fausse donnée :** Si une ville ou un exploitant ne fournit pas de capteur temps réel (comme à Paris actuellement), l'application ne simule **jamais** de fausses jauges de places libres.
2. **Sources officielles uniquement :** Uniquement des portails Open Data municipaux ou métropolitains (licences ouvertes Etalab / ODbL). Aucun scraping sauvage ni accès à des flux privés.
3. **Ergonomie Mobile-First :** L'application est prioritairement conçue pour être utilisée sur smartphone (manipulable à une main, panneau de filtres coulissant, boutons tactiles larges, intégration native avec Google Maps).
4. **Lisibilité cartographique :** Un fond de carte minimaliste (CartoDB Positron) sans surcharge visuelle, restreint par rayon de recherche pour ne pas saturer l'écran.

---

## 2. Architecture Technique

- **Framework :** [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript strict)
- **Cartographie :** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Tuiles de carte :** [CartoDB Positron](https://carto.com/basemaps/) (`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`)
- **Pipeline de Déploiement :** GitHub (`main`) connecté à Vercel avec déploiement continu automatique
- **Tests :** Runner natif Node.js (`node --experimental-strip-types --test`)

---

## 3. Ce qui est Implémenté et Validé

| Fonctionnalité | Fichiers associés | Statut |
| :--- | :--- | :--- |
| **Adaptateur Paris Data** | `lib/adapters/paris.ts` | ✅ 125 parkings réels normalisés |
| **Route API avec cache ISR (1h)** | `app/api/parkings/paris/route.ts` | ✅ `revalidate = 3600` |
| **Carte épurée CartoDB** | `components/parking-map.tsx` | ✅ Tuiles minimalistes sans pollution visuelle |
| **Filtrage par rayon** | `lib/utils/geo.ts`, `components/parking-map.tsx` | ✅ 500m, 1km (défaut), 2km, 5km, tout Paris + cercle visuel |
| **Géolocalisation "Autour de moi"** | `components/parking-map.tsx` | ✅ Calcul Haversine en temps réel |
| **Tri multicritère** | `lib/utils/geo.ts` | ✅ Distance (croissant/décroissant), Prix (croissant/décroissant) |
| **Filtres avancés** | `components/parking-map.tsx` | ✅ Prix max horaire, 24h/24, accès PMR, exploitant |
| **Tiroir mobile (Bottom Sheet)** | `components/parking-map.tsx`, `app/globals.css` | ✅ Tiroir rétractable moderne adapté aux smartphones |
| **Fiche parking & Itinéraire** | `components/parking-map.tsx` | ✅ Aperçu au clic + bouton direct Google Maps |
| **Suite de tests automatisés** | `tests/paris-adapter.test.ts`, `tests/geo-utils.test.ts` | ✅ 16 tests unitaires passants |

---

## 4. Arborescence du Code

```text
PK_test/
├── app/
│   ├── api/
│   │   └── parkings/
│   │       └── paris/
│   │           └── route.ts          # API Route Next.js avec mise en cache ISR 1h
│   ├── globals.css                   # Styles CSS modernes & responsive mobile
│   ├── layout.tsx                    # Layout racine HTML & métadonnées
│   └── page.tsx                      # Page d'accueil intégrant le composant carte
├── components/
│   ├── parking-map-loader.tsx        # Dynamic import SSR: false pour Leaflet
│   └── parking-map.tsx               # Composant carte principal (Leaflet, filtres, tiroir)
├── docs/
│   ├── DATA-SOURCES.md               # Répertoire des sources, licences et fiabilité
│   ├── DECISIONS.md                  # Historique des décisions d'architecture
│   ├── PASSATION.md                  # Ce présent document
│   └── PLAN.md                       # Roadmap et suivi des jalons
├── lib/
│   ├── adapters/
│   │   └── paris.ts                  # Adaptateur OpenDataSoft v2.1 -> modèle ParkingAvailability
│   └── utils/
│       └── geo.ts                    # Formule de Haversine, filtres de rayon et tri
├── tests/
│   ├── geo-utils.test.ts             # 10 tests unitaires (distances, filtres, tri)
│   └── paris-adapter.test.ts         # 6 tests unitaires (validation des données Paris Data)
├── types/
│   └── parking.ts                    # Modèle de données normalisé universel
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Guide : Comment Ajouter une Nouvelle Ville ?

Pour étendre l'application à une autre métropole (ex: **Nantes Métropole**, **Strasbourg**, etc.) :

1. **Identifier la source Open Data :**
   - Documenter le jeu de données dans `docs/DATA-SOURCES.md` (licence, fréquence, champs temps réel).
2. **Créer l'adaptateur dans `lib/adapters/<ville>.ts` :**
   - Implémenter la transformation depuis le schéma JSON de la ville vers le type commun `ParkingAvailability` (`types/parking.ts`).
   - Assurer la validation des coordonnées (rejeter les coordonnées hors zone ou aberrantes).
3. **Créer des tests unitaires dans `tests/<ville>-adapter.test.ts` :**
   - Tester avec un extrait de payload réel valide et des payloads malformés.
4. **Créer la route API dans `app/api/parkings/<ville>/route.ts` :**
   - Fetcher les données en amont avec `revalidate` adapté (ex: `revalidate = 120` ou `60` si le flux est temps réel).
5. **Connecter à l'interface `components/parking-map.tsx` :**
   - Ajouter la sélection de métropole ou une détection automatique selon les coordonnées de l'utilisateur.

---

## 6. Commandes de Développement & Validation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement local
npm run dev

# Exécuter l'intégralité des tests unitaires (16 tests)
npm test

# Vérifier la validité des types et le linting
npm run lint

# Compiler l'application pour la production
npm run build
```

---

## 7. Déploiement & Vercel

Le dépôt est lié au compte GitHub et branché sur la branche `main`.
Chaque commande `git push origin main` déclenche automatiquement un nouveau déploiement sur Vercel.
En cas de problème en production, vérifier l'onglet *Deployments* et *Functions* sur le dashboard Vercel.
