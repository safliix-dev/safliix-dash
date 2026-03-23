// app/dashboard/series/[id]/episodes/add/EpisodeFilesStep.tsx

'use client';

import React from "react";
import { useWatch } from "react-hook-form";
import { Control, UseFormSetValue } from "react-hook-form";
import UploadBox from "@/ui/specific/films/components/uploadBox";
import { VideoUpload } from "@/ui/components/form/VideoUpload";
import type { EpisodeFormData } from "@/types/api/episode";

interface EpisodeFilesStepProps {
  control: Control<EpisodeFormData>;
  setValue: UseFormSetValue<EpisodeFormData>;
  onPreview: (url: string) => void;
  dialogStatus: 'idle' | 'loading' | 'success' | 'error';
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
          label={mainImage ? (mainImage as File)?.name || "Image principale" : "Image principale"}
          className="min-h-[220px]"
          onFileSelect={(file) => setValue("mainImage", file ?? null, { shouldValidate: true })}
        />
        <div className="space-y-2">
          <VideoUpload
            label="Fichier vidéo de l'épisode"
            file={movieFile as File | null}
            onSelect={(file) => setValue("movieFile", file ?? null, { shouldValidate: false })}
            onPreview={onPreview} id={""} fileLabel={""}          />
        </div>
      </div>

      {/* Photos des acteurs */}
      
      {/* Sous-titres */}
      <div className="flex items-end gap-4">
        <div className="w-48">
          <UploadBox
            id="subtitle"
            label={subtitleFile ? (subtitleFile as File)?.name || "Sous-titre" : "Sous-titre"}
            className="min-h-[64px]"
            onFileSelect={(file) => setValue("subtitleFile", file ?? null, { shouldValidate: false })}
          />
        </div>
      </div>
    </div>
  );
}