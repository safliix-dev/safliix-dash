// app/series/[id]/episodes/add/client.tsx

'use client';

import React from "react";
import { MediaPage } from "@/ui/layout/mediaPage";
import { useEpisodeForm } from "./useEpisodeForm";
import { EpisodeMetadataStep } from "./EpisodeMetadataStep";
import { EpisodeFilesStep } from "./EpisodeFilesStep";
import type { EpisodeFormData, EpisodeSlot } from "@/types/api/episode";

interface EpisodeFormClientProps {
  seriesId: string;
  seasonId: string;
}

export function EpisodeFormClient({ seriesId, seasonId }: EpisodeFormClientProps) {
  // 👈 Récupérer le hook
  const formHook = useEpisodeForm({ seriesId, seasonId });

  return (
    <MediaPage<EpisodeFormData, EpisodeSlot>
      useFormHook={() => formHook}
      MetadataComponent={({ control, errors }) => (
        <EpisodeMetadataStep
          control={control}
          errors={errors}
          setValue={formHook.setValue}
        />
      )}
      FilesComponent={({ control, setValue, onPreview, dialogStatus }) => (
        <EpisodeFilesStep
          control={control}
          setValue={setValue}
          onPreview={onPreview}
          dialogStatus={dialogStatus}
          // 👈 Supprimer metaLoading et onOpenConfirm
        />
      )}
      title="Ajouter un épisode"
      metaFields={[
        "title", "episodeNumber", "releaseDate", "publishDate",
        "director", "duration", "description", "status"
      ]}
      sidebar={{
        showDefaultLogo: true,
        defaultLogoUrl: "/ICONE_SFLIX.png",
        defaultLogoAlt: "SaFlix"
      }}
    />
  );
}