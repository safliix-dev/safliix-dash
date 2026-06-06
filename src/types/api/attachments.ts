export type ContentApiType = 'movie' | 'serie' | 'ads';
export type PlaybackContentType = 'film' | 'serie' | 'episode';

export interface ContentAttachment {
  mediaFileId: string;
  type: string;
  url: string | null;
  mimeType: string;
}

export const ATTACHMENT_LABELS: Record<string, string> = {
  MAIN: 'Vidéo principale',
  TRAILER: 'Bande-annonce',
  BONUS: 'Bonus',
  CLIP: 'Clip',
  VIDEO: 'Vidéo',
  MAKING_OF: 'Making-of',
  PREVIEW: 'Aperçu',
  ADVERTISEMENT: 'Publicité',
  POSTER: 'Image principale',
  THUMBNAIL: 'Image secondaire',
  BANNER: 'Bannière',
};

const VIDEO_ATTACHMENT_TYPES = new Set([
  'MAIN', 'TRAILER', 'BONUS', 'CLIP', 'VIDEO',
  'MAKING_OF', 'PREVIEW', 'ADVERTISEMENT',
]);

export function isVideoAttachment(type: string): boolean {
  return VIDEO_ATTACHMENT_TYPES.has(type);
}
