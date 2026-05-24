import { useState, useCallback, useRef, useEffect } from 'react';
import { apiRequest } from '@/lib/api/client';
import type { PlaybackAttachmentType, PlaybackResponse } from '@/types/api/playback';

const RENEW_INTERVAL_MS = 15 * 60 * 1000;

export function usePlayback() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renewRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopRenew = useCallback(() => {
    if (renewRef.current !== null) {
      clearInterval(renewRef.current);
      renewRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    stopRenew();
  }, [stopRenew]);

  const load = useCallback(async (
    contentId: string,
    type: 'film' | 'serie' | 'episode',
    attachmentType: PlaybackAttachmentType = 'MAIN'
  ) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<PlaybackResponse>(
        `/admin/contents/${contentId}/playback`,
        { params: { type, attachmentType }, signal: abort.signal }
      );
      const mediaUrl = data.media[0]?.url;
      if (!mediaUrl) throw new Error('Aucun média disponible');
      setUrl(mediaUrl);
      stopRenew();
      renewRef.current = setInterval(() => {
        apiRequest(`/admin/contents/${contentId}/playback`, { params: { type, attachmentType } }).catch(() => {});
      }, RENEW_INTERVAL_MS);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Erreur playback');
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  }, [stopRenew]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopRenew();
    setUrl(null);
    setError(null);
    setLoading(false);
  }, [stopRenew]);

  return { url, loading, error, load, reset };
}
