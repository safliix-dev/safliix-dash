'use client';

import React from "react";
import ConfirmationDialog, { DialogStatus } from "@/ui/components/confirmationDialog";
import { UploadState, UploadError } from "@/types/upload";

// --- Interfaces de contraintes ---
interface BaseMetadata {
  title?: string;
  name?: string;
}

interface MediaFileFields {
  mainImage?: File | null;
  movieFile?: File | null;
  trailerFile?: File | null;
  episodeFile?: File | null;
  subtitleFile?: File | null;
}

interface FormConfirmationProps<T, TSlot extends string> {
  open: boolean;
  title: string;
  message: string;
  status: DialogStatus;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onRetry?: () => void;
  upload?: UploadState<TSlot>;
  pendingData?: T | null;
  summary?: 'metadata' | 'files' | 'none';
  // Nouvelles props pour la gestion du flux entre étapes
  currentStep?: number;
  onNextStep?: () => void; 
}

export function FormConfirmation<T extends BaseMetadata & MediaFileFields, TSlot extends string>({
  open,
  title,
  message,
  status,
  confirmLabel = "Confirmer",
  onCancel,
  onConfirm,
  onRetry,
  upload,
  pendingData,
  summary = 'none',
  currentStep = 0,
  onNextStep,
}: FormConfirmationProps<T, TSlot>) {
  
  // 1. Détection des états
  const isUploading = status === "loading" || (!!upload && upload.step !== 'idle' && upload.step !== 'error');
  const isSuccessStep0 = currentStep === 0 && status === "success";
  const hasErrors = !!upload && upload.errors.length > 0;

  // 2. Logique de mutation du bouton principal
  // Si succès à l'étape 0, on transforme le bouton en "Passer à la suite"
  const finalConfirmLabel = isSuccessStep0 ? "Continuer vers les fichiers" : confirmLabel;
  const finalOnConfirm = isSuccessStep0 && onNextStep ? onNextStep : onConfirm;

  return (
    <ConfirmationDialog
      open={open}
      title={isSuccessStep0 ? "Succès !" : title}
      message={isSuccessStep0 ? "Les informations ont été enregistrées avec succès." : message}
      status={status}
      confirmLabel={finalConfirmLabel}
      onConfirm={finalOnConfirm}
      onCancel={onCancel}
      // On peut masquer le bouton annuler quand c'est déjà enregistré
      showCancel={!isSuccessStep0}
    >
      
      {/* --- SECTION A : ÉTAPE 0 RÉUSSIE (Feedback Visuel) --- */}
      {isSuccessStep0 && (
        <div className="mt-4 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl mb-3">
            ✅
          </div>
          <h4 className="text-green-400 font-bold">Enregistrement terminé</h4>
          <p className="text-[11px] text-green-400/60 mt-1">
            Cliquez sur le bouton ci-dessous pour passer à l&apos;upload.
          </p>
        </div>
      )}

      {/* --- SECTION B : PROGRESSION (Upload en cours) --- */}
      {isUploading && upload && (
        <div className="mt-4 p-4 bg-slate-900/40 rounded-xl border border-white/5 space-y-4 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="loading loading-spinner loading-sm text-primary" />
            <div className="flex flex-col">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                {upload.step === "presign" && "Initialisation..."}
                {upload.step === "upload" && `Transfert en cours`}
                {upload.step === "finalize" && "Enregistrement final..."}
              </span>
              {upload.detail && <span className="text-[10px] text-white/40 italic">{upload.detail}</span>}
            </div>
          </div>

          {upload.step === 'upload' && (
            <div className="space-y-1">
               <div className="flex justify-between text-[10px] text-white/40">
                 <span>Progression totale</span>
                 <span>{upload.globalProgress}%</span>
               </div>
               <progress 
                 className="progress progress-primary w-full h-1.5" 
                 value={upload.globalProgress} 
                 max="100" 
               />
            </div>
          )}
        </div>
      )}

      {/* --- SECTION C : ERREURS --- */}
      {!isUploading && (status === "error" || upload?.step === 'error') && (
        <div className="mt-4 space-y-3">
          <div className="text-sm rounded-lg border border-red-600/40 bg-red-950/20 text-red-200 px-3 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium">
              <span>⚠️</span>
              <span>L&apos;opération a échoué.</span>
            </div>
            {hasErrors && (
                <ul className="text-[11px] text-red-300/70 list-disc list-inside ml-5">
                  {upload.errors.map((err: UploadError<TSlot>, idx: number) => (
                    <li key={idx}>{err.key}: {err.error.message}</li>
                  ))}
                </ul>
            )}
          </div>
          
          {onRetry && hasErrors && (
            <button 
              type="button"
              onClick={onRetry}
              className="btn btn-sm btn-outline btn-error w-full normal-case font-bold"
            >
              Réessayer les {upload.errors.length} échec(s)
            </button>
          )}
        </div>
      )}

      {/* --- SECTION D : RÉSUMÉ (Avant action) --- */}
      {!isUploading && !isSuccessStep0 && pendingData && (!upload || upload.step === 'idle') && (
        <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80">
          {summary === 'metadata' && <MetadataSummary data={pendingData} />}
          {summary === 'files' && <FilesSummary data={pendingData} />}
        </div>
      )}
    </ConfirmationDialog>
  );
}

// --- Sous-composants de résumé ---

function MetadataSummary<T extends BaseMetadata>({ data }: { data: T }) {
  const displayTitle = data.title || data.name || "Élément sans nom";
  return (
    <div className="space-y-2">
      <h4 className="font-bold border-b border-white/5 pb-1 text-[11px] uppercase tracking-widest text-white/40">
        Informations
      </h4>
      <div className="flex justify-between py-1">
        <span className="text-white/60">Titre</span>
        <span className="font-medium text-white">{displayTitle}</span>
      </div>
    </div>
  );
}

function FilesSummary<T extends MediaFileFields>({ data }: { data: T }) {
  const files = [
    { label: 'Image', icon: '🖼️', file: data.mainImage },
    { label: 'Film', icon: '🎬', file: data.movieFile },
    { label: 'Bande annonce', icon: '🎥', file: data.trailerFile },
    { label: 'Série/Épisode', icon: '📺', file: data.episodeFile },
    { label: 'Sous-titres', icon: '📝', file: data.subtitleFile },
  ].filter((f): f is { label: string; icon: string; file: File } => f.file instanceof File);

  return (
    <div className="space-y-2">
      <p className="font-bold border-b border-white/5 pb-1 text-[11px] uppercase tracking-widest text-white/40">
        Fichiers à envoyer
      </p>
      {files.length > 0 ? (
        <ul className="space-y-2 mt-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between text-xs p-2 bg-black/20 rounded-lg border border-white/5">
              <span className="flex items-center gap-2"><span>{f.icon}</span> {f.label}</span>
              <span className="text-white/30 truncate max-w-[150px] italic">{f.file.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-white/30 italic text-center py-2">Aucun fichier sélectionné</p>
      )}
    </div>
  );
}