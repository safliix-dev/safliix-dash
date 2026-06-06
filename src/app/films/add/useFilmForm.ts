'use client';
import { useEffect, useCallback } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { useMetaOptions } from "@/lib/hooks/form/useMetaOptions";
import { filmsApi } from "@/lib/api/films";
import { filmAdapter } from "./filmAdapter";
import { type FilmFormData, type FilmDetail, type FilmActor } from "@/types/api/films";

function normalizeActors(actors: FilmDetail["actors"]): FilmActor[] {
  if (!actors) return [];
  if (typeof actors === "string") {
    try {
      const parsed = JSON.parse(actors);
      if (Array.isArray(parsed)) return normalizeActors(parsed);
    } catch {}
    return actors.split(",").map((a) => ({ name: a.trim() })).filter((a) => a.name);
  }
  if (Array.isArray(actors)) {
    return actors.map((a) =>
      typeof a === "string" ? { name: a } : { actorId: a.actorId, name: a.name }
    );
  }
  return [];
}

function mapFilmDetailToFormData(detail: FilmDetail): FilmFormData {
  return {
    title: detail.title ?? "",
    description: detail.description ?? detail.synopsis ?? "",
    language: detail.mainLanguage ?? detail.language ?? "",
    productionHouse: detail.productionHouse ?? "",
    country: detail.productionCountry ?? detail.country ?? "",
    blockCountries: detail.blockCountries ?? [],
    type: detail.type ?? "location",
    price: detail.rentalPrice ?? detail.price ?? null,
    releaseDate: detail.releaseDate ? detail.releaseDate.split("T")[0] : "",
    publishDate: (detail.plateformDate ?? detail.publishDate)
      ? (detail.plateformDate ?? detail.publishDate)!.split("T")[0]
      : "",
    format: detail.format ?? "COURT-METRAGE",
    category: detail.category ?? "",
    genre: detail.gender ?? detail.genre ?? "",
    actors: normalizeActors(detail.actors),
    director: detail.director ?? "",
    duration:
      typeof detail.duration === "number"
        ? detail.duration
        : detail.duration
        ? Number(detail.duration) || null
        : null,
    ageRating: detail.ageRating ?? "",
    isSafliixProd: detail.isSafliixProd ?? false,
    haveSubtitles: detail.haveSubtitles ?? false,
    subtitleLanguages: detail.subtitleLanguages ?? [],
    rightHolderId: detail.rightHolderId ?? "",
    entertainmentMode: detail.entertainmentMode ?? "Film",
    mainImage: null,
    secondaryImage: null,
    trailerFile: null,
    movieFile: null,
  };
}

export function useFilmForm(initialId?: string) {
  const loadMetaOptions = useCallback(() => filmsApi.metaOptions(), []);
  const meta = useMetaOptions(loadMetaOptions);

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

  const engine = useMediaFormEngine(filmAdapter, defaultValues);

  useEffect(() => {
    if (!initialId) return;
    engine.setEntityId(initialId);
    filmsApi
      .detail(initialId)
      .then((detail) => {
        engine.reset(mapFilmDetailToFormData(detail));
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  return { ...engine, meta };
}
