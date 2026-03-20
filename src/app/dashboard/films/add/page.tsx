'use client';

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Controller, useWatch } from "react-hook-form";

// Composants communs
import { FormStepLayout } from "@/ui/components/form/FormStepLayout";
import { FormNavigation } from "@/ui/components/form/FormNavigation";
import { FormConfirmation } from "@/ui/components/form/FormConfirmation";
import { VideoPreviewModal } from "@/ui/components/form/VideoPreviewModal";

// Composants spécifiques
import UploadBox from "@/ui/specific/films/components/uploadBox";
import InputField, { MultipleInputField } from "@/ui/components/inputField";
import SuggestionsInput from "@/ui/components/suggestionField";
import { ActorsSelector } from "@/ui/components/form/ActorSelector";
import { CountryMultiSelect } from "@/ui/components/form/CountryMultiSelect";
import { VideoUpload } from "@/ui/components/form/VideoUpload";

// Hooks et types
import { useFilmForm } from "./useFilmForm";
import { getCountries } from "@/lib/countries";
import type { FilmFormData } from "@/types/api/films";
import type { CountryEntry } from "@/lib/countries";

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
    setDialogOpen,
    setDialogStatus,

    upload,
    meta,
    pendingData,
    resetEngine,
    setEntityId,
    entityId
  } = useFilmForm();

  const searchParams = useSearchParams();
  const [countries, setCountries] = useState<CountryEntry[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0 = meta, 1 = files
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Watch fields
  const typeValue = useWatch({ control, name: "type" });
  const movieFile = useWatch({ control, name: "movieFile" }) as File | null;
  const trailerFile = useWatch({ control, name: "trailerFile" }) as File | null;
  const priceValue = useWatch({ control, name: "price" });

  const filmId = searchParams.get("id");
  const steps = [
    { id: 'meta', label: 'Métadonnées' },
    { id: 'files', label: 'Fichiers' }
  ];

  useEffect(() => {
    if (filmId) {
      setEntityId(filmId);
    }
  }, [filmId, setEntityId]);

  useEffect(() => {
    setCountries(getCountries("fr"));
  }, []);

  useEffect(() => {
    if (typeValue?.toLowerCase() === "abonnement" && priceValue !== null) {
      setValue("price", null, { shouldValidate: true });
    }
  }, [typeValue, priceValue, setValue]);

  // Dans ton composant Page.tsx


  
  const handleStepSubmit = async (data: FilmFormData) => {
  // Liste des champs à valider pour l'étape 0
    const metaFields: (keyof FilmFormData)[] = [
      "title", "productionHouse", "country", "type", "releaseDate", 
      "publishDate", "format", "category", "genre", "actors", 
      "director", "duration", "description", "language"
    ];

    if (currentStep === 0) {
      const isValid = await trigger(metaFields);
      if (isValid) {
        // On ouvre la modale de confirmation pour sauvegarder les métadonnées
        openConfirm(data);
      }
    } else {
      // Étape 1 : Validation des fichiers (si nécessaire) et confirmation finale
      openConfirm(data);
    }
  };

  return (
    <FormStepLayout
      title="Édition de film"
      currentStep={currentStep}
      totalSteps={steps.length}
      stepLabel={steps[currentStep].label}
      isLoading={meta.loading}
      error={meta.error}
    >
      <form
        onSubmit={handleSubmit(handleStepSubmit)}
        className="bg-neutral px-5 py-6 rounded-2xl shadow border border-base-300 space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Logo */}
          <div className="lg:col-span-4">
            <div className="bg-base-200/40 border border-base-300 rounded-xl p-4 h-full flex items-center justify-center overflow-hidden">
              <Image 
                src="/ICONE_SFLIX.png" 
                alt="SaFlix" 
                width={240} 
                height={240} 
                className="object-contain" 
              />
            </div>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-8 space-y-6">
            {currentStep === 0 && (
              <MetadataStepContent
                control={control}
                errors={errors}
                meta={meta}
                countries={countries}
                typeValue={typeValue}
              />
            )}

            {currentStep === 1 && (
              <FilesStepContent
                control={control}
                setValue={setValue}
                movieFile={movieFile}
                trailerFile={trailerFile}
                typeValue={typeValue}
                onPreview={(url:string) => {
                  setVideoPreview(url);
                  setShowVideoModal(true);
                }}
                onOpenConfirm={handleSubmit(openConfirm)}
                meta={meta}
                dialogStatus={dialogStatus}
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
              finalLabel="Publier le film"
            />
          </div>
        </div>
      </form>

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
            ? (entityId ? "Mettre à jour les infos ?" : "Enregistrer les infos ?")
            : "Publier le film ?"
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
        onConfirm={() => {
          console.log("Clic sur le bouton de la modale !"); // Ce log doit s'afficher
          confirmSubmit(currentStep);
        }}
        upload={upload}
        pendingData={pendingData ? { ...pendingData, mainImage: pendingData.mainImage ?? undefined, secondaryImage: pendingData.secondaryImage ?? undefined, movieFile: pendingData.movieFile ?? undefined, trailerFile: pendingData.trailerFile ?? undefined } : null}
        summary={currentStep === 0 ? 'metadata' : 'files'}
        currentStep={currentStep}
        onNextStep={() => {
          setDialogOpen(false); // On ferme la modale
          setCurrentStep(1);    // On change d'onglet
          // On repasse le statut en 'idle' pour la prochaine ouverture
          setTimeout(() => setDialogStatus("idle"), 500);
        }}
      />
    </FormStepLayout>
  );
}

// Sous-composant pour l'étape Métadonnées
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetadataStepContent({ control, errors, meta, countries, typeValue }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Titre */}
        <div>
          <label className="label text-sm mb-1">Nom du Film</label>
          <Controller
            name="title"
            control={control}
            rules={{
              required: "Titre du film",
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
          <label className="label text-sm mb-1">Maison de Production</label>
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
          <label className="label text-sm mb-1">Pays de Production</label>
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
          <label className="label text-sm mb-1">Type</label>
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

        {/* Prix (conditionnel) */}
        {typeValue === "location" && (
          <div>
            <label className="label text-sm mb-1">Prix de location</label>
            <Controller
              name="price"
              control={control}
              rules={{
                validate: (val) => {
                  if (typeValue === "abonnement") return true;
                  return val !== null && val !== undefined ? true : "Le prix est obligatoire";
                },
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
            {errors.price && <p className="text-red-600 text-sm">{errors.price.message as string}</p>}
          </div>
        )}

        {/* Dates */}
        <div>
          <label className="label text-sm mb-1">Date de sortie</label>
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

        <div>
          <label className="label text-sm mb-1">Date de publication SaFLIX</label>
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
          <label className="label text-sm mb-1">Format</label>
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

        {/* Genre */}
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

        {/* Acteurs */}
        <div className="md:col-span-2">
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

        {/* Directeur */}
        <div>
          <label className="label text-sm mb-1">Directeur</label>
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
          <label className="label text-sm mb-1">Durée (minutes)</label>
          <Controller
            name="duration"
            control={control}
            rules={{ required: "La durée est obligatoire" }}
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
                className="input bg-base-200 border-base-300 w-full"
              >
                <option>Film</option>
                <option>Divers</option>
              </select>
            )}
          />
        </div>

        {/* Langue */}
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

        {/* Age rating */}
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
    </>
  );
}

// Sous-composant pour l'étape Fichiers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FilesStepContent({ setValue, movieFile, trailerFile, typeValue, onPreview, onOpenConfirm, meta, dialogStatus }: any) {
  return (
    <>
      <div className="grid grid-cols-6 grid-rows-2 gap-4">
        <UploadBox
          id="main"
          label="Image principale"
          className="row-span-2 col-span-3 min-h-[220px]"
          onFileSelect={(file) => setValue("mainImage", file ?? null, { shouldValidate: true })}
        />
        <UploadBox
          id="sec"
          label="Image secondaire"
          className="col-span-3 min-h-[100px]"
          onFileSelect={(file) => setValue("secondaryImage", file ?? null, { shouldValidate: false })}
        />
        <VideoUpload
          id="film-file"
          label={typeValue?.toLowerCase() === "abonnement" ? "Vidéo (optionnel)" : "Vidéo du film"}
          fileLabel="Choisir une vidéo"
          file={movieFile}
          onSelect={(file?: File | null) => setValue("movieFile", file ?? null, { shouldValidate: false })}
          onPreview={onPreview}
        />
        <VideoUpload
          id="trailer-file"
          label="Bande annonce"
          fileLabel="Choisir une bande annonce"
          file={trailerFile}
          onSelect={(file?: File | null) => setValue("trailerFile", file ?? null, { shouldValidate: false })}
          onPreview={onPreview}
        />
      </div>

      <div className="flex items-center gap-3 pt-2 justify-end">
        <button
          type="button"
          className="btn btn-outline btn-ghost text-white"
          onClick={onOpenConfirm}
          disabled={meta.loading || dialogStatus === 'loading'}
        >
          Enregistrer en brouillon
        </button>
      </div>
    </>
  );
}