// app/films/components/FilmMetadataStep.tsx

'use client';

import React from "react";
import { Controller, UseFormSetValue, useWatch } from "react-hook-form";
import { Control, FieldErrors } from "react-hook-form";
import InputField, { MultipleInputField } from "@/ui/components/inputField";
import SuggestionsInput from "@/ui/components/suggestionField";
import { ActorsSelector } from "@/ui/components/form/ActorSelector";
import { CountryMultiSelect } from "@/ui/components/form/CountryMultiSelect";
import type { FilmFormData, FilmMetaOptions } from "@/types/api/films";
import type { CountryEntry } from "@/lib/countries";

interface FilmMetadataStepProps {
  control: Control<FilmFormData>;
  errors: FieldErrors<FilmFormData>;
  meta: {
    options: FilmMetaOptions | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
  };
  countries: CountryEntry[];
  typeValue: string;
  setValue:  UseFormSetValue<FilmFormData>;
}

export function FilmMetadataStep({
  control,
  errors,
  meta,
  countries,
  typeValue,
  setValue
}: FilmMetadataStepProps) {
  const priceValue = useWatch({ control, name: "price" });

  // Synchronisation prix/type
  React.useEffect(() => {
    if (typeValue?.toLowerCase() === "abonnement" && priceValue !== null) {
      setValue("price", null, { shouldValidate: true });
    }
  }, [typeValue, priceValue, setValue]);

  // Options pour la classification d'âge
  const ageRatingOptions = [
    { value: "TP", label: "Tous publics" },
    { value: "10", label: "Déconseillé aux moins de 10 ans" },
    { value: "12", label: "Déconseillé aux moins de 12 ans" },
    { value: "14", label: "Déconseillé aux moins de 14 ans" },
    { value: "16", label: "Déconseillé aux moins de 16 ans" },
    { value: "18", label: "Déconseillé aux moins de 18 ans" },
  ];

  // Options pour les langues
  const languageOptions = ([
    { value: "fr", label: "français" },
    { value: "en", label: "anglais" },
  ]).map((item): { value: string; label: string } => ({
    value: item.value,
    label: item.label
  }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Titre */}
        <div>
          <label className="label text-sm mb-1">
            Nom du Film <span className="text-red-500">*</span>
          </label>
          <Controller
            name="title"
            control={control}
            rules={{
              required: "Le titre du film est obligatoire",
              minLength: { value: 1, message: "Le film doit comporter au moins 1 caractère" },
            }}
            render={({ field }) => (
              <InputField {...field} value={field.value ?? ""} className="input bg-base-200 border-base-300" />
            )}
          />
          {errors.title && <p className="text-red-600 text-sm">{errors.title.message as string}</p>}
        </div>

        {/* Maison de Production */}
        <div>
          <label className="label text-sm mb-1">
            Maison de Production <span className="text-red-500">*</span>
          </label>
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

        {/* Pays de Production */}
        <div>
          <label className="label text-sm mb-1">
            Pays de Production <span className="text-red-500">*</span>
          </label>
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

        {/* Type */}
        <div>
          <label className="label text-sm mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            rules={{ required: "Le type est obligatoire" }}
            render={({ field }) => (
              <select
                {...field}
                onChange={(e) => field.onChange(e.target.value)}
                value={field.value ?? ""}
                className="input bg-base-200 border-base-300 w-full"
              >
                <option value="abonnement">Abonnement</option>
                <option value="location">Location</option>
              </select>
            )}
          />
          {errors.type && <p className="text-red-600 text-sm">{errors.type.message as string}</p>}
        </div>

        {/* Prix (conditionnel avec validation conditionnelle) */}
        {typeValue === "location" && (
          <div>
            <label className="label text-sm mb-1">
              Prix de location <span className="text-red-500">*</span>
            </label>
            <Controller
              name="price"
              control={control}
              rules={{
                required: typeValue === "location" ? "Le prix est obligatoire" : false,
                min: { value: 0, message: "Le prix doit être positif" }
              }}
              render={({ field }) => (
                <input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                  className="input bg-base-200 border-base-300"
                />
              )}
            />
            {errors.price && <p className="text-red-600 text-sm">{errors.price.message as string}</p>}
          </div>
        )}

        {/* Date de sortie */}
        <div>
          <label className="label text-sm mb-1">
            Date de sortie <span className="text-red-500">*</span>
          </label>
          <Controller
            name="releaseDate"
            control={control}
            rules={{ required: "La date de sortie est obligatoire" }}
            render={({ field }) => (
              <InputField type="date" {...field} value={field.value ?? ""} className="input bg-base-200 border-base-300" />
            )}
          />
          {errors.releaseDate && <p className="text-red-600 text-sm">{errors.releaseDate.message as string}</p>}
        </div>

        {/* Date de publication */}
        <div>
          <label className="label text-sm mb-1">
            Date de publication SaFLIX <span className="text-red-500">*</span>
          </label>
          <Controller
            name="publishDate"
            control={control}
            rules={{ required: "La date de publication est obligatoire" }}
            render={({ field }) => (
              <InputField type="date" {...field} value={field.value ?? ""} className="input bg-base-200 border-base-300" />
            )}
          />
          {errors.publishDate && <p className="text-red-600 text-sm">{errors.publishDate.message as string}</p>}
        </div>

        {/* Format */}
        <div>
          <label className="label text-sm mb-1">
            Format <span className="text-red-500">*</span>
          </label>
          <Controller
            name="format"
            control={control}
            rules={{ required: "Le format est obligatoire" }}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                className="input bg-base-200 border-base-300 w-full"
              >
                <option value="COURT-METRAGE">COURT-METRAGE</option>
                <option value="LONG-METRAGE">LONG-METRAGE</option>
              </select>
            )}
          />
          {errors.format && <p className="text-red-600 text-sm">{errors.format.message as string}</p>}
        </div>

        {/* Catégorie */}
        <div>
          <label className="label text-sm mb-1">
            Catégorie <span className="text-red-500">*</span>
          </label>
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

        {/* Genre */}
        <div>
          <label className="label text-sm mb-1">
            Genre <span className="text-red-500">*</span>
          </label>
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

        {/* Acteurs */}
        <div className="md:col-span-2">
          <label className="label text-sm mb-1">
            Acteurs principaux <span className="text-red-500">*</span>
          </label>
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

        {/* Directeur */}
        <div>
          <label className="label text-sm mb-1">
            Directeur <span className="text-red-500">*</span>
          </label>
          <Controller
            name="director"
            control={control}
            rules={{ required: "Le directeur est obligatoire" }}
            render={({ field }) => (
              <InputField {...field} value={field.value ?? ""} className="input bg-base-200 border-base-300" />
            )}
          />
          {errors.director && <p className="text-red-600 text-sm">{errors.director.message as string}</p>}
        </div>

        {/* Durée */}
        <div>
          <label className="label text-sm mb-1">
            Durée (minutes) <span className="text-red-500">*</span>
          </label>
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

        {/* Pays bloqués */}
        <div className="md:col-span-2">
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

        {/* Ayant droit */}
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

        {/* Type de programme */}
        <div>
          <label className="label text-sm mb-1">Type du programme</label>
          <Controller
            name="entertainmentMode"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                onChange={(e) => field.onChange(e.target.value)}
                value={field.value ?? ""}
                className="input bg-base-200 border-base-300 w-full"
              >
                <option value="Film">Film</option>
                <option value="Divers">Divers</option>
              </select>
            )}
          />
        </div>

        {/* Langue */}
        <div>
          <label className="label text-sm mb-1">
            Langue <span className="text-red-500">*</span>
          </label>
          <Controller
            name="language"
            control={control}
            rules={{ required: "La langue est obligatoire" }}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                className="input bg-base-200 border-base-300 w-full"
              >
                <option value="">Sélectionnez une langue</option>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.language && <p className="text-red-600 text-sm">{errors.language.message as string}</p>}
        </div>

        {/* Age rating */}
        <div>
          <label className="label text-sm mb-1">Classification (âge)</label>
          <Controller
            name="ageRating"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                className="input bg-base-200 border-base-300 w-full"
              >
                <option value="">Sélectionnez une classification</option>
                {ageRatingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="label text-sm mb-1">
          Synopsis <span className="text-red-500">*</span>
        </label>
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
    </>
  );
}