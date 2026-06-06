# Backend — API Attachments (gestion des fichiers)

## Contexte

Dans le formulaire de mise à jour d'un contenu (film, série, pub), le step 2 doit afficher la liste des fichiers déjà uploadés avec deux actions par slot :
- **Prévisualisation** — afficher l'image ou lire la vidéo
- **Mise à jour** — remplacer le fichier du slot via un modal

Le flow d'upload existant (presign → upload → finalize) est conservé tel quel pour le remplacement.

---

## 1. Lister les attachments d'un contenu

### Endpoint

```
GET /admin/content/:contentType/:id/attachments
```

**Paramètre `contentType`** : `movie` | `serie` | `ads`

### Exemple

```
GET /admin/content/movie/abc123/attachments
GET /admin/content/serie/xyz789/attachments
```

### Réponse attendue

```json
[
  {
    "mediaFileId": "mf_001",
    "type": "POSTER",
    "url": "https://cdn.example.com/posters/abc123.jpg",
    "mimeType": "image/jpeg"
  },
  {
    "mediaFileId": "mf_002",
    "type": "THUMBNAIL",
    "url": "https://cdn.example.com/thumbnails/abc123.jpg",
    "mimeType": "image/jpeg"
  },
  {
    "mediaFileId": "mf_003",
    "type": "MAIN",
    "url": null,
    "mimeType": "video/mp4"
  },
  {
    "mediaFileId": "mf_004",
    "type": "TRAILER",
    "url": null,
    "mimeType": "video/mp4"
  }
]
```

### Notes

- Pour les images (`POSTER`, `THUMBNAIL`) : `url` est l'URL publique directe, utilisée pour afficher la miniature.
- Pour les vidéos (`MAIN`, `TRAILER`, `BONUS`, etc.) : `url` peut être `null` — la prévisualisation passe par l'endpoint de playback existant.
- `mediaFileId` est requis pour identifier le slot lors d'une suppression.
- Retourner uniquement les slots qui ont un fichier effectivement uploadé.

---

## 2. Supprimer un attachment

### Endpoint

```
DELETE /admin/content/:contentType/:id/attachments/:attachmentType
```

**Paramètre `contentType`** : `movie` | `serie` | `ads`  
**Paramètre `attachmentType`** : `POSTER` | `THUMBNAIL` | `MAIN` | `TRAILER` | `BONUS` | etc.

### Exemple

```
DELETE /admin/content/movie/abc123/attachments/TRAILER
```

### Réponse attendue

```json
{ "ok": true }
```

### Comportement attendu

- Supprime le fichier physique du storage.
- Dissocie le `mediaFile` du contenu en base.
- **Tous les types sont autorisés à la suppression, y compris `MAIN`** — aucun blocage côté API. La responsabilité appartient à l'admin (un avertissement est affiché côté frontend avant confirmation).
- Retourne une erreur `404` si l'attachment n'existe pas.

---

## 3. Remplacer un attachment (flow existant)

Le remplacement utilise le flow d'upload déjà en place, aucun nouvel endpoint nécessaire.

```
POST /uploads/presign-uploads   → avec attachmentType ciblé
PUT  <signedUrl>                → upload direct vers le storage
POST /uploads/confirm-upload    → finalisation (écrase l'ancien slot)
```

### Comportement attendu pour le finalize sur un slot existant

- Si un `mediaFile` existe déjà pour ce `contentId` + `attachmentType`, il est **remplacé atomiquement** — l'ancien est supprimé du storage et dissocié en base avant d'associer le nouveau.
- Aucune erreur de doublon ne doit être retournée.
- L'opération doit être atomique : à aucun moment le slot ne doit se retrouver vide entre la suppression de l'ancien et l'association du nouveau.

---

## Récapitulatif

| Action | Méthode | Endpoint | Statut |
|--------|---------|----------|--------|
| Lister les attachments d'un contenu | `GET` | `/admin/content/:contentType/:id/attachments` | **À implémenter** |
| Supprimer un attachment | `DELETE` | `/admin/content/:contentType/:id/attachments/:attachmentType` | **À implémenter** |
| Remplacer un attachment | `POST/PUT/POST` | Flow presign existant | Déjà disponible |
