// types/api/seasons.ts

export interface SeasonFormData {
  numero: number | null;
  title: string;
  description: string;
  seriesId: string;
  poster?: File | null;
}

export interface SeasonMetadataPayload {
  numero: number;
  title: string;
  description: string;
}

export interface SeasonMetaOptions {
 options:string;
}

export interface SeasonSummary {
  id:string;
  numero: number | null;
  title: string;
  description: string;
  seriesId: string;
  poster?: string;
}

export type SeasonSlot = 'poster';