# Inventaire des formulaires — safliix-dash

> Généré le 2026-05-13  
> Légende : **\*** = champ requis | *(conditionnel)* = requis uniquement en mode création

---

## 1. `src/app/users/edit/[id]/page.tsx`

Formulaire de création / modification d'un utilisateur.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `firstName` | text | Prénom | **\*** |
| `lastName` | text | Nom | **\*** |
| `phone` | text | Téléphone | Non |
| `email` | email | Email | **\*** |
| `password` | password | Mot de passe / Nouveau mot de passe | **\*** *(création uniquement)* |
| `confirmPassword` | password | Confirmer le mot de passe | **\*** *(création uniquement)* |
| `role` | select | Rôle | Non |
| `status` | select | Statut | Non |
| `avatarUrl` | text | URL de l'avatar | Non |

---

## 2. `src/app/admins/add/[id]/page.tsx`

Formulaire de création / modification d'un administrateur.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `firstName` | text | Prénom | **\*** *(création uniquement)* |
| `lastName` | text | Nom | **\*** *(création uniquement)* |
| `email` | email | Email | **\*** *(création uniquement)* |
| `phone` | text | Téléphone | Non |
| `country` | text | Pays | **\*** *(création uniquement)* |
| `city` | text | Ville | **\*** *(création uniquement)* |
| `password` | password | Mot de passe | **\*** *(création uniquement)* |
| `confirmPassword` | password | Confirmation | Non *(validate : correspondance)* |
| `status` | select | Statut | Non |
| `role` | select | Rôle | Non |

---

## 3. `src/app/subscriptions/plans/edit/[id]/page.tsx`

Formulaire de création / modification d'un plan d'abonnement.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `name` | text | Nom du plan | **\*** *(création uniquement)* |
| `price` | number | Prix | **\*** *(création uniquement)* |
| `yearlyDiscount` | number | Taux de réduction (%) | Non |
| `currency` | select | Devise | Non |
| `maxSharedAccounts` | number | Appareils | **\*** *(création uniquement)* |
| `quality` | select | Qualité max | Non |
| `description` | textarea | Description | Non |

---

## 4. `src/app/subscriptions/promos/edit/[id]/page.tsx`

Formulaire de création / modification d'une promotion.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `name` | text | Nom | **\*** |
| `isActive` | select | Actif | Non |
| `startDate` | date | Date de début | **\*** |
| `endDate` | date | Date de fin | **\*** |

---

## 5. `src/app/rights-holders/edit/[id]/page.tsx`

Formulaire de création / modification d'un ayant droit.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `firstName` | text | Prénom | **\*** *(création uniquement)* |
| `lastName` | text | Nom | **\*** *(création uniquement)* |
| `role` | text | Rôle / fonction | Non |
| `email` | email | Email | Non |
| `phone` | text | Téléphone | **\*** *(création uniquement)* |
| `scope` | text | Périmètre d'usage | Non |
| `sharePercentage` | number | Part (%) | **\*** *(création uniquement)* |
| `status` | select | Statut | Non |
| `startDate` | date | Date de début | Non |
| `endDate` | date | Date de fin | Non |
| `legal` | textarea | Mentions légales | Non |
| `notes` | textarea | Notes internes | Non |

---

## 6. `src/app/films/add/page.tsx` → `FilmMetaOption.tsx`

Étape 1 : Métadonnées du film.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `title` | text | Nom du Film | **\*** |
| `productionHouse` | suggestions | Maison de Production | **\*** |
| `country` | suggestions | Pays de Production | **\*** |
| `type` | select | Type | **\*** |
| `price` | number | Prix de location | **\*** *(si type = location)* |
| `releaseDate` | date | Date de sortie | **\*** |
| `publishDate` | date | Date de publication SaFLIX | **\*** |
| `format` | select | Format | **\*** |
| `category` | suggestions | Catégorie | **\*** |
| `genre` | suggestions | Genre | **\*** |
| `actors` | ActorsSelector | Acteurs principaux | **\*** |
| `director` | text | Directeur | **\*** |
| `duration` | number | Durée (minutes) | **\*** |
| `blockCountries` | CountryMultiSelect | Pays bloqués | Non |
| `rightHolderId` | suggestions | Ayant droit | Non |
| `entertainmentMode` | select | Type du programme | Non |
| `language` | select | Langue | **\*** |
| `ageRating` | select | Classification (âge) | Non |
| `description` | textarea | Synopsis | **\*** |
| `isSafliixProd` | checkbox | Production SaFlix | Non |
| `haveSubtitles` | checkbox | Sous-titres | Non |

## 6b. `src/app/films/add/FilmFile.tsx`

Étape 2 : Fichiers du film.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `mainImage` | file upload | Image principale | Implicite |
| `secondaryImage` | file upload | Image secondaire | Non |
| `movieFile` | video upload | Vidéo du film / Vidéo (optionnel) | Implicite *(si location)* |
| `trailerFile` | video upload | Bande annonce | Non |

---

## 7. `src/app/series/add/page.tsx` → `SeriesMetadataStep.tsx`

Étape 1 : Métadonnées de la série.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `title` | text | Nom de la série | **\*** |
| `productionHouse` | suggestions | Maison de production | **\*** |
| `country` | suggestions | Pays de production | **\*** |
| `category` | suggestions | Catégorie | **\*** |
| `genre` | suggestions | Genre | **\*** |
| `releaseDate` | date | Date de sortie | **\*** |
| `publishDate` | date | Date de publication SaFLIX | **\*** |
| `seasonCount` | number | Nombre de saisons | **\*** |
| `director` | text | Réalisateur | **\*** |
| `actors` | ActorsSelector | Acteurs principaux | **\*** |
| `rightHolderId` | suggestions | Ayant droit | Non |
| `blockCountries` | CountryMultiSelect | Pays bloqués | Non |
| `subtitleLanguages` | text | Langues de sous-titres | Non |
| `description` | textarea | Synopsis | **\*** |
| `isSafliixProd` | checkbox | Production SaFlix | Non |
| `haveSubtitles` | checkbox | Sous-titres | Non |
| `language` | suggestions | Langue | **\*** |
| `ageRating` | text | Classification (âge) | Non |

## 7b. `src/app/series/add/SeriesFilesStep.tsx`

Étape 2 : Fichiers de la série.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `mainImage` | file upload | Image principale | Implicite |
| `secondaryImage` | file upload | Image secondaire | Non |
| `trailerFile` | video upload | Bande annonce | Non |

---

## 8. `src/app/pub/new/page.tsx` → `AdsMetadataStep.tsx`

Étape 1 : Métadonnées de la publicité.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `title` | text | Nom de la pub | **\*** |
| `line` | text | Lien | **\*** |
| `startDate` | date | Mise en ligne | **\*** |
| `endDate` | date | Mise hors ligne | **\*** |
| `status` | select | Statut | **\*** |
| `description` | textarea | Description | **\*** |

## 8b. `src/app/pub/new/AdsFilesStep.tsx`

Étape 2 : Fichiers de la publicité.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `mainImage` | file upload | Image principale | Implicite |
| `secondaryImage` | file upload | Image secondaire | Non |

---

## 9. `src/app/series/addSeason/[id]/page.tsx` → `SeasonMetadataStep.tsx`

Étape 1 : Métadonnées de la saison.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `numero` | number | Numéro de saison | **\*** |
| `title` | text | Titre | Non |
| `description` | textarea | Description | Non |

## 9b. `src/app/series/addSeason/[id]/SeasonFilesStep.tsx`

Étape 2 : Fichiers de la saison.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `poster` | file upload | Affiche (poster) | Implicite |

---

## 10. `src/app/series/detail/[id]/episodes/add/page.tsx` → `EpisodeMetadataStep.tsx`

Étape 1 : Métadonnées de l'épisode.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `title` | text | Nom de l'épisode | **\*** |
| `episodeNumber` | number | Numéro d'épisode | **\*** |
| `releaseDate` | date | Date de sortie | **\*** |
| `publishDate` | date | Publication sur SaFLIX | **\*** |
| `director` | text | Réalisateur | **\*** |
| `duration` | number | Durée (minutes) | **\*** |
| `isCustomProduction` | checkbox | Production personnalisée | Non |
| `status` | select | Statut | **\*** |
| `description` | textarea | Description de l'épisode (synopsis) | **\*** |
| `actors` | ActorsSelector | Acteurs principaux | **\*** |

## 10b. `src/app/series/detail/[id]/episodes/add/EpisodeFilesStep.tsx`

Étape 2 : Fichiers de l'épisode.

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `mainImage` | file upload | Image principale | Implicite |
| `movieFile` | video upload | Fichier vidéo de l'épisode | Implicite |
| `subtitleFile` | file upload | Sous-titre | Non |

---

## 11. `src/app/settings/page.tsx`

Formulaire de profil utilisateur (tous les champs sont requis).

| Champ | Type | Label | Requis |
|-------|------|-------|--------|
| `firstName` | text | Prénom | **\*** |
| `lastName` | text | Nom | **\*** |
| `email` | email | Email | **\*** |
| `phone` | text | Téléphone | **\*** |
| `country` | text | Pays | **\*** |
| `role` | text | Rôle | **\*** |
| `address` | text | Adresse | **\*** |
