import { type TimeRangeParams } from "./common";

export interface AdsGeoBreakdown {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export interface AdsItem {
  id: string;
  title?: string;
  clientName?: string;
  creativeTitle?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  number?: string | number;
  poster?: string;
  banner?: string;
  cover?: string;
  createdAt?: string;
  score?: number;
  stats?: {
    views?: number | string;
    interactions?: number | string;
    clicks?: number | string;
    conversions?: number | string;
    vues?: number | string;
  };
  geo?: AdsGeoBreakdown[];
}

export interface AdsListParams extends TimeRangeParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sort?: string;
  search?: string;
}

export interface AdsListResponse {
  items: AdsItem[];
  pageInfo?: { page: number; pageSize: number; total: number };
}

// types/api/pub.ts

export type AdsFormData = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  line: string;
  status: string; // "Actif" | "Brouillon" | "Archivé"
  mainImage?: File | null;
  secondaryImage?: File | null;
}

export interface AdsMetadataPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  line: string;
  status: string;
  poster?: string;
}

export interface AdsMetaOptions {
  statusOptions: string[];
  lineOptions: string[];
}

export type AdsSlot = 'mainImage' | 'secondaryImage';