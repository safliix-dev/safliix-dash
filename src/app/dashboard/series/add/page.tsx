'use client';

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Controller, useWatch } from "react-hook-form";

// Composants communs
import { FormStepLayout } from "@/ui/components/form/FormStepLayout";
import { FormNavigation } from "@/ui/components/form/FormNavigation";
import { FormConfirmation } from "@/ui/components/form/FormConfirmation";
import { VideoPreviewModal } from "@/ui/components/form/VideoPreviewModal";
import FormWithAside from "@/ui/components/formWithAside";

// Composants spécifiques
import UploadBox from "@/ui/specific/films/components/uploadBox";
import InputField, { MultipleInputField } from "@/ui/components/inputField";
import SuggestionsInput from "@/ui/components/suggestionField";

// Hooks et types
import { useSeriesForm } from "./useSerieForm";
import { getCountries } from "@/lib/countries";
import type { SeriesFormData } from "@/types/api/series";
import type { CountryEntry } from "@/lib/countries";
import { ActorsSelector } from "@/ui/components/form/ActorSelector";
import { CountryMultiSelect } from "@/ui/components/form/CountryMultiSelect";


export default function Page() {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    trigger,
    openConfirm,
    confirmSubmit,
    closeDialog,
    dialogOpen,
    dialogStatus,
    upload,
    meta,
    pendingData,
    resetEngine,
    setEntityId,
    entityId
  } = useSeriesForm();

  const searchParams = useSearchParams();
  const [countries, setCountries] = useState<CountryEntry[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0 = meta, 1 = files
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Watch fields
  const actorsValue = useWatch({ control, name: "actors" }) as string[];
  const trailerFile = useWatch({ control, name: "trailerFile" }) as File | null;

  const serieId = searchParams.get("id");
  const steps = [
    { id: 'meta', label: 'Métadonnées' },
    { id: 'files', label: 'Fichiers' }
  ];

  useEffect(() => {
    if (serieId) {
      setEntityId(serieId);
    }
  }, [serieId, setEntityId]);

  useEffect(() => {
    setCountries(getCountries("fr"));
  }, []);

  const handleStepSubmit = async (data: SeriesFormData) => {
    if (currentStep === 0) {
      const isValid = await trigger([
        "title", "productionHouse", "country", "releaseDate", 
        "publishDate", "category", "genre", "actors", 
        "director", "description", "language"
      ]);
      
      if (isValid) {
        setCurrentStep(1);
      }
      return;
    }
    
    openConfirm(data);
  };

  return (
    <FormStepLayout
      title={serieId ? "Modifier la série" : "Nouvelle série"}
      currentStep={currentStep}
      totalSteps={steps.length}
      stepLabel={steps[currentStep].label}
      isLoading={meta.loading}
      error={meta.error}
    >
      <FormWithAside>
        <form
          onSubmit={handleSubmit(handleStepSubmit)}
          className="gap-6 bg-neutral px-5 py-6 rounded-2xl shadow border border-base-300"
        >
          <div className="space-y-6">
            {/* Step 1: Métadonnées */}
            {currentStep === 0 && (
              <MetadataStepContent
                control={control}
                errors={errors}
                meta={meta}
                countries={countries}
              />
            )}

            {/* Step 2: Fichiers */}
            {currentStep === 1 && (
              <FilesStepContent
                control={control}
                setValue={setValue}
                trailerFile={trailerFile}
                actorsValue={actorsValue}
                onPreview={(url:string) => {
                  setVideoPreview(url);
                  setShowVideoModal(true);
                }}
              />
            )}

            {/* Navigation */}
            <FormNavigation
              currentStep={currentStep}
              totalSteps={steps.length}
              onPrevious={() => setCurrentStep(0)}
              isSubmitting={dialogStatus === 'loading'}
              isLastStep={currentStep === 1}
              nextLabel="Continuer vers les fichiers"
              finalLabel="Publier la série"
            />
          </div>
        </form>
      </FormWithAside>

      {/* Modales */}
      {showVideoModal && videoPreview && (
        <VideoPreviewModal
          url={videoPreview}
          onClose={() => {
            setShowVideoModal(false);
            setVideoPreview(null);
          }}
        />
      )}

      <FormConfirmation
        open={dialogOpen}
        title={
          currentStep === 0
            ? (entityId ? "Mettre à jour les infos ?" : "Enregistrer le brouillon ?")
            : "Publier la série ?"
        }
        message={
          currentStep === 0
            ? "Les métadonnées seront sauvegardées. Vous pourrez ensuite passer à l'ajout des fichiers."
            : "Vous êtes sur le point d'envoyer les fichiers définitifs vers le serveur."
        }
        status={dialogStatus}
        confirmLabel={currentStep === 0 ? "Sauvegarder et Continuer" : "Envoyer les fichiers"}
        onCancel={() => {
          closeDialog();
          if (dialogStatus === 'error') resetEngine();
        }}
        onConfirm={confirmSubmit}
        upload={upload}
        pendingData={pendingData}
        summary={currentStep === 0 ? 'metadata' : 'files'}
      />
    </FormStepLayout>
  );
}

// Sous-composant pour l'étape Métadonnées
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetadataStepContent({ control, errors, meta, countries }: any) {
  return (
    <div className="flex flex-col gap-3">
      {/* Titre */}
      <div>
        <label className="label text-sm mb-1">Nom de la série</label>
        <Controller
          name="title"
          control={control}
          rules={{ 
            required: "Titre de la série", 
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
        {errors.title && <p className="text-red-600 text-sm">{errors.title.message}</p>}
      </div>

      {/* Maison de production et Pays */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Maison de production</label>
          <Controller
            name="productionHouse"
            control={control}
            rules={{ required: "Obligatoire" }}
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
          {errors.productionHouse && <p className="text-red-600 text-sm">{errors.productionHouse.message}</p>}
        </div>
        <div>
          <label className="label text-sm mb-1">Pays de production</label>
          <Controller
            name="country"
            control={control}
            rules={{ required: "Obligatoire" }}
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
          {errors.country && <p className="text-red-600 text-sm">{errors.country.message}</p>}
        </div>
      </div>

      {/* Catégorie et Genre */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Catégorie</label>
          <Controller
            name="category"
            control={control}
            rules={{ required: "Obligatoire" }}
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
          {errors.category && <p className="text-red-600 text-sm">{errors.category.message}</p>}
        </div>
        <div>
          <label className="label text-sm mb-1">Genre</label>
          <Controller
            name="genre"
            control={control}
            rules={{ required: "Obligatoire" }}
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
          {errors.genre && <p className="text-red-600 text-sm">{errors.genre.message}</p>}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Date de sortie</label>
          <Controller
            name="releaseDate"
            control={control}
            rules={{ required: "Obligatoire" }}
            render={({ field }) => (
              <InputField 
                type="date" 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.releaseDate && <p className="text-red-600 text-sm">{errors.releaseDate.message}</p>}
        </div>
        <div>
          <label className="label text-sm mb-1">Date de publication SaFLIX</label>
          <Controller
            name="publishDate"
            control={control}
            rules={{ required: "Obligatoire" }}
            render={({ field }) => (
              <InputField 
                type="date" 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.publishDate && <p className="text-red-600 text-sm">{errors.publishDate.message}</p>}
        </div>
      </div>

      {/* Nombre de saisons et Réalisateur */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Nombre de saisons</label>
          <Controller
            name="seasonCount"
            control={control}
            rules={{ required: "Obligatoire" }}
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
          {errors.seasonCount && <p className="text-red-600 text-sm">{errors.seasonCount.message}</p>}
        </div>
        <div>
          <label className="label text-sm mb-1">Réalisateur</label>
          <Controller
            name="director"
            control={control}
            rules={{ required: "Obligatoire" }}
            render={({ field }) => (
              <InputField 
                {...field} 
                value={field.value ?? ""} 
                className="input bg-base-200 border-base-300" 
              />
            )}
          />
          {errors.director && <p className="text-red-600 text-sm">{errors.director.message}</p>}
        </div>
      </div>

      {/* Acteurs et Ayant droit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-sm mb-1">Acteurs principaux</label>
          <Controller
            name="actors"
            control={control}
            rules={{ required: "Obligatoire" }}
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
          {errors.actors && <p className="text-red-600 text-sm">{errors.actors.message}</p>}
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
        {errors.description && <p className="text-red-600 text-sm">{errors.description.message}</p>}
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
          {errors.language && <p className="text-red-600 text-sm">{errors.language.message}</p>}
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

// Sous-composant pour l'étape Fichiers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FilesStepContent({ _control, setValue, _trailerFile, actorsValue, _onPreview }: any) {
  return (
    <>
      <div className="grid grid-cols-6 grid-rows-2 gap-4">
        <UploadBox
          id="main"
          label="Image principale"
          className="row-span-2 col-span-3 min-h-[220px]"
          onFileSelect={(file) => setValue("mainImage", file ?? null, { shouldValidate: false })}
        />
        <UploadBox
          id="sec"
          label="Image secondaire"
          className="col-span-3 min-h-[100px]"
          onFileSelect={(file) => setValue("secondaryImage", file ?? null, { shouldValidate: false })}
        />
        <UploadBox
          id="video"
          label="Bande annonce"
          className="col-span-3 min-h-[100px]"
          onFileSelect={(file) => setValue("trailerFile", file ?? null, { shouldValidate: false })}
        />
      </div>

      {/* Photos des acteurs */}
      <div className="space-y-2">
        <label className="label text-sm mb-1">Photos des acteurs</label>
        {(actorsValue ?? []).length ? (
          <div className="flex gap-2 items-center flex-wrap">
            {(actorsValue ?? []).map((name: string, index: number) => (
              <UploadBox 
                key={`${name}-${index}`} 
                id={`actor-image-${index}`} 
                label={name} 
                className="w-20 h-20" 
                onFileSelect={(file) => {
                  // Logique pour associer la photo à l'acteur
                  setValue(`actorImages.${index}`, file ?? null);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-xs text-white/60 bg-base-200/60 border border-base-300 rounded-lg px-3 py-2">
            Ajoutez des acteurs dans l&apos;étape Métadonnées pour ajouter leurs photos.
          </div>
        )}
        <p className="text-xs text-white/60">
          Veillez à ce que la photo corresponde au nom sélectionné.
        </p>
      </div>
    </>
  );
}