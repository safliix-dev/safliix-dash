// app/series/hooks/useSeriesDetail.ts
'use client';

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { formatApiError } from "@/lib/api/errors";
import { seriesApi } from "@/lib/api/series";
import { episodeApi } from "@/lib/api/episode";
import { seasonsApi } from "@/lib/api/season";
import type { SeriesDetail } from "@/types/api/series";
import type { SeasonSummary as Season,SeasonFormData } from "@/types/api/season";
import type { EpisodeDetail as Episode, EpisodeMetadataPayload } from "@/types/api/episode";

interface UseSeriesDetailReturn {
  detail: SeriesDetail | null;
  loading: boolean;
  seasons: Season[];
  episodesBySeason: Record<string, Episode[]>;
  expandedSeasons: Set<string>;
  toggleSeason: (seasonId: string) => Promise<void>;
  refresh: () => Promise<void>;
  addSeason: (data: SeasonFormData) => Promise<void>;
  addEpisode: (data: EpisodeMetadataPayload) => Promise<void>;
  updateStatus: (action: "publish" | "archive" | "restore") => Promise<void>;
}

export function useSeriesDetail(seriesId: string): UseSeriesDetailReturn {
  const [detail, setDetail] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<string, Episode[]>>({});
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());

  const toast = useToast();

  // Chargement des détails de la série
  const loadSeriesDetail = useCallback(async () => {
    if (!seriesId) return;
    
    setLoading(true);
    try {
      const data = await seriesApi.detail(seriesId, );
      setDetail(data);
      
      // Initialiser les saisons expansées (toutes par défaut)
      if (data.seasons) {
        const seasonIds = data.seasons.map(s => s.id);
        setExpandedSeasons(new Set(seasonIds));
      }
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Erreur", description: friendly.message });
    } finally {
      setLoading(false);
    }
  }, [seriesId, , toast]);

  // Chargement des épisodes d'une saison
  const loadEpisodes = useCallback(async (seasonId: string) => {
    if (!seriesId || !seasonId) return;
    
    try {
      const episodes = await episodeApi.list(seriesId, seasonId, undefined, );
      const normalized = Array.isArray(episodes) ? episodes : [];
      setEpisodesBySeason(prev => ({ ...prev, [seasonId]: normalized }));
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Episodes", description: friendly.message });
      setEpisodesBySeason(prev => ({ ...prev, [seasonId]: [] }));
    }
  }, [seriesId, , toast]);

  // Expansion/repliement d'une saison
  const toggleSeason = useCallback(async (seasonId: string) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });

    // Charger les épisodes si ce n'est pas déjà fait
    if (!episodesBySeason[seasonId]) {
      await loadEpisodes(seasonId);
    }
  }, [episodesBySeason, loadEpisodes]);

  // Rafraîchir toute la page
  const refresh = useCallback(async () => {
    await loadSeriesDetail();
    // Réinitialiser les épisodes chargés pour forcer un rechargement
    setEpisodesBySeason({});
  }, [loadSeriesDetail]);

  // Ajouter une saison
  const addSeason = useCallback(async (seasonMetaPyload: SeasonFormData) => {
    try {
      await seasonsApi.create( seasonMetaPyload, );
      toast.success({ title: "Succès", description: "Saison ajoutée avec succès" });
      await refresh();
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Erreur", description: friendly.message });
      throw error;
    }
  }, [ , toast, refresh]);

  // Ajouter un épisode
  const addEpisode = useCallback(async (episodeFormData:EpisodeMetadataPayload) => {
    try {
      await episodeApi.create(episodeFormData, );
      toast.success({ title: "Succès", description: "Épisode ajouté avec succès" });
      // Recharger les épisodes de la saison concernée
      await loadEpisodes(episodeFormData.seasonId);
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Erreur", description: friendly.message });
      throw error;
    }
  }, [, toast, loadEpisodes]);

  // Mettre à jour le statut de la série
  const updateStatus = useCallback(async (action: "publish" | "archive" | "restore") => {
    try {
      const response = await fetch(`/api/content/serie/${seriesId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }

      toast.success({ title: "Succès", description: "Statut mis à jour avec succès" });
      await refresh();
    } catch (error) {
      const friendly = formatApiError(error);
      toast.error({ title: "Erreur", description: friendly.message });
      throw error;
    }
  }, [seriesId, , toast, refresh]);

  // Chargement initial
  useEffect(() => {
    loadSeriesDetail();
  }, [loadSeriesDetail]);

  return {
    detail,
    loading,
    seasons: detail?.seasons || [],
    episodesBySeason,
    expandedSeasons,
    toggleSeason,
    refresh,
    addSeason,
    addEpisode,
    updateStatus,
  };
}