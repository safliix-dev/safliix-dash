// app/films/page.tsx

'use client';

import React, { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { MediaPage, MetadataComponentProps, FilesComponentProps } from "@/ui/layout/mediaPage";
import { useFilmForm } from "./useFilmForm";
import { FilmMetadataStep } from "./FilmMetaOption";
import { FilmFilesStep } from "./FilmFile";
import { getCountries } from "@/lib/countries";
import type { FilmFormData, FilmMetaOptions, FilmSlot } from "@/types/api/films";
import type { CountryEntry } from "@/lib/countries";

export default function FilmPage() {
  const {
    control,
    setValue,
    meta,
  } = useFilmForm();

  const [countries, setCountries] = useState<CountryEntry[]>([]);
  const typeValue = useWatch({ control, name: "type" });

  useEffect(() => {
    setCountries(getCountries("fr"));
  }, []);

  // Composant Metadata typé correctement
  const FilmMetadataComponent = ({ 
    control, 
    errors, 
    meta 
  }: MetadataComponentProps<FilmFormData, FilmMetaOptions>) => (
    <FilmMetadataStep
      control={control}
      errors={errors}
      meta={meta}
      countries={countries}
      typeValue={typeValue}
      setValue={setValue}
    />
  );

  // Composant Files typé correctement
  const FilmFilesComponent = ({ 
    control, 
    setValue, 
    onPreview, 
    dialogStatus 
  }: FilesComponentProps<FilmFormData>) => (
    <FilmFilesStep
      control={control}
      setValue={setValue}
      onPreview={onPreview}
      dialogStatus={dialogStatus}
      metaLoading={meta.loading}
      onOpenConfirm={() => {
        // TODO: gérer l'enregistrement en brouillon
      }}
    />
  );

  return (
    <MediaPage<FilmFormData, FilmSlot, FilmMetaOptions>
      useFormHook={useFilmForm} 
       MetadataComponent={FilmMetadataComponent}
      FilesComponent={FilmFilesComponent}
      title="Édition de film"
      metaFields={[
        "title", "productionHouse", "country", "type", "releaseDate", 
        "publishDate", "format", "category", "genre", "actors", 
        "director", "duration", "description", "language"
      ]}
      sidebar={{
        showDefaultLogo: true,
        defaultLogoUrl: "/ICONE_SFLIX.png",
        defaultLogoAlt: "SaFlix"
      }}
    />
  );
}