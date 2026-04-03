// app/series/detail/[id]/seasons/add/components/SeasonMetadataStep.tsx

'use client';

import React from "react";
import { Controller } from "react-hook-form";
import { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import InputField, { MultipleInputField } from "@/ui/components/inputField";
import type { SeasonFormData, SeasonMetaOptions } from "@/types/api/season";
import { FormMeta } from "@/ui/layout/mediaPage";

interface SeasonMetadataStepProps {
  control: Control<SeasonFormData>;
  errors: FieldErrors<SeasonFormData>;
  meta: FormMeta<SeasonMetaOptions>;  // 👈 Utiliser FormMeta générique
  setValue: UseFormSetValue<SeasonFormData>;
}

export function SeasonMetadataStep({
  control,
  errors
}: SeasonMetadataStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Numéro de saison */}
        <div>
          <label className="label text-sm mb-1">Numéro de saison</label>
          <Controller
            name="numero"
            control={control}
            rules={{ required: "Le numéro de saison est obligatoire" }}
            render={({ field }) => (
              <InputField
                type="number"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                className="input bg-base-200 border-base-300"
                placeholder="Ex: 1"
              />
            )}
          />
          {errors.numero && <p className="text-red-600 text-sm">{errors.numero.message as string}</p>}
        </div>

        {/* Titre */}
        <div>
          <label className="label text-sm mb-1">Titre</label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <InputField 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300"
                placeholder="Titre de la saison"
              />
            )}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="label text-sm mb-1">Description</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <MultipleInputField
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              className="bg-base-200 border-base-300"
              placeholder="Description de la saison"
              rows={3}
            />
          )}
        />
      </div>
    </div>
  );
}