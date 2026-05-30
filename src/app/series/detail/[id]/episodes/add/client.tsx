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
  episodeId?: string;
}

export function EpisodeFormClient({ seriesId, seasonId, episodeId }: EpisodeFormClientProps) {
  const formHook = useEpisodeForm({ seriesId, seasonId, episodeId });

  return (
    <MediaPage<EpisodeFormData, EpisodeSlot>
      useFormHook={() => formHook}
      MetadataComponent={({ control, errors }) => (
        <EpisodeMetadataStep
          control={control}
          errors={errors}
        />
      )}
      FilesComponent={({ control, setValue, onPreview, dialogStatus }) => (
        <EpisodeFilesStep
          control={control}
          setValue={setValue}
          onPreview={onPreview}
          dialogStatus={dialogStatus}
        />
      )}
      title={episodeId ? "Modifier l'épisode" : "Ajouter un épisode"}
      metaFields={[
        "title", "episodeNumber", "releaseDate", "publishDate", "duration", "description"
      ]}
      sidebar={{
        showDefaultLogo: true,
        defaultLogoUrl: "/ICONE_SFLIX.png",
        defaultLogoAlt: "SaFlix"
      }}
    />
  );
}
