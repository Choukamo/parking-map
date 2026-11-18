# Sources de données et fiabilité

## Hiérarchie de fiabilité

### Niveau A — Officiel et temps réel
- **Exemples :** API d'un gestionnaire de parking ou portail open data métropolitain diffusant les capteurs de barrière en direct.
- **Affichage :** Nombre exact de places disponibles, date/heure précise de mise à jour.
- **Candidats futurs :** Nantes Métropole, Eurométropole de Strasbourg, Bordeaux Métropole.

### Niveau B — Officiel mais statique / périodique
- **Exemples :** Recensement des parcs concédés, capacités totales, grilles tarifaires délibérées en conseil municipal, emplacements PMR et deux-roues.
- **Source actuelle :** Ville de Paris (`stationnement-en-ouvrage`).
- **Affichage :** Capacité totale connue, tarifs officiels, exploitant, sans simulation de disponibilité immédiate.

### Niveau C — Estimations & Historique (à venir)
- **Exemples :** Campagnes de comptage, modèles statistiques horaires agrégés.
- **Règle :** Ne doit jamais être confondu avec du temps réel. Mention explicite requise.

### Niveau D — Non vérifié (exclu)
- Scraping non autorisé de sites privés, flux cachés, saisies utilisateur non vérifiées.
- **Règle absolue :** Ces sources sont strictement interdites dans le projet.

---

## Source intégrée : Paris

### Stationnement en ouvrage concédé
- **Fournisseur :** Ville de Paris (Direction de la Voirie et des Déplacements)
- **Portail :** Paris Data (Opendatasoft v2.1 API)
- **Dataset :** `stationnement-en-ouvrage`
- **Licence :** Licence Ouverte (Etalab 2.0)
- **Fréquence de la Ville :** Périodique (mise à jour lors des avenants de concession ou modifications tarifaires)
- **Fréquence de l'application :** Cache Next.js ISR de **1 heure** (`revalidate = 3600`)
- **Périmètre :** 125 parkings en ouvrage concédés (Saemes, Indigo, Q-Park, etc.)
- **Données certifiées :**
  - Nom officiel de l'ouvrage
  - Coordonnées GPS vérifiées
  - Capacité totale (nombre de places)
  - Tarifs horaires (1h, 2h, 24h)
  - Accessibilité PMR, emplacements vélos et deux-roues motorisés (2RM)
  - Nom de l'exploitant et lien vers son site officiel
- **Disponibilité temps réel :** Non fournie actuellement par la Ville de Paris sur ce jeu de données municipal. Le champ `availableSpaces` reste délibérément `undefined` par intégrité de données.

---

## Prochaines sources prévues pour le Niveau A (Temps réel)

1. **Nantes Métropole Open Data** :
   - Dataset : `disponibilites-des-parkings-en-temps-reel`
   - Fréquence : Toutes les 5 minutes
   - Données : Places libres en direct (`disponible`), statut (ouvert/complet/fermé)
2. **Strasbourg Eurométropole** :
   - Dataset : `occupation-parkings-temps-reel`
   - Fréquence : Temps réel / minute
3. **Bordeaux Métropole** :
   - Dataset : `st_park_p` (Parkings temps réel)
