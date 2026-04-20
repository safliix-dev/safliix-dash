// types/api/episodes.ts

// types/api/episode.ts

export type EpisodeFormData = {
  title: string;
  description: string;
  isCustomProduction: boolean;
  status: string;
  duration: number | null;  // 👈 Peut être number ou null
  releaseDate: string;
  publishDate: string;
  director: string;
  episodeNumber: number | null;  // 👈 Peut être number ou null
  actors: Array<{ actorId?: string; name: string }>;
  seriesId: string;
  seasonId: string;
  mainImage?: File | null;
  movieFile?: File | null;
  trailerFile?: File | null;
  subtitleFile?: File | null;
}

export interface EpisodeMetadataPayload {
  title: string;
  description: string;
  isCustomProduction: boolean;
  status: string;
  duration: number;
  releaseDate: string;
  plateformDate: string;
  director: string;
  episodeNumber: number;
  actors: string;
  seriesId: string;      // 👈 Ajouté
  seasonId: string;      // 👈 Ajouté
}

export interface EpisodeMetaOptions {
  statusOptions: string[];
  actors?: Array<{ id: string; name: string }>;
}

export type EpisodeSlot = 'MAIN' | 'MOVIE' | 'TRAILER' | 'SUBTITLE' | 'POSTER';

export interface EpisodeListParams  extends Record<string, unknown> { page?: number; pageSize?: number }
export interface EpisodeItem {
  id: string;
  title: string;
  releaseDate?: string;
  publishDate?: string;
  status?: string;
  duration?: string;
}

export interface EpisodeDetail extends EpisodeItem {
  director?: string;
  synopsis?: string;
  language?: string;
  productionFlag?: string;
}

export interface EpisodeCreateOrUpdateResponse { id: string }




