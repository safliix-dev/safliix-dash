# Erreur HLS — CloudFront MissingKey

## Symptôme

Le player vidéo (HLS.js) échoue au chargement du manifest avec une fatal network error.

```
Fatal HLS error — details: "manifestLoadError" — type: "networkError" — status: 0
```

## URL concernée

```
https://cdn.safliix.com/videos/hls/movie/{contentId}/{attachmentId}-{filename}.mp4/master.m3u8
```

## Réponse CloudFront

**Status HTTP** : non lisible côté client (status 0 dû à l'absence de CORS headers sur la réponse d'erreur)

**Body XML retourné par CloudFront** :
```xml
<Error>
  <Code>MissingKey</Code>
  <Message>Missing Key-Pair-Id query parameter or cookie value</Message>
</Error>
```

**Response headers observés** :
```
content-type: text/xml
x-cache: Error from cloudfront
server: CloudFront
x-amz-cf-pop: LOS50-P3
```

## Cause

La distribution CloudFront est configurée avec des **Signed URLs / Signed Cookies**. Toute requête sans credentials CloudFront valides est rejetée.

Le backend retourne une URL `master.m3u8` brute dans `media[0].url` (endpoint `/admin/contents/{id}/playback`) sans paramètres de signature. HLS.js charge cette URL directement et CloudFront la refuse.

## Problème secondaire — CORS

La réponse d'erreur de CloudFront ne contient pas le header `Access-Control-Allow-Origin`. Le navigateur bloque l'accès à la réponse, ce qui masque le vrai code HTTP et affiche `status: 0` au lieu du statut réel. Configurer CloudFront pour inclure les headers CORS même sur les réponses d'erreur permettrait un meilleur diagnostic.

## Solution attendue côté backend

### Option A — Signed URL (dans la réponse du endpoint playback)

Signer l'URL avant de la retourner :

```
https://cdn.safliix.com/.../master.m3u8?Key-Pair-Id=XXXXX&Signature=XXXXX&Expires=1234567890
```

**Limite** : les segments `.ts` et les playlists de qualité référencés dans le manifest devront également être signés individuellement.

### Option B — Signed Cookies (recommandée pour HLS)

Poser les cookies CloudFront signés sur le domaine au moment où l'utilisateur demande la lecture :

```
CloudFront-Key-Pair-Id=XXXXX
CloudFront-Signature=XXXXX
CloudFront-Policy=XXXXX  (ou CloudFront-Expires)
```

HLS.js est déjà configuré avec `withCredentials: true` côté frontend — les cookies seront automatiquement envoyés pour le manifest ET tous les segments, sans modification supplémentaire.

## Contexte frontend

- Player : HLS.js avec `xhrSetup: xhr => { xhr.withCredentials = true }`
- URL source récupérée via `usePlayback` → `/admin/contents/{id}/playback?type=...&attachmentType=...`
- Un proxy HLS existe à `/api/hls-proxy` (réécrit les URLs relatives du manifest)
