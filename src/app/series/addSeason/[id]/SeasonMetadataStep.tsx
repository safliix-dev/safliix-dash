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
  meta: FormMeta<SeasonMetaOptions>;
  setValue: UseFormSetValue<SeasonFormData>;
  loadingNumber?: boolean;
}

export function SeasonMetadataStep({
  control,
  errors,
  loadingNumber,
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
            render={({ field }) => (
              loadingNumber ? (
                <div className="input bg-base-200 border-base-300 flex items-center gap-2 opacity-70">
                  <span className="loading loading-spinner loading-xs" />
                </div>
              ) : (
                <input
                  type="number"
                  {...field}
                  readOnly
                  className="input bg-base-200 border-base-300 opacity-70 cursor-not-allowed w-full p-2 border rounded text-[#F0EDED]"
                />
              )
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

      {/* Poster */}
      <Controller
        name="addPoster"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            <span className="text-sm">Ajouter une image pour cette saison</span>
          </label>
        )}
      />
    </div>
  );
}