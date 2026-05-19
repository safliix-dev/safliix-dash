// app/dashboard/series/[id]/episodes/add/EpisodeFilesStep.tsx

'use client';

import React from "react";
import { useWatch } from "react-hook-form";
import { Control, UseFormSetValue } from "react-hook-form";
import UploadBox from "@/ui/specific/films/components/uploadBox";
import { VideoUpload } from "@/ui/components/form/VideoUpload";
import type { EpisodeFormData } from "@/types/api/episode";
import { DialogStatus } from "@/ui/components/confirmationDialog";

interface EpisodeFilesStepProps {
  control: Control<EpisodeFormData>;
  setValue: UseFormSetValue<EpisodeFormData>;
  onPreview: (url: string) => void;
  dialogStatus: DialogStatus;
  // 👈 Supprimer metaLoading et onOpenConfirm
}

export function EpisodeFilesStep({
  control,
  setValue,
  onPreview,
  
}: EpisodeFilesStepProps) {
  const mainImage = useWatch({ control, name: "mainImage" });
  const movieFile = useWatch({ control, name: "movieFile" });
  const subtitleFile = useWatch({ control, name: "subtitleFile" });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadBox
          id="episode-poster"
          label="Image principale"
          value={mainImage as File | null}
          className="min-h-[220px]"
          onFileSelect={(file) => setValue("mainImage", file ?? null, { shouldValidate: true })}
        />
        <div className="space-y-2">
          <VideoUpload
            id="episode-video"
            label="Fichier vidéo de l'épisode"
            fileLabel="Choisir un fichier vidéo"
            file={movieFile as File | null}
            onSelect={(file) => setValue("movieFile", file ?? null, { shouldValidate: false })}
            onPreview={onPreview}
          />
        </div>
      </div>

      {/* Photos des acteurs */}
      
      {/* Sous-titres */}
      <div className="flex items-end gap-4">
        <div className="w-48">
          <UploadBox
            id="subtitle"
            label="Sous-titre"
            value={subtitleFile as File | null}
            className="min-h-[64px]"
            onFileSelect={(file) => setValue("subtitleFile", file ?? null, { shouldValidate: false })}
          />
        </div>
      </div>
    </div>
  );
}