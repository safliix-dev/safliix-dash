// app/dashboard/series/[id]/episodes/add/components/EpisodeMetadataStep.tsx

'use client';

import React from "react";
import { Controller } from "react-hook-form";
import { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import InputField, { MultipleInputField } from "@/ui/components/inputField";
import { ActorsSelector } from "@/ui/components/form/ActorSelector";
import type { EpisodeFormData, EpisodeMetaOptions } from "@/types/api/episode";

interface EpisodeMetadataStepProps {
  control: Control<EpisodeFormData>;
  errors: FieldErrors<EpisodeFormData>;
  meta: {
    options: EpisodeMetaOptions | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
  };
  setValue: UseFormSetValue<EpisodeFormData>;
}

export function EpisodeMetadataStep({
  control,
  errors,
  meta
}: EpisodeMetadataStepProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Titre de l'épisode */}
        <div>
          <label className="label text-sm mb-1">Nom de l&apos;épisode</label>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Le titre de l'épisode est obligatoire" }}
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

        {/* Numéro d'épisode */}
        <div>
          <label className="label text-sm mb-1">Numéro d&apos;épisode</label>
          <Controller
            name="episodeNumber"
            control={control}
            rules={{ required: "Le numéro d'épisode est obligatoire" }}
            render={({ field }) => (
              <InputField
                type="number"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                className="input bg-base-200 border-base-300"
              />
            )}
          />
          {errors.episodeNumber && <p className="text-red-600 text-sm">{errors.episodeNumber.message as string}</p>}
        </div>

        {/* Date de sortie */}
        <div>
          <label className="label text-sm mb-1">Date de sortie</label>
          <Controller
            name="releaseDate"
            control={control}
            rules={{ required: "La date de sortie est obligatoire" }}
            render={({ field }) => (
              <InputField 
                type="date" 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.releaseDate && <p className="text-red-600 text-sm">{errors.releaseDate.message as string}</p>}
        </div>

        {/* Publication sur SaFLIX */}
        <div>
          <label className="label text-sm mb-1">Publication sur SaFLIX</label>
          <Controller
            name="publishDate"
            control={control}
            rules={{ required: "La date de publication est obligatoire" }}
            render={({ field }) => (
              <InputField 
                type="date" 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.publishDate && <p className="text-red-600 text-sm">{errors.publishDate.message as string}</p>}
        </div>

        {/* Réalisateur */}
        <div>
          <label className="label text-sm mb-1">Réalisateur</label>
          <Controller
            name="director"
            control={control}
            rules={{ required: "Le réalisateur est obligatoire" }}
            render={({ field }) => (
              <InputField 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.director && <p className="text-red-600 text-sm">{errors.director.message as string}</p>}
        </div>

        {/* Durée */}
        <div>
          <label className="label text-sm mb-1">Durée (minutes)</label>
          <Controller
            name="duration"
            control={control}
            rules={{ 
              required: "La durée est obligatoire",
              min: { value: 1, message: "La durée doit être d'au moins 1 minute" }
            }}
            render={({ field }) => (
              <InputField
                type="number"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                className="input bg-base-200 border-base-300"
              />
            )}
          />
          {errors.duration && <p className="text-red-600 text-sm">{errors.duration.message as string}</p>}
        </div>

        {/* Production personnalisée */}
        <div>
          <label className="label text-sm mb-1">Production personnalisée</label>
          <Controller
            name="isCustomProduction"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                <span>Oui</span>
              </label>
            )}
          />
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
        <label className="label text-sm mb-1">Description de l&apos;épisode (synopsis)</label>
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

      {/* Acteurs avec ActorsSelector */}
      <div className="space-y-2">
        <label className="label text-sm mb-1">Acteurs principaux</label>
        <Controller
          name="actors"
          control={control}
          rules={{ required: "Les acteurs sont obligatoires" }}
          render={({ field }) => (
            <ActorsSelector
              value={field.value ?? []}
              onChange={(val) => field.onChange(val)}
              options={(meta.options?.actors ?? []).map((item: { id: string; name: string }) => ({
                label: item.name,
                value: item.id
              }))}
            />
          )}
        />
        {errors.actors && <p className="text-red-600 text-sm">{errors.actors.message as string}</p>}
      </div>
    </>
  );
}