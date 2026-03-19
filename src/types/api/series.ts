import { type PaginatedResponse } from "./common";

export type SeriesStatus = "publish" | "pause" | "draft" | string;


export type SeriesFormData = {
  title: string;
  description: string;
  language: string;
  productionHouse: string;
  country: string;
  blockCountries: string[];
  releaseDate: string;
  publishDate: string;
  category: string;
  seasonCount: number | null;
  genre: string;
  actors: string[];
  director: string;
  ageRating: string;
  isSafliixProd: boolean;
  haveSubtitles: boolean;
  subtitleLanguages: string[];
  rightHolderId?: string;
  mainImage: File | null;
  secondaryImage: File | null;
  trailerFile: File | null;
};


export interface SerieStats {
  subscriberViewPercentage: number;
  totalViews: number;
  totalMinutesWatched: number;
  catalogTotalMinutes: number;
  cumulativeViewMinutes: number;
  revenue: number;
}

export interface SeriesListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: SeriesStatus;
  category?: string;
  sort?: string;
}

export interface SeriesListItem {
  id: string;
  title: string;
  status: SeriesStatus;
  director?: string;
  dp?: string;
  number?: number | string;
  category?: string;
  poster?: string;
  hero?: string;
  stats: SerieStats;
  stars: number;
  donut?: { label?: string; value: number; color?: string };
  createdAt:string;
}

export type SeriesListResponse = PaginatedResponse<SeriesListItem>;

export interface SeriesDetail {
  id: string;
  title: string;
  status: SeriesStatus;
  category?: string;
  director?: string;
  dp?: string;
  poster?: string;
  hero?: string;
  synopsis?: string;
  seasons?: SeasonSummary[];
  stats?: Record<string, unknown>;
  productionHouse?: string;
  productionCountry?: string;
  releaseDate?: string;
  publishDate?: string;
  plateformDate?: string;
  seasonCount?: number;
  entertainmentMode?: string;
  gender?: string;
  actors?: string | string[] | { name: string; actorId?: string }[];
  description?: string;
  isSafliixProd?: boolean;
  haveSubtitles?: boolean;
  subtitleLanguages?: string[];
  mainLanguage?: string;
  ageRating?: string;
  rightHolderId?: string;
  blockedCountries?: string[];
}

export interface SeasonSummary {
  id: string;
  number: number;
  title?: string;
  poster?: string;
  episodesCount?: number;
}

export interface SeriesMetadataPayload {
  title: string;
  description: string;
  productionHouse: string;
  productionCountry: string;
  releaseDate: string;
  plateformDate: string;
  seasonCount: number | null;
  category: string;
  entertainmentMode: "SERIE";
  gender: string;
  director: string;
  actors: { actorId?: string; name: string }[];
  isSafliixProd: boolean;
  haveSubtitles: boolean;
  subtitleLanguages?: string[];
  mainLanguage: string;
  ageRating?: string;
  rightHolderId?: string;
  blockedCountries?: string[];
}

export interface SeriesCreateOrUpdateResponse { id: string }


export interface SeriesMetaOptionsResponse {
  options: Record<string, string[]>;
}

// Seasons
export interface CreateSeasonPayload {
  numero: number;
  title?: string;
  description?: string;
}


// Episodes
export interface EpisodeListParams { page?: number; pageSize?: number }
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

export interface EpisodeMetadataPayload {
  title: string;
  releaseDate: string;
  publishDate: string;
  director: string;
  duration: string;
  synopsis: string;
  status: string;
  language: string;
  productionFlag: string;
}

