// app/dashboard/series/[id]/episodes/add/useEpisodeForm.ts

'use client';

import { useEffect } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { episodeAdapter } from "./episodeAdapter";
import { EpisodeFormData } from "@/types/api/episode";

interface UseEpisodeFormProps {
  seriesId: string;
  seasonId: string;
  episodeId?: string;
}

export function useEpisodeForm({ seriesId, seasonId, episodeId }: UseEpisodeFormProps) {

  const meta = { options: null, loading: false, error: null, refresh: async () => {} };

  const engine = useMediaFormEngine(
    episodeAdapter,
    {
      title: "",
      description: "",
      duration: null as number | null,
      releaseDate: "",
      publishDate: "",
      episodeNumber: null as number | null,
      seriesId,
      seasonId,
      mainImage: null,
      movieFile: null,
      trailerFile: null,
      subtitleFile: null,
    } as EpisodeFormData
  );

  // Gestion de l'ID en mode édition
  useEffect(() => {
    if (episodeId && !engine.entityId) {
      engine.setEntityId(episodeId);
    }
  }, [episodeId, engine.entityId, engine.setEntityId]);

  return {
    ...engine,
    meta,
    seriesId,
    seasonId,
  };
}