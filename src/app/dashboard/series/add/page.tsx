// app/series/page.tsx

'use client';

import React, { useEffect, useState } from "react";
import { MediaPage, MetadataComponentProps, FilesComponentProps } from "@/ui/layout/mediaPage";
import { useSeriesForm } from "./useSerieForm";
import { SeriesMetadataStep } from "./SeriesMetadataStep";
import { SeriesFilesStep } from "./SeriesFilesStep";
import { getCountries } from "@/lib/countries";
import type { SeriesFormData, SeriesMetaOptions, SeriesSlot } from "@/types/api/series";
import type { CountryEntry } from "@/lib/countries";

export default function SeriesPage() {
  const {
    setValue,
    meta,
  } = useSeriesForm();

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
      onOpenConfirm={() => {
        // TODO: gérer l'enregistrement en brouillon
        console.log("Enregistrer en brouillon");
      }}
    />
  );

  return (
    <MediaPage<SeriesFormData, SeriesSlot, SeriesMetaOptions>
      useFormHook={useSeriesForm}
      MetadataComponent={SeriesMetadataComponent}
      FilesComponent={SeriesFilesComponent}
      title="Édition de série"
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