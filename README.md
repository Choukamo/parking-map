# Parking Map

Application web cartographique moderne rassemblant les disponibilités et informations officielles de stationnement à partir de données réelles et vérifiables.

---

## Fonctionnalités actuelles (Ville pilote : Paris)

- **125 parkings en ouvrage concédés** issus directement de l'Open Data officiel de la Ville de Paris (*Paris Data*).
- **Carte allégée CartoDB Positron** : suppression de la pollution visuelle des tuiles traditionnelles (immeubles, sentiers secondaires) pour une lisibilité immédiate.
- **Filtrage par rayon de proximité** : affichage limité par défaut aux parkings dans un rayon de **1 km** autour de l'utilisateur (ou du centre de Paris) pour éviter d'encombrer l'écran. Sélecteur rapide : 500m, 1km, 2km, 5km, tout Paris.
- **Cercle visuel de zone** : repérage instantané du périmètre de recherche sur la carte.
- **Géolocalisation & calcul de distance** : bouton direct pour se localiser, calcul précis de la distance (formule de Haversine).
- **Tri multicritère** : du plus proche au plus éloigné, ou du moins cher au plus cher.
- **Filtres avancés** : prix horaire maximal, ouvert 24h/24, accès PMR, sélection de l'exploitant (Saemes, Indigo, Q-Park, etc.).
- **Ergonomie Mobile-First** : tiroir de filtres rétractable (Bottom Sheet) facilement manipulable au pouce sur smartphone.
- **Fiche d'aperçu & Itinéraire** : aperçu compact en bas d'écran avec lancement direct de **Google Maps** pour la navigation GPS.
- **Transparence et rigueur** : aucune fausse place simulée, informations vérifiées (capacités, tarifs horaires, exploitants).

---

## Démarrage rapide

### Pré-requis
- Node.js 20 ou supérieur.

```bash
# Installation des dépendances
npm install

# Démarrage du serveur local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## Tests & Qualité de code

Le projet intègre une suite de tests unitaires automatisée (16 tests validés) :

```bash
# Lancer les tests unitaires
npm test

# Vérifier le typage et le lint
npm run lint

# Compiler pour la production
npm run build
```

---

## Déploiement

Le projet est configuré pour un déploiement continu sur **Vercel** à chaque push sur la branche `main` du dépôt GitHub.

- **Framework Preset :** Next.js
- **Build Command :** `npm run build`
- **Output Directory :** `.next`

---

## Documentation de passation

Tous les détails de conception, de sources de données et les guides techniques sont disponibles dans le dossier [`docs/`](./docs) :

- [`docs/PASSATION.md`](./docs/PASSATION.md) — Document complet de passation technique et guide d'intégration d'une nouvelle ville ;
- [`docs/PLAN.md`](./docs/PLAN.md) — Roadmap détaillée et état d'avancement des étapes ;
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — Historique des choix d'architecture et d'ergonomie ;
- [`docs/DATA-SOURCES.md`](./docs/DATA-SOURCES.md) — Répertoire des sources de données, licences et critères de fiabilité.
