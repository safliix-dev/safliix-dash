// app/series/detail/[id]/seasons/add/client.tsx

'use client';

import React from "react";
import { MediaPage } from "@/ui/layout/mediaPage";
import { useSeasonForm } from "./useSeasonForm";
import { SeasonMetadataStep } from "./SeasonMetadataStep";
import { SeasonFilesStep } from "./SeasonFilesStep";
import type { SeasonFormData, SeasonMetaOptions, SeasonSlot } from "@/types/api/season";

interface SeasonFormClientProps {
  seriesId: string;
}

export function SeasonFormClient({ seriesId }: SeasonFormClientProps) {
  const formHook = useSeasonForm({ seriesId });

  return (
    <MediaPage<SeasonFormData, SeasonSlot, SeasonMetaOptions>
      useFormHook={() => formHook}
      backHref={`/series/detail/${seriesId}`}
      MetadataComponent={({ control, errors, meta }) => (
        <SeasonMetadataStep
          control={control}
          errors={errors}
          meta={meta}
          setValue={formHook.setValue}
          loadingNumber={formHook.loadingNumber}
        />
      )}
      FilesComponent={({ control, setValue, onPreview, dialogStatus }) => (
        <SeasonFilesStep
          control={control}
          setValue={setValue}
          onPreview={onPreview}
          dialogStatus={dialogStatus}
        />
      )}
      title="Ajouter une saison"
      metaFields={["numero", "title", "description"]}
      shouldSkipFilesStep={(data) => !data.addPoster}
      sidebar={{
        showDefaultLogo: true,
        defaultLogoUrl: "/ICONE_SFLIX.png",
        defaultLogoAlt: "SaFlix"
      }}
    />
  );
}