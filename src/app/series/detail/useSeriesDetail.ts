// app/series/hooks/useSeriesDetail.ts
'use client';

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { formatApiError } from "@/lib/api/errors";
import { seriesApi } from "@/lib/api/series";
import { seasonsApi } from "@/lib/api/season";
import type { SeriesDetail } from "@/types/api/series";
import type { SeasonSummary as Season, SeasonFormData } from "@/types/api/season";

interface UseSeriesDetailReturn {
  detail: SeriesDetail | null;
  loading: boolean;
  seasons: Season[];
  refresh: () => Promise<void>;
  addSeason: (data: SeasonFormData) => Promise<void>;
  updateStatus: (action: "publish" | "archive" | "restore") => Promise<void>;
}

export function useSeriesDetail(seriesId: string): UseSeriesDetailReturn {
  const [detail, setDetail] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const loadSeriesDetail = useCallback(async () => {
    if (!seriesId) return;
    setLoading(true);
    try {
      const data = await seriesApi.detail(seriesId, );
      setDetail(data);
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Erreur", description: friendly.message });
    } finally {
      setLoading(false);
    }
  }, [seriesId, toast]);

  const refresh = useCallback(async () => {
    await loadSeriesDetail();
  }, [loadSeriesDetail]);

  const addSeason = useCallback(async (seasonMetaPayload: SeasonFormData) => {
    try {
      await seasonsApi.create({ ...seasonMetaPayload, serieId: detail?.id || "" }, detail?.id || "");
      toast.success({ title: "Succès", description: "Saison ajoutée avec succès" });
      await refresh();
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Erreur", description: friendly.message });
      throw error;
    }
  }, [detail?.id, toast, refresh]);

  const updateStatus = useCallback(async (action: "publish" | "archive" | "restore") => {
    try {
      const response = await fetch(`/api/content/serie/${seriesId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut");
      toast.success({ title: "Succès", description: "Statut mis à jour avec succès" });
      await refresh();
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Erreur", description: friendly.message });
      throw error;
    }
  }, [seriesId, toast, refresh]);

  useEffect(() => {
    loadSeriesDetail();
  }, [loadSeriesDetail]);

  return {
    detail,
    loading,
    seasons: detail?.seasons || [],
    refresh,
    addSeason,
    updateStatus,
  };
}
