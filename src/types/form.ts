export type SuggestionOption = { label: string; value: string };
export type ActorType = { actorId?: string; name: string };
// types/forms.ts
export interface MediaFileFields {
  mainImage?: File | null;
  movieFile?: File | null;
  trailerFile?: File | null;
  episodeFile?: File | null;
  subtitleFile?: File | null;
}

export interface BaseMetadata {
  title?: string;
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Pour permettre d'autres champs
}