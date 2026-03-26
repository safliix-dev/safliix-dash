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

  /**
   * 1. Chargement des options (aligné film)
   */
  const loadMetaOptions = useCallback(() => {
    // même logique que film (tu peux réactiver le guard si besoin)
    // if (!accessToken) return Promise.reject("No access token");
    return seriesApi.metaOptions(accessToken);
  }, [accessToken]);

  const meta = useMetaOptions(loadMetaOptions);

  /**
   * 2. Engine (corrigé + cohérent avec adapter)
   */
  const engine = useMediaFormEngine(
    seriesAdapter,
    {
      title: "",
      description: "",
      productionHouse: "",
      country: "",
      releaseDate: "",
      publishDate: "",
      seasonCount: null,
      category: "",
      genre: "",
      actors: [],
      director: "",
      blockCountries: [],
      rightHolderId: "",
      entertainmentMode: "SERIE",
      isSafliixProd: false,
      haveSubtitles: false,
      subtitleLanguages: [],
      language: "",
      ageRating: "",

      /**
       * ⚠️ TRÈS IMPORTANT : correspondre à collectFiles()
       */
      secondaryImage: null,
      mainImage: null,
      trailerFile: null,
    }
  );

  /**
   * 3. Hydratation ID (identique film)
   */
  useEffect(() => {
    if (initialId && !engine.entityId) {
      engine.setEntityId(initialId);
    }
  }, [initialId, engine.entityId, engine.setEntityId, engine]);

  return {
    ...engine,
    meta,
    accessToken,
  };
}