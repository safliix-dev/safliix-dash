// app/dashboard/series/[id]/episodes/add/useEpisodeForm.ts

'use client';

import { useEffect } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { useMetaOptions } from "@/lib/hooks/form/useMetaOptions";
import { episodeApi } from "@/lib/api/episode";
import { episodeAdapter } from "./episodeAdapter";
import { useSession } from "next-auth/react";
import { EpisodeFormData, EpisodeMetaOptions } from "@/types/api/episode";

interface UseEpisodeFormProps {
  seriesId: string;      
  seasonId: string;      
  episodeId?: string;   
}

export function useEpisodeForm({ seriesId, seasonId, episodeId }: UseEpisodeFormProps) {
  const { data: session } = useSession();
  const  = session?.;

  // 1. Chargement des options
  const loadMetaOptions = () => episodeApi.metaOptions(, seriesId, seasonId);
  const meta = useMetaOptions<EpisodeMetaOptions>(loadMetaOptions);

  // 2. Configuration du moteur (Engine)
  const engine = useMediaFormEngine(
    episodeAdapter, 
    {
      title: "",
      description: "",
      isCustomProduction: true,
      status: "DRAFT",
      duration: null as number | null,  // 👈 Type explicite
      releaseDate: "",
      publishDate: "",
      director: "",
      episodeNumber: null as number | null,  // 👈 Type explicite
      actors: [] as Array<{ actorId?: string; name: string }>,  // 👈 Type explicite
      seriesId,
      seasonId,
      mainImage: null,
      movieFile: null,
      trailerFile: null,
      subtitleFile: null,
    } as EpisodeFormData  // 👈 Cast explicite
  );

  // 3. Gestion de l'ID (Si on est en mode édition)
  useEffect(() => {
    if (episodeId && !engine.entityId) {
      engine.setEntityId(episodeId);
    }
  }, [episodeId, engine.entityId, engine.setEntityId,engine]);

  return {
    ...engine,
    meta,
    ,
    seriesId,
    seasonId,
  };
}