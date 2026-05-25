# Configuration CORS — CloudFront CDN (cdn.safliix.com)

## Contexte

Le player vidéo HLS du dashboard (`dashboard.safliix.com`) charge les manifests et segments depuis le CDN (`cdn.safliix.com`). Ces deux domaines sont des origines différentes — le navigateur applique donc la politique CORS.

HLS.js est configuré avec `withCredentials: true` pour envoyer les cookies CloudFront signés à chaque requête. Cette configuration impose deux contraintes strictes côté CloudFront :

- `Access-Control-Allow-Origin` doit être une **origine explicite** (pas `*`)
- `Access-Control-Allow-Credentials: true` doit être présent

Sans ces headers, le navigateur bloque les réponses CloudFront malgré des cookies valides.

## Erreur observée

```
Access to XMLHttpRequest at 'https://cdn.safliix.com/...' from origin
'https://dashboard.safliix.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Configuration à appliquer sur AWS

### Étape 1 — Créer une Response Headers Policy

Aller dans **CloudFront > Policies > Response headers > Create response headers policy**.

| Paramètre | Valeur |
|---|---|
| Nom | `safliix-hls-cors-policy` |
| Access-Control-Allow-Origin | `https://dashboard.safliix.com` |
| Access-Control-Allow-Credentials | `true` |
| Access-Control-Allow-Methods | `GET, HEAD, OPTIONS` |
| Access-Control-Allow-Headers | `*` |
| Access-Control-Max-Age | `86400` |

> Ne pas utiliser `Origin: *` — incompatible avec `Allow-Credentials: true`.

### Étape 2 — Attacher la policy au Behavior HLS

Aller dans **CloudFront > Distributions > [distribution cdn.safliix.com] > Behaviors**.

Éditer le behavior qui couvre le path `/videos/hls/*` (ou `/*` si un seul behavior existe) :

- **Response headers policy** → sélectionner `safliix-hls-cors-policy`

### Étape 3 — Autoriser le header Origin dans la Cache Policy

Toujours dans le même Behavior, vérifier la **Cache policy** :

- Le header `Origin` doit être dans la **Headers allowlist** de la cache key

Si ce n'est pas le cas, CloudFront va servir une réponse cachée sans CORS à toutes les origines. Deux options :

- Utiliser la policy managée **`CachingOptimized`** + une **Origin Request Policy** qui forward le header `Origin`
- Ou créer une cache policy custom incluant `Origin` dans la cache key

### Étape 4 — Vérifier la configuration S3 (si l'origine CloudFront est un bucket S3)

Si CloudFront est configuré en **Origin Access Control (OAC)** vers un bucket S3, ajouter la CORS configuration sur le bucket :

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://dashboard.safliix.com"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 86400
  }
]
```

> Si CloudFront gère déjà la response headers policy (étape 1), cette étape S3 est optionnelle mais recommandée pour la cohérence.

## Validation

Après déploiement, vérifier dans DevTools (onglet Réseau, requête `master.m3u8`) que la réponse contient :

```
access-control-allow-origin: https://dashboard.safliix.com
access-control-allow-credentials: true
```

Le player vidéo doit charger sans erreur CORS.

## Rappel — Authentification CloudFront (déjà en place)

La distribution utilise des **Signed Cookies** pour protéger le contenu. Le dashboard pose ces cookies via l'endpoint NestJS `/admin/contents/{id}/playback` → transmis au navigateur par le proxy Next.js. HLS.js les envoie automatiquement grâce à `withCredentials: true`. Ce mécanisme fonctionne correctement — seul le CORS manque.
