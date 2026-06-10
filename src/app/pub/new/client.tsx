// app/dashboard/Ads/add/client.tsx

'use client';

import React from "react";
import { MediaPage } from "@/ui/layout/mediaPage";
import { useAdsForm } from "./useAdsForm";
import { AdsMetadataStep } from "./AdsMetadataStep";
import { AdsFilesStep } from "./AdsFilesStep";
import type { AdsFormData, AdsSlot } from "@/types/api/ads";

interface AdsFormClientProps {
  adsId?: string;
}

export function AdsFormClient({ adsId }: AdsFormClientProps) {
  const formHook = useAdsForm({ adsId });

  return (
    <MediaPage<AdsFormData, AdsSlot, null>
      useFormHook={() => formHook}
      backHref="/pub"
      MetadataComponent={({ control, errors, meta }) => (
        <AdsMetadataStep
          control={control}
          errors={errors}
          meta={meta}
          setValue={formHook.setValue}
        />
      )}
      FilesComponent={({ control, setValue, onPreview, dialogStatus }) => (
        <AdsFilesStep
          control={control}
          setValue={setValue}
          onPreview={onPreview}
          dialogStatus={dialogStatus}
        />
      )}
      title="Espace disponibilité"
      metaFields={[
        "title", "description", "startDate", "endDate", "line", "status"
      ]}
      sidebar={{
        showDefaultLogo: true,
        defaultLogoUrl: "/Disponible.jpg",
        defaultLogoAlt: "Ads"
      }}
    />
  );
}