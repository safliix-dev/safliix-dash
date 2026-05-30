// types/api/episodes.ts

// types/api/episode.ts

export type EpisodeFormData = {
  title: string;
  description: string;
  duration: number | null;
  releaseDate: string;
  publishDate: string;
  episodeNumber: number | null;
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
  duration: number;
  releaseDate: string;
  plateformDate: string;
  episodeNumber: number;
  seriesId: string;
  seasonId: string;
}

export interface EpisodeMetaOptions {
  statusOptions: string[];
  actors?: Array<{ id: string; name: string }>;
}

export type EpisodeSlot = 'MAIN' | 'TRAILER' | 'SUBTITLE' | 'POSTER';

export interface EpisodeListParams  extends Record<string, unknown> { page?: number; pageSize?: number }
export interface EpisodeAttachment {
  id: string;
  type: "POSTER" | "MAIN" | "TRAILER" | "SUBTITLE";
  mediaFile: {
    id: string;
    s3Key: string;
    title: string;
    duration: number | null;
    status: string;
    mediaType: string;
  };
}

export interface EpisodeItem {
  id: string;
  title: string;
  number?: number;
  releaseDate?: string;
  platformDate?: string;
  status?: string;
  duration?: number;
  description?: string;
  seasonId?: string;
  posterUrl?: string;
  attachment?: EpisodeAttachment[];
}

export interface EpisodeDetail extends EpisodeItem {
  director?: string;
  synopsis?: string;
  language?: string;
  productionFlag?: string;
}

export interface EpisodeCreateOrUpdateResponse { id: string }




