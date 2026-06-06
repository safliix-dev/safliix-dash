// app/series/add/page.tsx

'use client';

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediaPage, MetadataComponentProps, FilesComponentProps } from "@/ui/layout/mediaPage";
import { useSeriesForm } from "./useSerieForm";
import { SeriesMetadataStep } from "./SeriesMetadataStep";
import { SeriesFilesStep } from "./SeriesFilesStep";
import { getCountries } from "@/lib/countries";
import type { SeriesFormData, SeriesMetaOptions, SeriesSlot } from "@/types/api/series";
import type { CountryEntry } from "@/lib/countries";

export default function SeriesPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") ?? undefined;

  const {
    setValue,
    meta,
  } = useSeriesForm(editId);

  const [countries, setCountries] = useState<CountryEntry[]>([]);

  useEffect(() => {
    setCountries(getCountries("fr"));
  }, []);

  const SeriesMetadataComponent = ({
    control,
    errors,
    meta
  }: MetadataComponentProps<SeriesFormData, SeriesMetaOptions>) => (
    <SeriesMetadataStep
      control={control}
      errors={errors}
      meta={meta}
      countries={countries}
      setValue={setValue}
    />
  );

  const SeriesFilesComponent = ({
    control,
    setValue,
    onPreview,
    dialogStatus
  }: FilesComponentProps<SeriesFormData>) => (
    <SeriesFilesStep
      control={control}
      setValue={setValue}
      onPreview={onPreview}
      dialogStatus={dialogStatus}
      metaLoading={meta.loading}
      onOpenConfirm={() => {}}
      editId={editId}
    />
  );

  return (
    <MediaPage<SeriesFormData, SeriesSlot, SeriesMetaOptions>
      useFormHook={useSeriesForm}
      initialId={editId}
      MetadataComponent={SeriesMetadataComponent}
      FilesComponent={SeriesFilesComponent}
      title={editId ? "Modifier la série" : "Ajouter une série"}
      metaFields={[
        "title", "productionHouse", "country", "releaseDate",
        "publishDate", "category", "genre", "actors",
        "director", "description", "language", "seasonCount"
      ]}
      sidebar={{
        showDefaultLogo: true,
        defaultLogoUrl: "/ICONE_SFLIX.png",
        defaultLogoAlt: "SaFlix"
      }}
    />
  );
}