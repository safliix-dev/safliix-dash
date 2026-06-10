// app/films/add/page.tsx

'use client';

import React, { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { MediaPage, MetadataComponentProps, FilesComponentProps } from "@/ui/layout/mediaPage";
import { useFilmForm } from "./useFilmForm";
import { FilmMetadataStep } from "./FilmMetaOption";
import { FilmFilesStep } from "./FilmFile";
import { getCountries } from "@/lib/countries";
import type { FilmFormData, FilmMetaOptions, FilmSlot } from "@/types/api/films";
import type { CountryEntry } from "@/lib/countries";

export default function FilmPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") ?? undefined;

  const {
    control,
    setValue,
    meta,
  } = useFilmForm(editId);

  const [countries, setCountries] = useState<CountryEntry[]>([]);
  const typeValue = useWatch({ control, name: "type" });

  useEffect(() => {
    setCountries(getCountries("fr"));
  }, []);

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
      onOpenConfirm={() => {}}
      editId={editId}
    />
  );

  return (
    <MediaPage<FilmFormData, FilmSlot, FilmMetaOptions>
      useFormHook={useFilmForm}
      initialId={editId}
      backHref="/films"
      MetadataComponent={FilmMetadataComponent}
      FilesComponent={FilmFilesComponent}
      title={editId ? "Modifier le film" : "Ajouter un film"}
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