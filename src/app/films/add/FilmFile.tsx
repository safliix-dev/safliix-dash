// app/films/components/FilmFilesStep.tsx

'use client';

import React from "react";
import { useWatch } from "react-hook-form";
import { Control, UseFormSetValue } from "react-hook-form";
import UploadBox from "@/ui/specific/films/components/uploadBox";
import { VideoUpload } from "@/ui/components/form/VideoUpload";
import type { FilmFormData } from "@/types/api/films";
import { DialogStatus } from "@/ui/components/confirmationDialog";
interface FilmFilesStepProps {
  control: Control<FilmFormData>;
  setValue: UseFormSetValue<FilmFormData>;
  onPreview: (url: string) => void;
  dialogStatus: DialogStatus;
  metaLoading: boolean;
  onOpenConfirm: () => void;
}

export function FilmFilesStep({
  control,
  setValue,
  onPreview,
  dialogStatus,
  metaLoading,
  onOpenConfirm
}: FilmFilesStepProps) {
  const mainImage = useWatch({ control, name: "mainImage" });
  const secondaryImage = useWatch({ control, name: "secondaryImage" });
  const movieFile = useWatch({ control, name: "movieFile" });
  const trailerFile = useWatch({ control, name: "trailerFile" });
  const typeValue = useWatch({ control, name: "type" });

  return (
    <>
      <div className="grid grid-cols-6 grid-rows-2 gap-4">
        <UploadBox
          id="main"
          label="Image principale"
          value={mainImage as File | null}
          className="row-span-2 col-span-3 min-h-[220px]"
          onFileSelect={(file) => setValue("mainImage", file ?? null, { shouldValidate: true })}
        />
        <UploadBox
          id="sec"
          label="Image secondaire"
          value={secondaryImage as File | null}
          className="col-span-3 min-h-[100px]"
          onFileSelect={(file) => setValue("secondaryImage", file ?? null, { shouldValidate: false })}
        />
        <VideoUpload
          id="film-file"
          label={typeValue?.toLowerCase() === "abonnement" ? "Vidéo (optionnel)" : "Vidéo du film"}
          fileLabel="Choisir une vidéo"
          file={movieFile as File | null}
          onSelect={(file?: File | null) => setValue("movieFile", file ?? null, { shouldValidate: false })}
          onPreview={onPreview}
        />
        <VideoUpload
          id="trailer-file"
          label="Bande annonce"
          fileLabel="Choisir une bande annonce"
          file={trailerFile as File | null}
          onSelect={(file?: File | null) => setValue("trailerFile", file ?? null, { shouldValidate: false })}
          onPreview={onPreview}
        />
      </div>

      <div className="flex items-center gap-3 pt-2 justify-end">
        <button
          type="button"
          className="btn btn-outline btn-ghost text-white"
          onClick={onOpenConfirm}
          disabled={metaLoading || dialogStatus === 'loading'}
        >
          Enregistrer en brouillon
        </button>
      </div>
    </>
  );
}