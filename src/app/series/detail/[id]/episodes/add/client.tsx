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
  const formHook = useEpisodeForm({ seriesId, seasonId });

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
      title="Ajouter un épisode"
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
