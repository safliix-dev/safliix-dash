// app/series/detail/[id]/seasons/add/useSeasonForm.ts

'use client';

import { useEffect } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { useSession } from "next-auth/react";
import { SeasonFormData } from "@/types/api/season";
import { seasonAdapter } from "./seasonAdapter";

interface UseSeasonFormProps {
  seriesId: string;
  seasonId?: string;
}

export function useSeasonForm({ seriesId, seasonId }: UseSeasonFormProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  // 1. Configuration du moteur (Engine)
  const engine = useMediaFormEngine(
    seasonAdapter, 
    {
      numero: 0,
      title: "",
      description: "",
      seriesId,
      poster: null,
    } as SeasonFormData
  );

  // 2. Gestion de l'ID pour l'édition
  useEffect(() => {
    if (seasonId && !engine.entityId) {
      engine.setEntityId(seasonId);
    }
  }, [seasonId, engine.entityId, engine.setEntityId,engine]);

  // 3. Meta options (pas d'API, juste un objet vide)
  const meta = {
    loading: false,
    error: null,
    options: null,
    refresh: async () => {},
  };

  return {
    ...engine,
    meta,
    accessToken,
  };
}