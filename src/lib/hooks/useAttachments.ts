'use client';

import { useState, useCallback, useEffect } from 'react';
import { attachmentsApi } from '@/lib/api/attachments';
import type { ContentAttachment, ContentApiType } from '@/types/api/attachments';

export function useAttachments(contentType: ContentApiType, contentId: string | null) {
  const [attachments, setAttachments] = useState<ContentAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await attachmentsApi.list(contentType, contentId);
      setAttachments(data);
    } catch {
      setError('Impossible de charger les fichiers.');
    } finally {
      setLoading(false);
    }
  }, [contentType, contentId]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteAttachment = useCallback(
    async (attachmentType: string) => {
      if (!contentId) return;
      await attachmentsApi.delete(contentType, contentId, attachmentType);
      await load();
    },
    [contentType, contentId, load]
  );

  return { attachments, loading, error, refresh: load, deleteAttachment };
}
