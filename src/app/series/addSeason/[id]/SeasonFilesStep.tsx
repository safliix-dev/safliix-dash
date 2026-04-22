// app/series/detail/[id]/seasons/add/components/SeasonFilesStep.tsx

'use client';

import React from "react";
import { useWatch } from "react-hook-form";
import { Control, UseFormSetValue } from "react-hook-form";
import UploadBox from "@/ui/specific/films/components/uploadBox";
import type { SeasonFormData } from "@/types/api/season";
import { DialogStatus } from "@/ui/components/confirmationDialog";
interface SeasonFilesStepProps {
  control: Control<SeasonFormData>;
  setValue: UseFormSetValue<SeasonFormData>;
  onPreview: (url: string) => void;
  dialogStatus: DialogStatus;
}

export function SeasonFilesStep({
  control,
  setValue,
}: SeasonFilesStepProps) {
  const poster = useWatch({ control, name: "poster" });

  return (
    <div className="space-y-6">
      <div>
        <label className="label text-sm mb-1">Affiche (poster)</label>
        <UploadBox
          id="season-poster"
          label={poster ? (poster as File)?.name || "Image de la saison" : "Image de la saison"}
          className="min-h-[220px]"
          onFileSelect={(file) => setValue("poster", file ?? null, { shouldValidate: true })}
        />
      </div>
    </div>
  );
}