'use client';

import { useEffect, useCallback } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { useMetaOptions } from "@/lib/hooks/form/useMetaOptions";
import { seriesApi } from "@/lib/api/series";
import { seriesAdapter } from "./serieAdapter";
import { useSession } from "next-auth/react";

export function useSeriesForm(initialId?: string) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  // 1. Chargement des options de métadonnées (catégories, genres, etc.)
  const loadMetaOptions = useCallback(() => {
    return seriesApi.metaOptions(accessToken);
  }, [accessToken]);

  const meta = useMetaOptions(loadMetaOptions);

  // 2. Initialisation du moteur avec l'adapter et les valeurs par défaut
  const engine = useMediaFormEngine(
    seriesAdapter,
    {
      title: "",
      description: "",
      language: "",
      productionHouse: "",
      country: "",
      blockCountries: [],
      releaseDate: "",
      publishDate: "",
      category: "",
      seasonCount: null,
      genre: "",
      actors: [],
      director: "",
      ageRating: "",
      isSafliixProd: true,
      haveSubtitles: false,
      subtitleLanguages: [],
      rightHolderId: "",
      mainImage: null,
      secondaryImage: null,
      trailerFile: null,
    }
  );

  // 3. Hydratation de l'ID pour le mode édition
  useEffect(() => {
    if (initialId && !engine.entityId) {
      engine.setEntityId(initialId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId, engine.entityId, engine.setEntityId]);

  return {
    ...engine,
    meta,
    accessToken,
  };
}