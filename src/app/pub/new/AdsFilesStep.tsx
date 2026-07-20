// app/dashboard/pub/add/components/PubFilesStep.tsx

'use client';

import React from "react";
import { useWatch } from "react-hook-form";
import { Control, UseFormSetValue } from "react-hook-form";
import UploadBox from "@/ui/specific/films/components/uploadBox";
import type { AdsFormData } from "@/types/api/ads";
import { DialogStatus } from "@/ui/components/confirmationDialog";


interface AdsFilesStepProps {
  control: Control<AdsFormData>;
  setValue: UseFormSetValue<AdsFormData>;
  onPreview: (url: string) => void;
  dialogStatus: DialogStatus;
}

export function AdsFilesStep({
  control,
  setValue,
}: AdsFilesStepProps) {
  const mainImage = useWatch({ control, name: "mainImage" });
  const secondaryImage = useWatch({ control, name: "secondaryImage" });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image principale */}
        <UploadBox
          id="main"
          label="Image principale"
          value={mainImage as File | null}
          className="min-h-55"
          onFileSelect={(file) => setValue("mainImage", file ?? null, { shouldValidate: true })}
        />

        {/* Image secondaire */}
        <UploadBox
          id="sec"
          label="Image secondaire"
          value={secondaryImage as File | null}
          className="min-h-55"
          onFileSelect={(file) => setValue("secondaryImage", file ?? null, { shouldValidate: false })}
        />
      </div>
    </div>
  );
}