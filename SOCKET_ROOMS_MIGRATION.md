# Migration : Suppression du système de rooms Socket.io

## Contexte

Le dashboard (client Next.js) n'utilise plus le système de rooms Socket.io.  
Tous les clients authentifiés reçoivent désormais les events de jobs via broadcast global.

Cette simplification élimine les problèmes liés à la gestion d'état des rooms (race conditions, rooms vides au moment de l'emit, état non partagé entre instances).

---

## Fichiers concernés

| Fichier | Nature des changements |
|---|---|
| `admin.gateway.ts` | Suppression rooms, remplacement emits ciblés → broadcast |
| `socket-notification.service.ts` | Suppression du paramètre `room` |
| `task-progress-coordinator.service.ts` | Adaptation des appels |

---

## 1. `admin.gateway.ts`

### Supprimer les imports et types devenus inutiles

```typescript
// SUPPRIMER
import { IsEnum } from 'class-validator';
import { JobRoom } from '@safliix-backend/video-process-type';

export class JoinRoomDto {
  @IsEnum(JobRoom)
  room!: JobRoom;
}
```

```typescript
// SUPPRIMER dans AuthenticatedSocket
joinedRooms?: Set<string>;
```

### Supprimer dans la classe

- La propriété `private userRooms = new Map<string, Set<string>>();`
- Les méthodes `getRoomSize()`, `safeEmit()`, `emitToRoom()`
- Les handlers `handleJoinRoom()` et `handleLeaveRoom()` avec leurs décorateurs

### Simplifier `handleConnection`

```typescript
// SUPPRIMER ces blocs dans handleConnection
client.joinedRooms = new Set();

const previousRooms = this.userRooms.get(userId);
if (previousRooms?.size) {
  previousRooms.forEach((room) => {
    client.join(room);
    client.joinedRooms?.add(room);
  });
  this.userRooms.delete(userId);
}

if (!client.joinedRooms.has(JobRoom.ALL)) {
  client.join(JobRoom.ALL);
  client.joinedRooms.add(JobRoom.ALL);
}
```

```typescript
// CE QUI RESTE dans handleConnection (partie post-auth)
client.isAuthenticated = true;
client.tokenPayload = payload;
client.userId = userId;

client.emit('authenticated', {
  userId,
  timestamp: new Date().toISOString(),
});
```

### Simplifier `handleDisconnect`

```typescript
// AVANT
handleDisconnect(client: AuthenticatedSocket) {
  this.logger.log(`❌ Disconnect: ${client.id}`);
  if (client.userId && client.joinedRooms?.size) {
    this.userRooms.set(client.userId, new Set(client.joinedRooms));
  }
}

// APRÈS
handleDisconnect(client: AuthenticatedSocket) {
  this.logger.log(`❌ Disconnect: ${client.id}`);
}
```

### Remplacer les méthodes `emitXxx` par broadcast

Même pattern pour toutes les méthodes. Exemple avec `emitProgress` :

```typescript
// AVANT
emitProgress(room: JobRoom, s3Key: string, state: any): void {
  if (!this.isServerReady() || !state) return;

  const payload = { s3Key, room, ...state, timestamp: new Date().toISOString(), _dedupId: `${Date.now()}-${Math.random()}` };

  if (this.getRoomSize(room) > 0) {
    this.safeEmit(room, 'job_progress', payload);
  }
  if (room !== JobRoom.ALL && this.getRoomSize(JobRoom.ALL) > 0) {
    this.safeEmit(JobRoom.ALL, 'job_progress', payload);
  }
}

// APRÈS
emitProgress(s3Key: string, state: any): void {
  if (!this.isServerReady() || !state) return;
  this.server.emit('job_progress', {
    s3Key,
    ...state,
    timestamp: new Date().toISOString(),
  });
}
```

Appliquer le même pattern à toutes les méthodes :

```typescript
emitJobCreated(job: any): void {
  if (!this.isServerReady()) return;
  this.server.emit('job_created', { job, createdAt: new Date().toISOString() });
  this.logger.log(`🆕 Job created: ${job.id}`);
}

emitJobCompleted(jobId: string, s3Key: string, outputUrl?: string): void {
  if (!this.isServerReady()) return;
  this.server.emit('job_completed', { jobId, s3Key, outputUrl, status: 'completed', completedAt: new Date().toISOString() });
  this.logger.log(`✅ Job completed: ${jobId}`);
}

emitJobFailed(jobId: string, s3Key: string, error: string): void {
  if (!this.isServerReady()) return;
  this.server.emit('job_failed', { jobId, s3Key, error, status: 'failed', failedAt: new Date().toISOString() });
  this.logger.error(`❌ Job failed: ${jobId} - ${error}`);
}

emitJobPaused(jobId: string): void {
  if (!this.isServerReady()) return;
  this.server.emit('job_paused', { jobId, status: 'paused', pausedAt: new Date().toISOString() });
}

emitJobResumed(jobId: string): void {
  if (!this.isServerReady()) return;
  this.server.emit('job_resumed', { jobId, status: 'processing', resumedAt: new Date().toISOString() });
}

emitJobDeleted(jobId: string): void {
  if (!this.isServerReady()) return;
  this.server.emit('job_deleted', { jobId, deletedAt: new Date().toISOString() });
}

emitJobUpdated(jobId: string, updates: any): void {
  if (!this.isServerReady()) return;
  this.server.emit('job_updated', { jobId, ...updates, updatedAt: new Date().toISOString() });
}
```

### Garder uniquement `isServerReady`

```typescript
private isServerReady(): boolean {
  return !!this.server?.sockets;
}
```

---

## 2. `socket-notification.service.ts`

Supprimer le paramètre `room: JobRoom` de toutes les méthodes :

```typescript
// AVANT
async notifyProgress(jobId: string, s3Key: string, state: VideoProgressState, room: JobRoom): Promise<void> {
  this.gateway.emitProgress(room, s3Key, { jobId, ... });
}

// APRÈS
async notifyProgress(jobId: string, s3Key: string, state: VideoProgressState): Promise<void> {
  this.gateway.emitProgress(s3Key, { jobId, stage: state.stage, progress: state.progress, status: state.status, message: state.message, updatedAt: state.updatedAt });
}
```

```typescript
// AVANT
async notifyJobCreated(room: JobRoom, job: any): Promise<void>
async notifyJobCompleted(room: JobRoom, jobId: string, s3Key: string, outputUrl?: string): Promise<void>
async notifyJobFailed(room: JobRoom, jobId: string, s3Key: string, error: string): Promise<void>
async notifyJobPaused(room: JobRoom, jobId: string): Promise<void>
async notifyJobResumed(room: JobRoom, jobId: string): Promise<void>
async notifyJobDeleted(room: JobRoom, jobId: string): Promise<void>

// APRÈS — supprimer room: JobRoom de toutes les signatures
async notifyJobCreated(job: any): Promise<void>
async notifyJobCompleted(jobId: string, s3Key: string, outputUrl?: string): Promise<void>
async notifyJobFailed(jobId: string, s3Key: string, error: string): Promise<void>
async notifyJobPaused(jobId: string): Promise<void>
async notifyJobResumed(jobId: string): Promise<void>
async notifyJobDeleted(jobId: string): Promise<void>
```

---

## 3. `task-progress-coordinator.service.ts`

Mettre à jour tous les appels à `socketNotification` pour retirer l'argument `room` :

```typescript
// init()
// AVANT
await this.socketNotification.notifyJobCreated(room, jobData);
// APRÈS
await this.socketNotification.notifyJobCreated(jobData);

// updateProgress()
// AVANT
await this.socketNotification.notifyProgress(jobId, s3Key, state, room);
// APRÈS
await this.socketNotification.notifyProgress(jobId, s3Key, state);

// markCompleted()
// AVANT
await this.socketNotification.notifyProgress(jobId, s3Key, state, room);
await this.socketNotification.notifyJobCompleted(room, jobId, s3Key, metadata.masterPlaylistUrl);
// APRÈS
await this.socketNotification.notifyProgress(jobId, s3Key, state);
await this.socketNotification.notifyJobCompleted(jobId, s3Key, metadata.masterPlaylistUrl);

// markFailed()
// AVANT
await this.socketNotification.notifyError(s3Key, reason, room, jobId);
await this.socketNotification.notifyJobFailed(room, jobId, s3Key, reason);
// APRÈS
await this.socketNotification.notifyError(s3Key, reason, jobId);
await this.socketNotification.notifyJobFailed(jobId, s3Key, reason);
```

Le paramètre `room: JobRoom` peut être conservé dans `init()`, `updateProgress()`, `markCompleted()` et `markFailed()` s'il est utilisé ailleurs (Redis, logs, base de données). Il suffit de ne plus le passer à `socketNotification`.
