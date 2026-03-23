// app/dashboard/pub/add/components/PubMetadataStep.tsx

'use client';

import React from "react";
import { Controller } from "react-hook-form";
import { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import InputField, { MultipleInputField } from "@/ui/components/inputField";
import type { AdsFormData, AdsMetaOptions } from "@/types/api/ads";

interface AdsMetadataStepProps {
  control: Control<AdsFormData>;
  errors: FieldErrors<AdsFormData>;
  meta: {
    options: AdsMetaOptions | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
  };
  setValue: UseFormSetValue<AdsFormData>;
}

export function AdsMetadataStep({
  control,
  errors,
  meta
}: AdsMetadataStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nom de la pub */}
        <div>
          <label className="label text-sm mb-1">Nom de la pub</label>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Le nom de la pub est obligatoire" }}
            render={({ field }) => (
              <InputField 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.title && <p className="text-red-600 text-sm">{errors.title.message as string}</p>}
        </div>

        {/* Ligne */}
        <div>
          <label className="label text-sm mb-1">Lien</label>
          <Controller
            name="line"
            control={control}
            rules={{ required: "Le lien est obligatoire" }}
            render={({ field }) => (
              <InputField 
                {...field} 
                value={field.value ?? ""} 
                placeholder="URL ou identifiant du lien"
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.line && <p className="text-red-600 text-sm">{errors.line.message as string}</p>}
        </div>

        {/* Date de mise en ligne */}
        <div>
          <label className="label text-sm mb-1">Mise en ligne</label>
          <Controller
            name="startDate"
            control={control}
            rules={{ required: "La date de mise en ligne est obligatoire" }}
            render={({ field }) => (
              <InputField 
                type="date" 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.startDate && <p className="text-red-600 text-sm">{errors.startDate.message as string}</p>}
        </div>

        {/* Date de mise hors ligne */}
        <div>
          <label className="label text-sm mb-1">Mise hors ligne</label>
          <Controller
            name="endDate"
            control={control}
            rules={{ required: "La date de mise hors ligne est obligatoire" }}
            render={({ field }) => (
              <InputField 
                type="date" 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.endDate && <p className="text-red-600 text-sm">{errors.endDate.message as string}</p>}
        </div>

        {/* Statut */}
        <div>
          <label className="label text-sm mb-1">Statut</label>
          <Controller
            name="status"
            control={control}
            rules={{ required: "Le statut est obligatoire" }}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                className="input bg-base-200 border-base-300 w-full"
              >
                {meta.options?.statusOptions?.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            )}
          />
          {errors.status && <p className="text-red-600 text-sm">{errors.status.message as string}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="label text-sm mb-1">Description</label>
        <Controller
          name="description"
          control={control}
          rules={{ required: "La description est obligatoire" }}
          render={({ field }) => (
            <MultipleInputField
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              className="bg-base-200 border-base-300"
            />
          )}
        />
        {errors.description && <p className="text-red-600 text-sm">{errors.description.message as string}</p>}
      </div>
    </div>
  );
}