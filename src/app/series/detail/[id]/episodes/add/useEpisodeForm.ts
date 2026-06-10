// app/dashboard/series/[id]/episodes/add/useEpisodeForm.ts

'use client';

import { useEffect, useState } from "react";
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
  const [loadingNumber, setLoadingNumber] = useState(true);

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

  const { setValue, reset, setEntityId } = engine;

  useEffect(() => {
    if (!episodeId) return;

    setEntityId(episodeId);

    setLoadingNumber(true);
    void episodeApi.get(episodeId).then(data => {
      reset({
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
    }).catch(() => {}).finally(() => setLoadingNumber(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  useEffect(() => {
    if (episodeId) return;
    setLoadingNumber(true);
    episodeApi.list(seriesId, seasonId, { pageSize: 1 }).then(res => {
      setValue("episodeNumber", res.pageInfo.totalItems + 1);
    }).catch(() => {}).finally(() => setLoadingNumber(false));
  }, [seriesId, seasonId, episodeId, setValue]);

  return {
    ...engine,
    meta,
    seriesId,
    seasonId,
    loadingNumber,
  };
}
