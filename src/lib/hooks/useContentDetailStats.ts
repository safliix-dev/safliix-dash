'use client';

import { useState, useEffect, useCallback } from 'react';
import { contentStatsApi } from '@/lib/api/contentStats';
import type { ContentDetailStats } from '@/types/api/contentStats';
import type { ContentApiType } from '@/types/api/attachments';

export function useContentDetailStats(contentType: ContentApiType, id: string | null) {
  const [stats, setStats] = useState<ContentDetailStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await contentStatsApi.detail(contentType, id);
      setStats(data);
    } catch {
      setError('Stats indisponibles.');
    } finally {
      setLoading(false);
    }
  }, [contentType, id]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, error };
}
