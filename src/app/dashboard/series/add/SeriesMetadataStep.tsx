// app/series/components/SeriesMetadataStep.tsx

'use client';

import React from "react";
import { Controller } from "react-hook-form";
import { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import InputField, { MultipleInputField } from "@/ui/components/inputField";
import SuggestionsInput from "@/ui/components/suggestionField";
import { ActorsSelector } from "@/ui/components/form/ActorSelector";
import { CountryMultiSelect } from "@/ui/components/form/CountryMultiSelect";
import UploadBox from "@/ui/specific/films/components/uploadBox";
import type { SeriesFormData, SeriesMetaOptions } from "@/types/api/series";
import type { CountryEntry } from "@/lib/countries";

interface SeriesMetadataStepProps {
  control: Control<SeriesFormData>;
  errors: FieldErrors<SeriesFormData>;
  meta: {
    options: SeriesMetaOptions | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
  };
  countries: CountryEntry[];
  setValue: UseFormSetValue<SeriesFormData>;
}

export function SeriesMetadataStep({
  control,
  errors,
  meta,
  countries,
}: SeriesMetadataStepProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Titre */}
      <div>
        <label className="label text-sm mb-1">Nom de la série</label>
        <Controller
          name="title"
          control={control}
          rules={{ 
            required: "Le titre de la série est obligatoire", 
            minLength: { value: 1, message: "Au moins 1 caractère" } 
          }}
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

      {/* Maison de production et Pays */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Maison de production</label>
          <Controller
            name="productionHouse"
            control={control}
            rules={{ required: "La maison de production est obligatoire" }}
            render={({ field }) => (
              <SuggestionsInput 
                optionList={(meta.options?.productionHouses ?? []).map((item: string) => ({
                  label: item,
                  value: item
                }))}
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.productionHouse && <p className="text-red-600 text-sm">{errors.productionHouse.message as string}</p>}
        </div>
        <div>
          <label className="label text-sm mb-1">Pays de production</label>
          <Controller
            name="country"
            control={control}
            rules={{ required: "Le pays de production est obligatoire" }}
            render={({ field }) => (
              <SuggestionsInput 
                optionList={(meta.options?.countries ?? []).map((item: string) => ({
                  label: item,
                  value: item
                }))}
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.country && <p className="text-red-600 text-sm">{errors.country.message as string}</p>}
        </div>
      </div>

      {/* Catégorie et Genre */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Catégorie</label>
          <Controller
            name="category"
            control={control}
            rules={{ required: "La catégorie est obligatoire" }}
            render={({ field }) => (
              <SuggestionsInput 
                optionList={(meta.options?.categories ?? []).map((item: { category: string }) => ({
                  label: item.category,
                  value: item.category
                }))}
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.category && <p className="text-red-600 text-sm">{errors.category.message as string}</p>}
        </div>
        <div>
          <label className="label text-sm mb-1">Genre</label>
          <Controller
            name="genre"
            control={control}
            rules={{ required: "Le genre est obligatoire" }}
            render={({ field }) => (
              <SuggestionsInput 
                optionList={(meta.options?.genres ?? []).map((item: { name: string }) => ({
                  label: item.name,
                  value: item.name
                }))}
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.genre && <p className="text-red-600 text-sm">{errors.genre.message as string}</p>}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className="label text-sm mb-1">Date de publication SaFLIX</label>
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
      </div>

      {/* Nombre de saisons et Réalisateur */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Nombre de saisons</label>
          <Controller
            name="seasonCount"
            control={control}
            rules={{ required: "Le nombre de saisons est obligatoire" }}
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
          {errors.seasonCount && <p className="text-red-600 text-sm">{errors.seasonCount.message as string}</p>}
        </div>
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
      </div>

      {/* Acteurs et Ayant droit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
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
        <div>
          <label className="label text-sm mb-1">Ayant droit</label>
          <Controller
            name="rightHolderId"
            control={control}
            render={({ field }) => (
              <SuggestionsInput
                optionList={(meta.options?.rightHolders ?? []).map((item: { id: string; firstName: string; lastName: string }) => ({
                  label: `${item.firstName} ${item.lastName}`,
                  value: item.id
                }))}
                {...field}
                value={field.value ?? ""}
                className="input bg-base-200 border-base-300"
              />
            )}
          />
        </div>
      </div>

      {/* Pays bloqués et Langues */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Pays bloqués</label>
          <Controller
            name="blockCountries"
            control={control}
            render={({ field }) => (
              <CountryMultiSelect
                availableCountries={countries}
                value={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div>
          <label className="label text-sm mb-1">Langues de sous-titres</label>
          <Controller
            name="subtitleLanguages"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                value={(field.value ?? []).join(", ")}
                onChange={(e) =>
                  field.onChange(
                    e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Ex: fr, en"
                className="input bg-base-200 border-base-300"
              />
            )}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="label text-sm mb-1">Synopsis</label>
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

      {/* Checkboxes */}
      <div className="flex items-center gap-6">
        <Controller
          name="isSafliixProd"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Production SaFlix
            </label>
          )}
        />
        <Controller
          name="haveSubtitles"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Sous-titres
            </label>
          )}
        />
      </div>

      {/* Langue et Classification */}
      <div className="grid grid-cols-3 gap-3 items-end">
        <div>
          <label className="label text-sm mb-1">Langue</label>
          <Controller
            name="language"
            control={control}
            rules={{ required: "La langue est obligatoire" }}
            render={({ field }) => (
              <SuggestionsInput 
                optionList={(meta.options?.languages ?? []).map((item: string) => ({
                  label: item,
                  value: item
                }))}
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.language && <p className="text-red-600 text-sm">{errors.language.message as string}</p>}
        </div>
        <div>
          <label className="label text-sm mb-1">Classification (âge)</label>
          <Controller
            name="ageRating"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                value={field.value ?? ""}
                placeholder="Ex: R, PG-13"
                className="input bg-base-200 border-base-300"
              />
            )}
          />
        </div>
        <UploadBox id="trailer" label="Sous-titres" className="w-full min-h-[80px]" />
      </div>
    </div>
  );
}