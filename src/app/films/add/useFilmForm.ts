    'use client';
    import { useEffect,useCallback } from "react";
    import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
    import { useMetaOptions } from "@/lib/hooks/form/useMetaOptions";
    import { filmsApi } from "@/lib/api/films";
    import { filmAdapter } from "./filmAdapter";
    import { type FilmFormData } from "@/types/api/films";
    import { useSession } from "next-auth/react";

    export function useFilmForm(initialId?: string) {
      const { data: session } = useSession();
      const accessToken = session?.accessToken;

      // 1. Chargement des options (Selects)
      // On passe l'accessToken pour que l'API puisse valider la requête
      const loadMetaOptions = useCallback(() => {
        //if (!accessToken) return Promise.reject("No access token");
        return filmsApi.metaOptions(accessToken);
      }, [accessToken]);

      const meta = useMetaOptions(loadMetaOptions);

      // 2. Configuration du moteur (Engine)
      const defaultValues: FilmFormData = {
        title: "",
        productionHouse: "",
        country: "",
        type: "location",
        price: null,
        releaseDate: "",
        publishDate: "",
        format: "COURT-METRAGE",
        category: "",
        genre: "",
        actors: [],
        director: "",
        duration: null,
        blockCountries: [],
        rightHolderId: "",
        entertainmentMode: "Film",
        description: "",
        isSafliixProd: false,
        haveSubtitles: false,
        language: "",
        ageRating: "",
        subtitleLanguages: [],
        movieFile: null,
        trailerFile: null,
        mainImage: null,
        secondaryImage: null,
      };

      const engine = useMediaFormEngine(
        filmAdapter,
        defaultValues
      );

      // 3. Gestion de l'ID (Si on est en mode édition, on hydrate l'entityId)
      // Cela permet à confirmSubmit de savoir s'il doit créer ou mettre à jour
      
      useEffect(() => {
        if (initialId && !engine.entityId) {
          engine.setEntityId(initialId);
        }
      }, [initialId, engine.entityId, engine.setEntityId,engine]);


      return {
        ...engine,
        meta,
        accessToken, // Utile si tu as besoin du token ailleurs dans l'UI
      };
    }