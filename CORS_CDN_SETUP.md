# Configuration CORS — cdn.safliix.com (AWS CloudFront)

## Contexte

Le dashboard Safliix (`https://dashboard.safliix.com`) utilise **HLS.js** pour lire les vidéos hébergées sur `https://cdn.safliix.com`.

HLS.js télécharge les fichiers `.m3u8` et les segments `.ts` via des requêtes `XMLHttpRequest` depuis le navigateur. Ces requêtes sont soumises à la politique CORS du navigateur.

**Erreur actuelle :**
```
Access to XMLHttpRequest at 'https://cdn.safliix.com/videos/hls/...' from origin
'https://dashboard.safliix.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

CloudFront ne retourne pas les headers CORS sur les fichiers vidéo, ce qui bloque entièrement la lecture côté navigateur.

---

## Headers CORS requis

Les réponses de CloudFront pour les fichiers `.m3u8` et `.ts` doivent inclure :

```
Access-Control-Allow-Origin: https://dashboard.safliix.com
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Range, Origin, Accept
Access-Control-Expose-Headers: Content-Length, Content-Range
```

> Si d'autres origines doivent accéder au CDN à l'avenir, remplacer la valeur de `Access-Control-Allow-Origin` par `*`.

---

## Étapes de configuration sur AWS CloudFront

### 1. Configurer la distribution CloudFront pour transférer le header `Origin`

Par défaut, CloudFront ne transfère pas le header `Origin` à l'origine (S3 ou autre). Sans ce header, S3 ne sait pas qu'il doit répondre avec CORS.

Dans **CloudFront > Distributions > [votre distribution] > Behaviors** :

1. Sélectionner le behavior qui correspond aux fichiers vidéo (ex. path pattern `*.m3u8`, `*.ts`, ou `*`)
2. Dans **Cache key and origin requests** → choisir une **Origin Request Policy**
3. Créer ou utiliser une policy qui inclut le header `Origin` dans les requêtes transmises à l'origine

**Policy minimale à créer (Origin Request Policy) :**
- Name : `ForwardOriginHeader`
- Headers : cocher `Origin`

---

### 2. Si l'origine est un bucket S3 — Activer CORS sur S3

Dans **S3 > [votre bucket] > Permissions > Cross-origin resource sharing (CORS)** :

Coller la configuration JSON suivante :

```json
[
  {
    "AllowedHeaders": ["Range", "Origin", "Accept"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://dashboard.safliix.com"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

> S3 ne retourne les headers CORS que si le header `Origin` est présent dans la requête entrante, d'où l'étape 1 obligatoire.

---

### 3. Configurer une Response Headers Policy sur CloudFront

Pour forcer les headers CORS même si l'origine ne les retourne pas (ou en complément), créer une **Response Headers Policy** dans CloudFront :

**CloudFront > Policies > Response headers > Create response headers policy**

| Paramètre | Valeur |
|-----------|--------|
| Name | `SafliixCORSPolicy` |
| Access-Control-Allow-Origin | `https://dashboard.safliix.com` |
| Access-Control-Allow-Methods | `GET, HEAD, OPTIONS` |
| Access-Control-Allow-Headers | `Range, Origin, Accept` |
| Access-Control-Expose-Headers | `Content-Length, Content-Range` |
| Access-Control-Max-Age | `3600` |
| Override origin | `Yes` |

Puis **associer cette policy** au behavior de la distribution (même emplacement qu'à l'étape 1).

---

### 4. Invalider le cache CloudFront

Après chaque modification, invalider le cache pour que les nouvelles headers s'appliquent immédiatement :

**CloudFront > Distributions > [votre distribution] > Invalidations > Create invalidation**

Path à invalider :
```
/*
```

Ou de façon plus ciblée :
```
/videos/hls/*
```

---

## Vérification

Une fois la configuration appliquée, vérifier avec `curl` :

```bash
curl -I -H "Origin: https://dashboard.safliix.com" \
  "https://cdn.safliix.com/videos/hls/movie/14032731-6638-4f2d-9c40-dcf55181c095/ec824a34-ca5f-44fc-83bb-997524e2866e-Comprendre_la_fin_des_temps_01.mp4/master.m3u8"
```

La réponse doit contenir :
```
access-control-allow-origin: https://dashboard.safliix.com
access-control-allow-methods: GET, HEAD, OPTIONS
```

---


*Document produit le 15/05/2026 — Équipe Dashboard Safliix*
