// types/socket.ts
/**
 * Rooms disponibles pour les jobs
 * Doit correspondre aux rooms définies côté serveur
 */
export type JobRoom = "movies" | "episodes" | "series" | "all";

// Si vous voulez une version plus stricte avec constantes
export const JOB_ROOMS = {
  MOVIES: "movies",
  EPISODES: "episodes",
  SERIES: "series",
  ALL: "all"
} as const;

export type JobRoomType = typeof JOB_ROOMS[keyof typeof JOB_ROOMS];

// types/job.ts
/**
 * Payload des mises à jour de job (doit correspondre au backend)
 */
export interface JobProgressPayload {
  /** ID unique du job */
  jobId: string;
  
  /** ID de l'entité liée (film/épisode/série) */
  entityId: string;
  
  /** Progression en pourcentage (0-100) */
  progress: number;
  
  /** Statut du job */
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  
  /** Étape actuelle du traitement */
  stage: string | null;
  
  /** Message d'erreur ou information */
  message?: string | null;
  
  /** Date de dernière mise à jour (ISO string) */
  updatedAt: string;
  
  /** Type d'entité (optionnel - pour filtrage client) */
  entityType?: 'movie' | 'episode' | 'serie';
}