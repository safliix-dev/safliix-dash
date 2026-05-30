// app/dashboard/series/[id]/episodes/add/useEpisodeForm.ts

'use client';

import { useEffect } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { episodeAdapter } from "./episodeAdapter";
import { EpisodeFormData } from "@/types/api/episode";
import { episodeApi } from "@/lib/api/episode";

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

  useEffect(() => {
    if (!episodeId) return;

    engine.setEntityId(episodeId);

    void episodeApi.get(episodeId).then(data => {
      engine.reset({
        title: data.title ?? "",
        description: data.description ?? "",
        duration: data.duration ?? null,
        releaseDate: data.releaseDate ?? "",
        publishDate: data.platformDate ?? "",
        episodeNumber: data.number ?? null,
        seriesId,
        seasonId: data.seasonId ?? seasonId,
        mainImage: null,
        movieFile: null,
        trailerFile: null,
        subtitleFile: null,
      } as EpisodeFormData);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  return {
    ...engine,
    meta,
    seriesId,
    seasonId,
  };
}
