# Décisions d'architecture et de conception

## 2026-11 — Démarrer par une carte vide
La carte initiale a été déployée sans données fictives pour valider l'infrastructure Next.js / Leaflet et le pipeline Vercel sans jamais induire l'utilisateur en erreur.

## 2026-11 — Une seule ville au départ (Paris)
Les formats, licences et fréquences variant selon les territoires, Paris a été retenu comme ville pilote avec le portail officiel **Paris Data** (dataset `stationnement-en-ouvrage`).

## 2026-11 — Pas de places simulées / Transparence sur le temps réel
La Ville de Paris ne publiant pas d'API de capteurs en direct des places libres dans ses concessions, le champ `availableSpaces` reste délibérément `undefined` tant qu'aucun capteur officiel n'est publié. Aucune fausse jauge ni faux pourcentage n'est calculé.

## 2026-11 — Fond de carte CartoDB Positron minimaliste
Le fond OpenStreetMap par défaut affichait trop de détails superflus (empreintes de petits immeubles, sentiers piétons, commerces, icônes diverses) qui saturaient la lisibilité sur smartphone. Nous avons basculé sur les tuiles **CartoDB Positron** (`light_all`), offrant une clarté optimale où seuls les axes routiers majeurs et les épingles de parking ressortent.

## 2026-11 — Affichage par rayon de proximité plutôt que la totalité
Afficher simultanément les 125 parkings parisiens submergeait la carte et nuisait à la fluidité. L'affichage est désormais restreint par défaut aux parkings situés dans un rayon de **1 km** autour de l'utilisateur (ou du centre de Paris si la géolocalisation est coupée), avec pastilles de sélection rapide (500m, 1km, 2km, 5km, tout Paris) et cercle de visualisation.

## 2026-11 — Interface Mobile-First & Panneau rétractable (Bottom Sheet)
L'usage cible principal étant le smartphone en situation de mobilité (conducteur cherchant à se garer) :
- Les filtres sont logés dans un panneau coulissant depuis le bas (Bottom Sheet), manipulable d'une seule main.
- Les actions principales (rayon, centrage GPS, itinéraire) sont directement accessibles au pouce.
- Le clic sur un marqueur ouvre une fiche d'aperçu compacte en bas d'écran sans masquer la carte.

## 2026-11 — Itinéraire direct vers Google Maps
Plutôt que d'intégrer un moteur de guidage lourd et énergivore dans le navigateur, un clic sur "Itinéraire" ouvre directement l'application de navigation native (Google Maps) avec les coordonnées GPS exactes du parking.

## 2026-11 — Épuration des popups et retrait du message d'avertissement répétitif
Le bandeau jaune informant de l'absence de capteur temps réel municipal polluait chaque fiche et réduisait la lisibilité. Il a été entièrement retiré des fiches et popups ; les informations utiles (tarif horaire, capacité totale, exploitant, distance) sont désormais mises en avant.

## 2026-11 — Mise en cache ISR de 1 heure
L'API route `/api/parkings/paris` met en cache la réponse d'OpenDataSoft avec une réévaluation toutes les 3600 secondes (`revalidate = 3600`). Cela protège les serveurs municipaux contre le sur-requêtage tout en garantissant des temps de chargement quasi-instantanés (< 50ms) pour les utilisateurs finaux.
