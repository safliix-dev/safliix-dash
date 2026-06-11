# Pré-remplissage des formulaires — Champs manquants dans les réponses API

## Contexte

Le dashboard récupère les données existantes via l'API pour pré-remplir les formulaires d'édition.
Plusieurs champs restent vides à l'ouverture car ils sont absents des réponses `GET`.

Exemple constaté sur film — réponse actuelle de `GET /admin/movies/:id` :

```json
{
  "id": "a300ae03-...",
  "title": "marc",
  "status": "PROCESSED",
  "type": "location",
  "category": "action",
  "director": "pap",
  "duration": null,
  "releaseDate": "2026-06-09T00:00:00.000Z",
  "publishDate": "2026-06-10T00:00:00.000Z",
  "price": 122,
  "synopsis": "gh"
}
```

Résultat : les champs **Maison de production, Pays, Genre, Acteurs, Durée, Ayant droit, Langue, Format, Classification, etc.** restent tous vides dans le formulaire.

---

## 1. Films — `GET /admin/movies/:id`

Champs attendus **absents ou null** dans la réponse actuelle :

| Champ | Type | Remarque |
|---|---|---|
| `productionHouse` | `string` | |
| `productionCountry` | `string` | accepté aussi sous `country` |
| `gender` | `string` | accepté aussi sous `genre` |
| `actors` | `{ name: string, actorId?: string }[]` | accepté aussi en `string[]` ou string JSON |
| `duration` | `number` | actuellement renvoyé à `null` |
| `rightHolderId` | `string` | UUID de l'ayant droit |
| `mainLanguage` | `string` | accepté aussi sous `language` |
| `format` | `string` | ex : `"LONG-METRAGE"` |
| `ageRating` | `string` | ex : `"12"`, `"TP"` |
| `entertainmentMode` | `string` | ex : `"Film"`, `"Divers"` |
| `isSafliixProd` | `boolean` | |
| `haveSubtitles` | `boolean` | |
| `subtitleLanguages` | `string[]` | |
| `blockCountries` | `string[]` | |
| `description` | `string` | `synopsis` est présent mais `description` est préféré |

---

## 2. Séries — `GET /series/:id`

Champs attendus à inclure dans la réponse :

| Champ | Type | Remarque |
|---|---|---|
| `productionHouse` | `string` | |
| `productionCountry` | `string` | |
| `gender` | `string` | |
| `actors` | `{ name: string, actorId?: string }[]` | |
| `mainLanguage` | `string` | |
| `ageRating` | `string` | |
| `isSafliixProd` | `boolean` | |
| `haveSubtitles` | `boolean` | |
| `subtitleLanguages` | `string[]` | |
| `rightHolderId` | `string` | |
| `description` | `string` | |
| `director` | `string` | |
| `entertainmentMode` | `string` | ex : `"SERIE"`, `"Divers"` |
| `blockedCountries` | `string[]` | |
| `releaseDate` | `string` | format ISO 8601 |
| `plateformDate` | `string` | format ISO 8601 |
| `seasonCount` | `number` | |
| `category` | `string` | |

---

## 3. Épisodes — `GET /series/episodes/:id`

| Champ | Type | Remarque |
|---|---|---|
| `title` | `string` | |
| `description` | `string` | |
| `duration` | `number` | en minutes |
| `releaseDate` | `string` | format ISO 8601 |
| `platformDate` | `string` | format ISO 8601 — utilisé pour "date de publication" |
| `number` | `number` | numéro de l'épisode dans la saison |
| `seasonId` | `string` | UUID de la saison |

---

## 4. Publicités — `GET /admin/ads/:id`

> **Cet endpoint n'existe pas encore et doit être créé.**

Réponse attendue :

| Champ | Type | Remarque |
|---|---|---|
| `id` | `string` | |
| `title` | `string` | |
| `description` | `string` | |
| `startDate` | `string` | format ISO 8601 |
| `endDate` | `string` | format ISO 8601 |
| `line` | `string` | numéro de ligne publicitaire |
| `status` | `string` | `"Actif"` / `"Brouillon"` / `"Archivé"` |

> **Note dashboard** : une mise à jour côté frontend sera faite en parallèle pour appeler ce endpoint lors de l'ouverture du formulaire d'édition d'une pub. Rien à faire côté dashboard pour les 3 autres types, le mapping est déjà en place.

---

## Récapitulatif

| Endpoint | Statut | Action requise |
|---|---|---|
| `GET /admin/movies/:id` | Incomplet | Ajouter les 15 champs listés |
| `GET /series/:id` | Incomplet | Ajouter les 17 champs listés |
| `GET /series/episodes/:id` | À vérifier | S'assurer que les 7 champs sont présents |
| `GET /admin/ads/:id` | Inexistant | Créer l'endpoint avec les 7 champs |
