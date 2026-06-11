'use client';

import { useEffect, useCallback } from "react";
import { useMediaFormEngine } from "@/lib/hooks/form/useMediaFormEngine";
import { useMetaOptions } from "@/lib/hooks/form/useMetaOptions";
import { seriesApi } from "@/lib/api/series";
import { seriesAdapter } from "./serieAdapter";
import { type SeriesFormData, type SeriesDetail } from "@/types/api/series";

function normalizeActors(
  actors: SeriesDetail["actors"]
): Array<{ actorId?: string; name: string }> {
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

function mapSeriesDetailToFormData(detail: SeriesDetail): SeriesFormData {
  return {
    title: detail.title ?? "",
    description: detail.description ?? detail.synopsis ?? "",
    language: detail.mainLanguage ?? "",
    productionHouse: detail.productionHouse ?? "",
    country: detail.productionCountry ?? "",
    blockCountries: detail.blockedCountries ?? [],
    releaseDate: detail.releaseDate ? detail.releaseDate.split("T")[0] : "",
    publishDate: (detail.plateformDate ?? detail.publishDate)
      ? (detail.plateformDate ?? detail.publishDate)!.split("T")[0]
      : "",
    category: detail.category ?? "",
    seasonCount: detail.seasonCount ?? null,
    genre: detail.gender ?? "",
    actors: normalizeActors(detail.actors),
    director: detail.director ?? "",
    ageRating: detail.ageRating ?? "",
    isSafliixProd: detail.isSafliixProd ?? false,
    haveSubtitles: detail.haveSubtitles ?? false,
    subtitleLanguages: detail.subtitleLanguages ?? [],
    rightHolderId: detail.rightHolderId ?? "",
    entertainmentMode: detail.entertainmentMode ?? "SERIE",
    mainImage: null,
    secondaryImage: null,
    trailerFile: null,
  };
}

export function useSeriesForm(initialId?: string) {
  const loadMetaOptions = useCallback(() => seriesApi.metaOptions(), []);
  const meta = useMetaOptions(loadMetaOptions);

  const defaultValues: SeriesFormData = {
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
    secondaryImage: null,
    mainImage: null,
    trailerFile: null,
  };

  const engine = useMediaFormEngine(seriesAdapter, defaultValues);

  useEffect(() => {
    if (!initialId) return;
    engine.setEntityId(initialId);
    seriesApi
      .detail(initialId)
      .then((detail) => {
        engine.reset(mapSeriesDetailToFormData(detail));
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  return { ...engine, meta };
}
