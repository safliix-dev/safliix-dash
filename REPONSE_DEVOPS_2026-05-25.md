# Réponse archi DEV — suite analyse CORS + Signed Cookies
_2026-05-25_

---

## 1. Option retenue

**Option B confirmée.** CF Function garde le rôle principal, Response Headers Policy en filet pour les erreurs CloudFront. Tu peux procéder à la config AWS.

---

## 2. Points DEV vérifiés (4a → 4d)

### 4a — Variable `S3_PUBLIC_BASE_URL`
pointent bien vers le cdn

### 4b — Cookies CloudFront dans le navigateur
**Confirmé côté DEV.** Le fix du proxy Next.js (`/api/proxy/[...path]/route.ts`) est en place depuis le 24/05 — les `Set-Cookie` du backend NestJS sont maintenant transmis au navigateur. On a observé dans DevTools que les trois cookies arrivent correctement sur `dashboard.safliix.com` avec les bons attributs (`Domain=.safliix.com`, `Secure`, `HttpOnly`, `SameSite=None`).

Extrait des request headers observés côté CDN :
```
cookie: CloudFront-Key-Pair-Id=K28KB4HM9OKC7S;
        CloudFront-Signature=CqFBbFMW~91x...;
        CloudFront-Expires=1779645385
```

Les cookies transitent bien de NestJS → proxy Next.js → navigateur → CloudFront.

### 4c — Timing HLS.js
Pas de problème identifié. `hls.loadSource()` est appelé uniquement après que `usePlayback` a résolu l'appel `/playback` et posé `setUrl(mediaUrl)` — les cookies sont donc présents avant que HLS.js démarre.

### 4d — Proxy HLS `/api/hls-proxy`
**Approche A (direct) confirmée.** On reste sur HLS.js → CDN directement. Le proxy `/api/hls-proxy` restera en place comme outil de debug mais ne sera pas activé en production.

---

## 3. Correction sur `HLS_CLOUDFRONT_ERROR.md`

Le document produit le 24/05 contenait une erreur d'analyse :

> "Le backend retourne une URL `master.m3u8` brute sans paramètres de signature."

C'est incorrect. L'architecture utilise bien des **Signed Cookies** — l'URL n'a pas et ne doit pas avoir de paramètres de signature. Le backend signe correctement via les cookies posés au moment du `/playback`. Ce doc est à ignorer sur ce point.

---

## 4. Résumé de l'état actuel

| Élément | Statut |
|---|---|
| Signed Cookies posés par NestJS | ✅ |
| Cookies transmis au navigateur par le proxy Next.js | ✅ (fix 24/05) |
| Cookies envoyés à CloudFront par HLS.js (`withCredentials: true`) | ✅ |
| CF Function CORS `safliix-cors-allow-credentials` | ✅ déployée |
| Response Headers Policy (filet erreurs CloudFront) | ⏳ en attente config AWS (Option B) |
| `S3_PUBLIC_BASE_URL` vérifié sur svr-back | ⏳ à vérifier |

Le seul blocage restant est le CORS sur les réponses d'erreur CloudFront — c'est ce que la Response Headers Policy (Option B) va couvrir.
