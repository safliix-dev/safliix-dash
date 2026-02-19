import { type PaginatedResponse, type PageInfo } from "./common";

export type FilmStatus = "DRAFT" | "PROCESSING" | "PUBLISHED" | "ARCHIVED";

export interface FilmListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: FilmStatus;
  category?: string;
  sort?: string;
}

export type FilmDistributionType = "abonnement" | "location";

export interface FilmGeoPoint {
  name: string;
  value: number;
}

export interface SubscriptionFilmStats {
  subscriberViewPercentage: number;
  totalViews: number;
  totalMinutesWatched: number;
  catalogTotalMinutes: number;
  cumulativeViewMinutes: number;
  revenue: number;
}

export interface RentalFilmStats {
  totalRentals: number;
  revenue: number;
  topCountries: FilmGeoPoint[];
}


export type FilmStatsByType =
  | {
      type: "abonnement";
      stats: SubscriptionFilmStats;
    }
  | {
      type: "location";
      stats: RentalFilmStats;
    };




export interface FilmListItem {
  id: string;
  title: string;
  status: FilmStatus;
  director: string;
  dp: string;
  category: string;
  poster: string;
  hero: string;
  type: FilmDistributionType;
  stats: FilmStatsByType;

  stars?: number;
  donut?: { label?: string; value: number; color?: string };
  createdAt:string;
  updatedAt:string;
}


export type FilmListResponse = PaginatedResponse<FilmListItem>;

export interface FilmDetail {
  id: string;
  title: string;
  status: FilmStatus;
  category: string;
  director: string;
  dp: string;
  description?: string;
  language?: string;
  mainLanguage?: string;
  productionHouse?: string;
  country?: string;
  productionCountry?: string;
  type?: string;
  format?: string;
  genre?: string;
  gender?: string;
  actors?: string | string[] | { name: string; actorId?: string }[];
  secondType?: string;
  duration: string | number;
  releaseDate: string;
  publishDate: string;
  plateformDate?: string;
  price: number;
  rentalPrice?: number | null;
  poster: string;
  hero: string;
  synopsis: string;
  stats: FilmStatsByType;
  activity?: unknown[];
  geo?: FilmGeoPoint[];
  blockCountries?: string[];
  entertainmentMode?: string;
  ageRating?: string;
  rightHolderId?: string;
  isSafliixProd?: boolean;
  haveSubtitles?: boolean;
  subtitleLanguages?: string[];
}

export interface FilmActionPayload {
  action: "publish" | "pause";
}

export interface FilmActionResponse {
  status: FilmStatus;
}

export type FilmUploadKey = "main" | "secondary" | "trailer" | "movie";

export interface FilmUploadFileDescriptor {
  key: FilmUploadKey;
  name: string;
  type: string;
  attachmentType: "MAIN" | "TRAILER" | "BONUS" | "MAKING_OF" | "CLIP" | "PREVIEW" | "ADVERTISEMENT" | "THUMBNAIL" | "POSTER" | "BANNER";
}

export interface FilmUploadSlot {
  key: FilmUploadKey;
  uploadUrl: string;
  finalUrl: string;
}

export interface FilmUploadFinalizePayload {
  uploads: Array<Pick<FilmUploadSlot, "key" | "finalUrl">>;
}

export interface FilmMetaCategory {
  id: string;
  category: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilmMetaFormat {
  id: string;
  format: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilmMetaGenre {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilmMetaActor {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilmMetaRightHolder {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  sharePercentage?: number;
}

export interface FilmMetaOptions {
  types: string[];
  categories: FilmMetaCategory[];
  formats: FilmMetaFormat[];
  genres: FilmMetaGenre[];
  actors: FilmMetaActor[];
  countries: string[];
  productionHouses: string[];
  rightHolders: FilmMetaRightHolder[];
  languages?: string[];
}

export interface FilmMetadataPayload {
  title: string;
  description: string;
  productionHouse: string;
  productionCountry: string;
  type: string;
  rentalPrice: number | undefined;
  releaseDate: string;
  plateformDate: string;
  format: string;
  category: string;
  entertainmentMode: string;
  gender: string;
  director: string;
  actors: { actorId?: string; name: string }[];
  isSafliixProd: boolean;
  haveSubtitles: boolean;
  subtitleLanguages?: string[];
  mainLanguage: string;
  ageRating?: string;
  duration: number | null;
  rightHolderId: string;
  blockedCountries?: string[];
}

export type FilmActor = { actorId?: string; name: string };

export type FilmFormData = {
  title: string;
  description: string;
  language: string;
  productionHouse: string;
  country: string;
  blockCountries: string[];
  type: string;
  price: number | null;
  releaseDate: string;
  publishDate: string;
  format: string;
  category: string;
  genre: string;
  actors: FilmActor[];
  director: string;
  duration: number | null;
  ageRating: string;
  isSafliixProd: boolean;
  haveSubtitles: boolean;
  subtitleLanguages: string[];
  rightHolderId: string;
  mainImage: File | null;
  secondaryImage: File | null;
  trailerFile: File | null;
  movieFile: File | null;
  entertainmentMode: string;
};

export type FilmPresignedSlot = {
  key: string;        // Ex: "mainImage", "movieFile" (doit correspondre aux clés de TSlot)
  uploadUrl: string;  // L'URL signée temporaire (ex: URL S3 avec token) pour le PUT
  finalUrl: string;   // L'URL publique ou privée finale que le serveur enregistrera en BDD
};

export interface FilmCreateOrUpdateResponse {
  id: string;
}

//export interface FilmPageInfo extends PageInfo {}
