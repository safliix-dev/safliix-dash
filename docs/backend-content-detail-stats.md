# Backend — API Stats détaillées (page de détail film / série)

## Contexte

Les pages de détail (`/films/detail/:id`, `/series/detail/:id`) affichent des statistiques enrichies par contenu. L'endpoint est générique et prend `contentType` en paramètre pour couvrir films, séries et publicités.

---

## Endpoint

```
GET /admin/content/:contentType/:id/stats
```

**Paramètre `contentType`** : `movie` | `serie` | `ads`

### Exemple

```
GET /admin/content/movie/abc123/stats
GET /admin/content/serie/xyz789/stats
```

---

## Réponse attendue

### Structure commune (film ET série)

```json
{
  "overview": {
    "totalViews": 23400,
    "revenue": 1250000,
    "avgWatchDurationMinutes": 74,
    "completionRate": 68.4,
    "avgRating": 4.2,
    "playlistAddCount": 312
  },
  "revenueEvolution": [
    { "date": "2026-05-06", "amount": 45000 },
    { "date": "2026-05-07", "amount": 62000 },
    { "date": "2026-05-08", "amount": 38000 }
  ],
  "topCountries": [
    { "label": "Togo",   "value": 8200 },
    { "label": "France", "value": 5100 },
    { "label": "Bénin",  "value": 4700 },
    { "label": "Sénégal","value": 1900 }
  ],
  "filmStats": null,
  "serieStats": null
}
```

> **Règle** : selon le `contentType`, exactement **un** des deux champs (`filmStats` ou `serieStats`) est renseigné, l'autre est `null`.

---

### `filmStats` — renseigné si `contentType = movie`

```json
"filmStats": {
  "totalRentals": 5600,
  "totalSubscriptionViews": 17800,
  "rentalRevenue": 840000,
  "subscriptionRevenue": 410000,
  "peakRentalDate": "2026-04-12",
  "peakRentalCount": 320
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `totalRentals` | `number` | Nombre total de locations |
| `totalSubscriptionViews` | `number` | Vues via abonnement |
| `rentalRevenue` | `number` | Revenus issus des locations (FCFA) |
| `subscriptionRevenue` | `number` | Revenus issus des abonnements (FCFA) |
| `peakRentalDate` | `string (ISO date)` | Jour avec le plus de locations |
| `peakRentalCount` | `number` | Nombre de locations ce jour-là |

---

### `serieStats` — renseigné si `contentType = serie`

```json
"serieStats": {
  "activeSubscribersThisMonth": 1420,
  "mostWatchedEpisode": {
    "episodeId": "ep_001",
    "title": "Pilote",
    "seasonNumber": 1,
    "episodeNumber": 1,
    "views": 9800
  },
  "mostPopularSeason": {
    "seasonId": "s_001",
    "seasonNumber": 1,
    "views": 21000
  },
  "seasonRetention": [
    { "fromSeason": 1, "toSeason": 2, "retentionRate": 72.3 },
    { "fromSeason": 2, "toSeason": 3, "retentionRate": 58.1 }
  ]
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `activeSubscribersThisMonth` | `number` | Abonnés ayant vu ≥ 1 épisode ce mois |
| `mostWatchedEpisode` | `object` | Épisode avec le plus de vues |
| `mostPopularSeason` | `object` | Saison avec le plus de vues |
| `seasonRetention` | `array` | Taux de rétention entre saisons consécutives (%) |

---

### `revenueEvolution`

Tableau de 30 entrées (une par jour, les 30 derniers jours).

| Champ | Type | Description |
|-------|------|-------------|
| `date` | `string (ISO date)` | Jour au format `YYYY-MM-DD` |
| `amount` | `number` | Revenus du jour en FCFA |

---

### `topCountries`

| Champ | Type | Description |
|-------|------|-------------|
| `label` | `string` | Nom du pays |
| `value` | `number` | Revenus ou vues (selon `contentType`) |

---

## Récapitulatif

| Champ racine | Présent pour | Null pour |
|---|---|---|
| `overview` | Tous | — |
| `revenueEvolution` | Tous | — |
| `topCountries` | Tous | — |
| `filmStats` | `movie` | `serie`, `ads` |
| `serieStats` | `serie` | `movie`, `ads` |
