// app/series/components/SeriesFilesStep.tsx

'use client';

import React from "react";
import { useWatch } from "react-hook-form";
import { Control, UseFormSetValue } from "react-hook-form";
import UploadBox from "@/ui/specific/films/components/uploadBox";
import { VideoUpload } from "@/ui/components/form/VideoUpload";
import type { SeriesFormData } from "@/types/api/series";

interface SeriesFilesStepProps {
  control: Control<SeriesFormData>;
  setValue: UseFormSetValue<SeriesFormData>;
  onPreview: (url: string) => void;
  dialogStatus: 'idle' | 'loading' | 'success' | 'error';
  metaLoading: boolean;
  onOpenConfirm: () => void;
}

export function SeriesFilesStep({
  control,
  setValue,
  onPreview,
  dialogStatus,
  metaLoading,
  onOpenConfirm
}: SeriesFilesStepProps) {
  const trailerFile = useWatch({ control, name: "trailerFile" }) as File | null;

  return (
    <>
      <div className="grid grid-cols-6 grid-rows-2 gap-4">
        <UploadBox
          id="main"
          label="Image principale"
          className="row-span-2 col-span-3 min-h-[220px]"
          onFileSelect={(file) => setValue("mainImage", file ?? null, { shouldValidate: true })}
        />
        <UploadBox
          id="sec"
          label="Image secondaire"
          className="col-span-3 min-h-[100px]"
          onFileSelect={(file) => setValue("secondaryImage", file ?? null, { shouldValidate: false })}
        />
        <VideoUpload
          id="trailer-file"
          label="Bande annonce"
          fileLabel="Choisir une bande annonce"
          file={trailerFile}
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