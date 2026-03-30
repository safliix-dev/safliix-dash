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
  const isUploading = !!upload && 
    ["presign", "upload", "finalize", "done", "partial_success"].includes(upload.step);
  
  const isUploadInProgress = isUploading && 
    upload?.step !== 'done' && 
    upload?.step !== 'partial_success';
  
  const isUploadComplete = upload?.step === 'done' || upload?.step === 'partial_success';
  const isSuccessStep0 = currentStep === 0 && status === "success";
  const hasErrors = !!upload?.errors && upload.errors.length > 0;
  const shouldShowSummary = !isUploading && !isSuccessStep0 && pendingData && (!upload || upload.step === 'idle');

  // 2. Logique de mutation du bouton principal
  const finalConfirmLabel = isSuccessStep0 ? "Continuer vers les fichiers" : confirmLabel;
  const finalOnConfirm = isSuccessStep0 && onNextStep ? onNextStep : onConfirm;
  
  // 3. Titre et message dynamiques
  let dialogTitle = title;
  let dialogMessage = message;
  
  if (isSuccessStep0) {
    dialogTitle = "Succès !";
    dialogMessage = "Les informations ont été enregistrées avec succès.";
  } else if (isUploadInProgress) {
    dialogTitle = "Upload en cours";
    dialogMessage = "Veuillez patienter pendant le transfert des fichiers...";
  } else if (isUploadComplete) {
    dialogTitle = "Upload terminé !";
    dialogMessage = "Tous les fichiers ont été transférés avec succès.";
  }

  // Debug log
  console.log("FormConfirmation render:", {
    step: upload?.step,
    progress: upload?.globalProgress,
    status,
    isUploading,
    isUploadInProgress,
    isUploadComplete,
    hasErrors,
    open
  });

  return (
    <ConfirmationDialog
      open={open}
      title={dialogTitle}
      message={dialogMessage}
      status={status}
      confirmLabel={finalConfirmLabel}
      onConfirm={finalOnConfirm}
      onCancel={onCancel}
    >
      {/* SECTION : ÉTAPE 0 RÉUSSIE */}
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

      {/* SECTION : UPLOAD EN COURS */}
      {isUploadInProgress && upload && (
        <div className="mt-4 p-5 bg-slate-900/60 rounded-2xl border border-white/10 space-y-5 shadow-2xl backdrop-blur-sm">
          
          {/* En-tête avec spinner et progression */}
          <div className="flex items-start gap-4">
            <div className="relative flex items-center justify-center">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
            
            <div className="flex flex-col flex-1 min-w-0">
              <div className="font-black text-white text-xs uppercase tracking-widest">
                {upload.step === "presign" && "🔑 Initialisation sécurisée"}
                {upload.step === "upload" && "🚀 Transfert des médias"}
                {upload.step === "finalize" && "💾 Enregistrement final"}
              </div>
              
              {upload.detail && (
                <span className="text-[11px] text-primary/80 font-medium truncate mt-0.5">
                  {upload.detail}
                </span>
              )}
            </div>
            
            <div className="bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
              <span className="text-primary font-mono font-bold text-xs">
                {upload.globalProgress || 0}%
              </span>
            </div>
          </div>

          {/* Barre de progression globale */}
          <div className="space-y-2">
            <progress 
              className="progress progress-primary w-full h-2.5 shadow-[0_0_10px_rgba(var(--p),0.2)] transition-all duration-300" 
              value={upload.globalProgress || 0} 
              max="100" 
            />
            
            {/* Progression détaillée par slot */}
            {upload.progress && Object.keys(upload.progress).length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {Object.entries(upload.progress).map(([slot, value]) => (
                  <div key={slot} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] uppercase tracking-tighter text-white/30">
                      <span className="truncate max-w-[60px]">{slot}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary/40 h-full transition-all duration-500" 
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Indicateur de finalisation */}
          {upload.step === "finalize" && (
            <div className="text-center py-1 bg-white/5 rounded-lg border border-white/5">
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest animate-pulse">
                Traitement serveur en cours...
              </span>
            </div>
          )}
        </div>
      )}

      {/* SECTION : UPLOAD TERMINÉ */}
      {isUploadComplete && upload && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-bold text-green-400">
                {upload.globalProgress === 100 ? 'Upload réussi !' : 'Transfert partiel effectué'}
              </div>
              <div className="text-xs text-green-400/60">
                {upload.globalProgress === 100 
                  ? '100% des fichiers transférés avec succès'
                  : `${upload.globalProgress || 0}% des fichiers transférés`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION : ERREURS */}
      {(status === "error" || hasErrors) && !isUploadInProgress && !isUploadComplete && (
        <div className="mt-4 space-y-3">
          <div className="text-sm rounded-lg border border-red-600/40 bg-red-950/20 text-red-200 px-3 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium">
              <span>⚠️</span>
              <span>L&apos;opération a échoué.</span>
            </div>
            {hasErrors && upload?.errors && (
              <ul className="text-[11px] text-red-300/70 list-disc list-inside ml-5 space-y-1">
                {upload.errors.map((err: UploadError<TSlot>, idx: number) => (
                  <li key={idx}>
                    <span className="font-mono">{err.key}</span>: {err.error.message}
                  </li>
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
              Réessayer ({upload.errors.length} échec{upload.errors.length > 1 ? 's' : ''})
            </button>
          )}
        </div>
      )}

      {/* SECTION : RÉSUMÉ */}
      {shouldShowSummary && (
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

  if (files.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-white/30 italic">Aucun fichier sélectionné</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-bold border-b border-white/5 pb-1 text-[11px] uppercase tracking-widest text-white/40">
        Fichiers à envoyer ({files.length})
      </p>
      <ul className="space-y-2 mt-2">
        {files.map((f, i) => (
          <li key={i} className="flex items-center justify-between text-xs p-2 bg-black/20 rounded-lg border border-white/5">
            <span className="flex items-center gap-2">
              <span>{f.icon}</span>
              <span className="text-white/80">{f.label}</span>
            </span>
            <span className="text-white/30 truncate max-w-[150px] font-mono text-[10px]">
              {f.file.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}