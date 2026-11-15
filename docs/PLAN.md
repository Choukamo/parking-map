# Plan d'action

## Objectif

Construire progressivement une application qui affiche les disponibilités de stationnement à partir de données déjà existantes et vérifiables.

Le projet commence par une ville et ne promet pas de détecter toutes les places de rue.

## Étape 0 — Squelette actuel

- [x] Application web déployable sur Vercel.
- [x] Carte interactive centrée sur Paris.
- [x] Aucun faux parking ni faux taux de disponibilité.
- [x] Documentation des décisions et limites.
- [ ] Choix définitif de la première ville et de ses sources.

## Étape 1 — Cartographier les parkings officiels

- Choisir une ville dont les données sont accessibles par API ou open data.
- Décrire chaque source : propriétaire, licence, fréquence et fiabilité.
- Créer un adaptateur par source, sans mélanger les formats directement dans l'interface.
- Afficher capacité, places disponibles, adresse, horaires et heure de mise à jour.
- Gérer les erreurs et les données anciennes sans afficher de valeur trompeuse.

## Étape 2 — Modèle de données commun

L'interface devra consommer un format interne stable :

```ts
type ParkingAvailability = {
  id: string;
  name: string;
  location: { latitude: number; longitude: number };
  capacity?: number;
  availableSpaces?: number;
  status: "open" | "closed" | "unknown";
  observedAt: string;
  sourceId: string;
  confidence: "official-realtime" | "historical-estimate" | "unknown";
};
```

## Étape 3 — Qualité des données

- Afficher l'âge exact de la donnée.
- Ne jamais transformer une donnée manquante en zéro.
- Détecter les valeurs impossibles : disponibilité négative ou supérieure à la capacité.
- Conserver les erreurs de synchronisation dans des logs non sensibles.
- Ajouter des tests sur chaque adaptateur.

## Étape 4 — Estimations de rue, uniquement si une source sérieuse existe

Cette fonctionnalité ne sera activée que si la ville fournit au moins une source exploitable :

- comptages historiques d'occupation ;
- statistiques agrégées et anonymisées de stationnement ;
- données officielles de rotation ;
- caméra officiellement réutilisable et réellement orientée vers des places.

Sans ces données, l'application affichera « occupation inconnue » au lieu d'inventer un score.

## Étape 5 — Caméras publiques

Une caméra ne sera ajoutée que si :

1. sa source est officielle ;
2. son flux ou ses images ont une licence compatible ;
3. son usage respecte les conditions d'accès ;
4. l'analyse ne conserve pas de plaques ni de visages ;
5. l'angle et la fréquence permettent une mesure utile ;
6. la fiabilité est visible dans l'interface.

## Hors périmètre volontaire

- Pas de signalements communautaires.
- Pas de capteurs à installer.
- Pas de récupération de flux cachés ou de caméras privées.
- Pas de promesse de connaître toutes les places de rue.
- Pas de stockage de plaques d'immatriculation ou de visages.
- Pas de modèle économique avant validation de l'utilité.

## Ordre conseillé pour les prochaines IA

1. Inspecter ce dépôt et lire cette documentation.
2. Étudier les sources officielles de la ville choisie.
3. Proposer un adaptateur et ses tests avant de modifier l'interface.
4. Ajouter une seule source fonctionnelle.
5. Vérifier les données manuellement et par tests.
6. Ajouter les autres sources une par une.
