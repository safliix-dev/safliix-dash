export type PlaybackAttachmentType = 'MAIN' | 'TRAILER' | 'BONUS' | 'CLIP' | 'ADVERTISEMENT';

export interface PlaybackMedia {
  id: string;
  url: string;
  type: string;
  duration: number;
  width: number;
  height: number;
  status: string;
}

export interface PlaybackResponse {
  id: string;
  type: string;
  media: PlaybackMedia[];
}
