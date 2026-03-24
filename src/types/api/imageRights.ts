import { FilmListItem } from "./films";
import { SeriesListItem } from "./series";
export type ImageRightStatus = "actif" | "expiré" | "en attente";
export type RightsHolderOrder = "createdAt_desc" | "createdAt_asc";
export type RightsHolderContentType = "movie" | "serie";

export type ImageRightsFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  scope: string;
  sharePercentage: number;
  startDate?: string;
  endDate?: string;
  status: "actif" | "en attente" | "expiré";
  legal?: string;
  notes?: string;
};

export type ImageRightsFormStateUpdate = Partial<ImageRightsFormState>;

export interface RightsHolderListParams extends Record<string,unknown> {
  page: number;
  pageSize: number;
  search?: string;
  status?: ImageRightStatus;
  orderBy?: RightsHolderOrder;
}

export interface LinkedContent {
  id: string;
  title: string;
  type: "film" | "serie";
  role?: string;
  usageScope?: string;
  period?: string;
  poster?: string;
  status?: string;
}

export interface ImageRightsHolder {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  scope: string;
  sharePercentage: number;
  films: number;
  series: number;
  status: ImageRightStatus;
  lastUpdate?: string;
  avatar?: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImageRightsHolderDetail extends ImageRightsHolder {
  legalMentions?: string;
  guardian?: string;
  startedAt?: string;
  expiresAt?: string;
  notes?: string;
  documents?: { label: string; date: string; type: string }[];
  linkedContents: LinkedContent[];
}

export interface CreateRightsHolderPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  scope: string;
  sharePercentage: number;
  status?: ImageRightStatus;
  legalMentions?: string;
  notes?: string;
  startedAt?: string;
  expiresAt?: string;
}

export interface RightsHolderListResponse {
  items: ImageRightsHolder[];
  pageInfo?: { page: number; pageSize: number; totalItems?: number; totalPages?: number };
}

export interface RightsHolderContentItem {
  id: string;
  title: string;
  type?: "movie" | "serie" | "film" | string;
  status?: string;
  director?: string;
  dp?: string;
  number?: string | number;
  category?: string;
  poster?: string;
  hero?: string;
  stats?: Record<string, unknown>;
  geo?: { label?: string; name?: string; value?: number; max?: number; color?: string }[];
  stars?: number;
  donut?: Record<string, unknown>;
}

export interface RightsHolderContentResponse {
  id: string;
  firstName:string;
  lastName:string;
  email:string;
  sharePercentage:number;
  movies: FilmListItem[];
  series: SeriesListItem[];
}



