// ui/components/form/MediaPage.tsx

'use client';

import React, { useEffect, useState } from "react";
import { Control, FieldErrors, FieldValues, UseFormHandleSubmit, UseFormSetValue } from "react-hook-form";
import Image from "next/image";

import { FormStepLayout } from "@/ui/components/form/FormStepLayout";
import { FormNavigation } from "@/ui/components/form/FormNavigation";
import { FormConfirmation } from "@/ui/components/form/FormConfirmation";
import { VideoPreviewModal } from "@/ui/components/form/VideoPreviewModal";
import { UploadState } from "@/types/upload";
import { DialogStatus } from "../components/confirmationDialog";
/**
 * Interface pour les métadonnées du formulaire (retour de useMetaOptions)
 */
export interface FormMeta<TMetaOptions = unknown> {
  options: TMetaOptions | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Type du hook retourné par useMediaFormEngine
 */
export interface MediaFormEngineReturn<
  TFormData extends FieldValues,
  TSlot extends string
> {
  control: Control<TFormData>;
  handleSubmit: UseFormHandleSubmit<TFormData>;
  setValue: UseFormSetValue<TFormData>;
  formState: {
    errors: FieldErrors<TFormData>;
  };
  trigger: (fields?: (keyof TFormData)[]) => Promise<boolean>;

  openConfirm: (data: TFormData) => void;
  confirmSubmit: (step: number) => void;
  closeDialog: () => void;
  retryFailedUploads: () => void;

  dialogOpen: boolean;
  dialogStatus: 'idle' | 'loading' | 'success' | 'error' | 'partial_success';

  upload: UploadState<TSlot>;
  pendingData: TFormData | null;
  resetEngine: () => void;
  prepareForNextStep: () => void;

  entityId: string | null;
  setEntityId: (id: string) => void;
}

/**
 * Props pour le composant Metadata
 */
export interface MetadataComponentProps<
  TFormData extends FieldValues,
  TMetaOptions = unknown
> {
  control: Control<TFormData>;
  errors: FieldErrors<TFormData>;
  meta: FormMeta<TMetaOptions>;
}

/**
 * Props pour le composant Files
 */
export interface FilesComponentProps<
  TFormData extends FieldValues,
> {
  control: Control<TFormData>;
  setValue: UseFormSetValue<TFormData>;
  onPreview: (url: string) => void;
  dialogStatus:DialogStatus ;
}

/**
 * Props pour le Sidebar
 */
export interface SidebarProps {
  className?: string;
}

/**
 * Props principales de MediaPage
 */
interface MediaPageProps<
  TFormData extends FieldValues,
  TSlot extends string,
  TMetaOptions = unknown
> {
  useFormHook: () => MediaFormEngineReturn<TFormData, TSlot> & {
    meta: FormMeta<TMetaOptions>;
  };
  MetadataComponent: React.ComponentType<MetadataComponentProps<TFormData, TMetaOptions>>;
  FilesComponent: React.ComponentType<FilesComponentProps<TFormData>>;
  title: string;
  metaFields: (keyof TFormData)[];
  shouldSkipFilesStep?: (data: TFormData) => boolean;
  sidebar?: {
    component?: React.ComponentType<SidebarProps>;
    showDefaultLogo?: boolean;
    defaultLogoUrl?: string;
    defaultLogoAlt?: string;
  };
}

export function MediaPage<
  TFormData extends FieldValues,
  TSlot extends string,
  TMetaOptions = unknown
>({
  useFormHook,
  MetadataComponent,
  FilesComponent,
  title,
  metaFields,
  shouldSkipFilesStep,
  sidebar = {
    showDefaultLogo: true,
    defaultLogoUrl: "/ICONE_SFLIX.png",
    defaultLogoAlt: "SaFlix"
  }
}: MediaPageProps<TFormData, TSlot, TMetaOptions>) {

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
    pendingData,
    prepareForNextStep,
    resetEngine,
    meta,
    retryFailedUploads,
  } = useFormHook();

  const hasFilesToUpload = shouldSkipFilesStep && pendingData
    ? !shouldSkipFilesStep(pendingData as TFormData)
    : true;

  const [currentStep, setCurrentStep] = useState(0);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // ✅ Réinitialiser après un succès d'upload
  useEffect(() => {
    if (dialogStatus === 'success' && currentStep === 1) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        resetEngine();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [dialogStatus, currentStep, resetEngine]);


  const handleStepSubmit = async (data: TFormData) => {
    if (currentStep === 0) {
      const isValid = await trigger(metaFields);
      if (isValid) {
        openConfirm(data);
      }
    } else {
      openConfirm(data);
    }
  };

  const renderSidebar = () => {
    if (sidebar.component) {
      const SidebarComponent = sidebar.component;
      return <SidebarComponent className="lg:col-span-4" />;
    }

    if (sidebar.showDefaultLogo) {
      return (
        <div className="lg:col-span-4">
          <div className="bg-base-200/40 border border-base-300 rounded-xl p-4 h-full flex items-center justify-center overflow-hidden">
            <Image 
              src={sidebar.defaultLogoUrl!} 
              alt={sidebar.defaultLogoAlt!} 
              width={240} 
              height={240} 
              className="object-contain" 
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <FormStepLayout
      title={title}
      currentStep={currentStep}
      totalSteps={2}
      stepLabel={currentStep === 0 ? "Métadonnées" : "Fichiers"}
      isLoading={meta.loading}
      error={meta.error || undefined}
    >
      <form
        onSubmit={handleSubmit(handleStepSubmit)}
        className="bg-neutral px-5 py-6 rounded-2xl shadow border border-base-300 space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {renderSidebar()}

          <div className="lg:col-span-8 space-y-6">
            {currentStep === 0 && (
              <MetadataComponent
                control={control}
                errors={errors}
                meta={meta}
              />
            )}

            {currentStep === 1 && (
              <FilesComponent
                control={control}
                setValue={setValue}
                dialogStatus={dialogStatus}
                onPreview={(url: string) => {
                  setVideoPreview(url);
                  setShowVideoModal(true);
                }}
              />
            )}

            <FormNavigation
              currentStep={currentStep}
              totalSteps={2}
              onPrevious={() => setCurrentStep(0)}
              isSubmitting={dialogStatus === 'loading'}
              isLastStep={currentStep === 1}
              nextLabel="Continuer vers les fichiers"
              finalLabel="Publier"
            />
          </div>
        </div>
      </form>

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
            ? "Confirmer les métadonnées ?"
            : "Confirmer l’upload ?"
        }
        message={
          currentStep === 0
            ? "Les métadonnées seront sauvegardées."
            : "Les fichiers vont être envoyés."
        }
        status={dialogStatus}
        confirmLabel={
          currentStep === 0
            ? "Sauvegarder"
            : "Uploader"
        }
        onCancel={() => {
          closeDialog();
          if (dialogStatus === 'error') resetEngine();
        }}
        onConfirm={() => confirmSubmit(currentStep)}
        upload={upload}
        pendingData={pendingData}
        summary={currentStep === 0 ? 'metadata' : 'files'}
        currentStep={currentStep}
        nextStepLabel={hasFilesToUpload ? undefined : "Terminer"}
        nextStepHint={hasFilesToUpload ? undefined : "La saison a été créée. Cliquez sur Terminer pour fermer."}
        onNextStep={() => {
          if (!hasFilesToUpload) {
            resetEngine();
          } else {
            prepareForNextStep();
            setCurrentStep(1);
          }
        }}
         onRetry={retryFailedUploads} 
      />
    </FormStepLayout>
  );
}