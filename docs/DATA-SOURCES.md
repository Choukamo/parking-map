# Sources de données et fiabilité

## Hiérarchie

### Niveau A — officiel et temps réel

Exemples : API d'un gestionnaire de parking ou portail open data municipal annonçant une disponibilité actuelle.

Affichage possible :

> 42 places disponibles — mise à jour il y a 2 minutes.

### Niveau B — officiel mais historique

Exemples : campagnes de comptage, statistiques de rotation ou taux d'occupation agrégés.

Affichage possible :

> Généralement disponible le mardi entre 14 h et 16 h.

Cette information n'est pas une disponibilité actuelle.

### Niveau C — indirect

Exemples : trafic routier, proximité de commerces, horaires, météo ou événements.

Ces éléments peuvent améliorer une prédiction, mais ne suffisent pas seuls à affirmer qu'une place est libre.

### Niveau D — non vérifié

Pages récupérées sans licence claire, flux cachés, sources anonymes ou informations trop anciennes.

Ces sources ne doivent pas alimenter l'application.

## Sources intégrées

### Paris — Stationnement en ouvrage concédé
- **Fournisseur :** Ville de Paris (Direction de la Voirie et des Déplacements)
- **Portail :** Paris Data (Opendatasoft v2.1 API)
- **Dataset :** `stationnement-en-ouvrage`
- **Licence :** Licence Ouverte (Etalab 2.0)
- **Fréquence :** Périodique (mise à jour officielle par la Ville)
- **Périmètre :** 125 parkings en ouvrage concédés (Indigo, Saemes, etc.)
- **Données fournies :** Coordonnées géographiques précises, capacité totale, horaires, tarifs (1h, 2h, 24h), places PMR, vélos, 2-roues motorisés, URL officielle.
- **Disponibilité temps réel :** Non fournie actuellement par la Ville de Paris sur ce jeu de données (le champ `availableSpaces` reste délibérément `undefined` et l'interface indique la transparence sur l'absence de capteurs temps réel).

## Sources envisagées

- APIs et open data des villes ;
- transport.data.gouv.fr et portails open data locaux ;
- gestionnaires de parkings, avec autorisation ;
- caméras officiellement publiées, uniquement lorsque la licence et l'usage sont clairs.

## Règles de sécurité et de conformité

- Ne pas aspirer un flux privé ou contourner une protection.
- Lire et respecter la licence de chaque dataset.
- Utiliser une API lorsqu'elle est proposée plutôt qu'un scraping de page.
- Ne pas conserver de vidéo brute si une simple mesure agrégée suffit.
- Ne pas conserver de plaque d'immatriculation ou de visage.
- Documenter la source et la date de dernière observation.
- Prévoir une politique de retrait si le fournisseur demande l'arrêt de la réutilisation.
