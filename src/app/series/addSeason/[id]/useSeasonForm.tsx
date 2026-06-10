// app/series/detail/[id]/seasons/add/useSeasonForm.ts

'use client';

import { useEffect, useState } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { SeasonFormData } from "@/types/api/season";
import { seasonAdapter } from "./seasonAdapter";
import { seriesApi } from "@/lib/api/series";
import { seasonsApi } from "@/lib/api/season";

interface UseSeasonFormProps {
  seriesId: string;
  seasonId?: string;
}

export function useSeasonForm({ seriesId, seasonId }: UseSeasonFormProps) {
  const [loadingNumber, setLoadingNumber] = useState(true);

  const engine = useMediaFormEngine(
    seasonAdapter,
    {
      numero: 0,
      title: "",
      description: "",
      seriesId,
      addPoster: false,
      poster: null,
    } as SeasonFormData
  );

  const { setValue } = engine;

  useEffect(() => {
    if (seasonId && !engine.entityId) {
      engine.setEntityId(seasonId);
    }
  }, [seasonId, engine.entityId, engine.setEntityId]);

  useEffect(() => {
    setLoadingNumber(true);
    if (seasonId) {
      seasonsApi.get(seasonId).then(season => {
        setValue("numero", season.numero ?? 0);
      }).catch(() => {}).finally(() => setLoadingNumber(false));
    } else {
      seriesApi.detail(seriesId).then(detail => {
        const next = (detail.seasons?.length ?? 0) + 1;
        setValue("numero", next);
      }).catch(() => {}).finally(() => setLoadingNumber(false));
    }
  }, [seriesId, seasonId, setValue]);

  const meta = {
    loading: false,
    error: null,
    options: null,
    refresh: async () => {},
  };

  return {
    ...engine,
    meta,
    loadingNumber,
  };
}