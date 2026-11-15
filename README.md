# Parking Map

Base technique d'une application qui rassemble les disponibilités officielles de stationnement sur une carte.

## État actuel

Le projet contient uniquement le squelette fonctionnel :

- carte interactive centrée sur Paris ;
- interface vide volontairement, sans fausses places ni fausses disponibilités ;
- structure TypeScript prête à recevoir les adaptateurs d'API des villes ;
- documentation produit et technique dans [`docs/`](./docs).

## Lancer le projet

Pré-requis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Vérifications

```bash
npm run lint
npm run build
```

## Déploiement Vercel

Le projet est une application Next.js standard et peut être importé directement depuis GitHub dans Vercel.

- Framework : Next.js
- Build command : `npm run build`
- Output directory : laisser la valeur par défaut
- Variables secrètes : aucune pour ce squelette

Les tuiles cartographiques utilisent OpenStreetMap avec attribution visible. Les limites d'utilisation et les sources de données sont documentées avant toute mise en production.

## Documentation

- [`docs/PLAN.md`](./docs/PLAN.md) — plan d'action par étapes ;
- [`docs/DATA-SOURCES.md`](./docs/DATA-SOURCES.md) — sources acceptables et fiabilité ;
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — décisions et limites du projet.
