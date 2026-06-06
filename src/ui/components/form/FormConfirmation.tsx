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
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onRetry?: () => void;
  upload?: UploadState<TSlot>;
  pendingData?: T | null;
  summary?: 'metadata' | 'files' | 'none';
  currentStep?: number;
  onNextStep?: () => void;
  nextStepLabel?: string;
  nextStepHint?: string;
  showCancelConfirm?: boolean;
  onConfirmCancel?: () => void;
  onCancelCancel?: () => void;
  fieldResolvers?: Record<string, Record<string, string>>;
}

export function FormConfirmation<T extends BaseMetadata & MediaFileFields, TSlot extends string>({
  open,
  title,
  message,
  status,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onCancel,
  onConfirm,
  onRetry,
  upload,
  pendingData,
  summary = 'none',
  currentStep = 0,
  onNextStep,
  nextStepLabel,
  nextStepHint,
  showCancelConfirm = false,
  onConfirmCancel,
  onCancelCancel,
  fieldResolvers,
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
  const finalConfirmLabel = isSuccessStep0 ? (nextStepLabel ?? "Continuer vers les fichiers") : confirmLabel;
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
    dialogMessage = upload?.failedKeys?.length > 0 
      ? "Certains fichiers n'ont pas pu être transférés."
      : "Tous les fichiers ont été transférés avec succès.";
  }

  return (
    <>
      {/* Dialog principal */}
      <ConfirmationDialog
        open={open && !showCancelConfirm}
        title={dialogTitle}
        message={dialogMessage}
        status={status}
        confirmLabel={finalConfirmLabel}
        cancelLabel={isUploadInProgress ? "Annuler l'upload" : cancelLabel}
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
              {nextStepHint ?? "Cliquez sur le bouton ci-dessous pour passer à l'upload."}
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

        {/* SECTION : UPLOAD TERMINÉ (succès total ou partiel) */}
        {isUploadComplete && upload && (
          <div className="mt-4 p-4 rounded-2xl">
            {upload.failedKeys?.length > 0 ? (
              // Succès partiel avec échecs
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <div className="font-bold text-yellow-400">
                      Transfert partiel
                    </div>
                    <div className="text-xs text-yellow-400/60">
                      {upload.successfulKeys?.length || 0} fichiers réussis, {upload.failedKeys.length} échecs
                    </div>
                  </div>
                </div>
                
                {/* Détail des fichiers échoués */}
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-bold text-yellow-400/80 uppercase tracking-wider">
                    Fichiers échoués :
                  </p>
                  <ul className="text-[11px] text-yellow-300/70 list-disc list-inside space-y-1">
                    {upload.failedKeys.map((key, idx) => {
                      const error = upload.errors?.find(e => e.key === key);
                      const failedStage = upload.failedAtStage?.get(key);
                      return (
                        <li key={idx} className="font-mono">
                          {String(key)}
                          {failedStage && (
                            <span className="text-yellow-500/50 ml-2">
                              (échec {failedStage === 'presign' ? 'préparation' : 'transfert'})
                            </span>
                          )}
                          {error && (
                            <span className="text-red-400/50 block ml-4 text-[10px]">
                              {error.error.message}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {onRetry && (
                  <button 
                    type="button"
                    onClick={onRetry}
                    className="btn btn-sm btn-warning w-full mt-4 normal-case font-bold"
                  >
                    🔄 Réessayer ({upload.failedKeys.length} fichier{upload.failedKeys.length > 1 ? 's' : ''})
                  </button>
                )}
              </div>
            ) : (
              // Succès total
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <div className="font-bold text-green-400">Upload réussi !</div>
                    <div className="text-xs text-green-400/60">
                      100% des fichiers transférés avec succès
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION : ERREURS (hors upload) */}
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
                      <span className="font-mono">{String(err.key)}</span>: {err.error.message}
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
            {summary === 'metadata' && <MetadataSummary data={pendingData} fieldResolvers={fieldResolvers} />}
            {summary === 'files' && <FilesSummary data={pendingData} />}
          </div>
        )}
      </ConfirmationDialog>

      {/* Dialog de confirmation d'annulation */}
      {showCancelConfirm && (
        <ConfirmationDialog
          open={showCancelConfirm}
          title="Annuler l'upload ?"
          message="Vous allez perdre la progression actuelle. Voulez-vous vraiment annuler ?"
          confirmLabel="Oui, annuler"
          cancelLabel="Non, continuer"
          onConfirm={onConfirmCancel || (() => {})}
          onCancel={onCancelCancel || (() => {})}
        />
      )}
    </>
  );
}

// --- Sous-composants de résumé ---

function MetadataSummary<T extends BaseMetadata>({ data, fieldResolvers }: { data: T; fieldResolvers?: Record<string, Record<string, string>> }) {
  // Exclure les champs techniques ou trop volumineux
  const excludeKeys = ['__typename', 'id', 'createdAt', 'updatedAt'];
  
  // Filtrer les clés à afficher
  const entries = Object.entries(data || {})
    .filter(([key, value]) => {
      // Exclure les clés techniques
      if (excludeKeys.includes(key)) return false;
      // Exclure les valeurs vides
      if (value === undefined || value === null) return false;
      if (typeof value === 'string' && value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      // Exclure les fichiers
      if (value instanceof File) return false;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Pour les objets, on vérifie si c'est un File
        if ('name' in value && 'size' in value) return false;
      }
      return true;
    });

  if (entries.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="font-bold border-b border-white/5 pb-1 text-[11px] uppercase tracking-widest text-white/40">
          Informations
        </h4>
        <p className="text-xs text-white/40 italic text-center py-2">Aucune information à afficher</p>
      </div>
    );
  }

  // Fonction pour formater la valeur selon son type
  const formatValue = (value: unknown, depth: number = 0): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') {
      if (value.length > 100) return value.substring(0, 100) + '...';
      return value;
    }
    
    // Gestion des tableaux
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      if (value.length === 1) return formatValue(value[0], depth + 1);
      if (value.length <= 3) {
        return value.map(v => formatValue(v, depth + 1)).join(', ');
      }
      return `${value.slice(0, 3).map(v => formatValue(v, depth + 1)).join(', ')} (+${value.length - 3})`;
    }
    
    // Gestion des objets
    if (typeof value === 'object') {
      // Cas particulier: objet avec propriété name (comme pour les acteurs)
      if ('name' in value && typeof value.name === 'string') {
        return value.name;
      }
      // Cas particulier: objet avec propriété label
      if ('label' in value && typeof value.label === 'string') {
        return value.label;
      }
      // Cas particulier: objet avec propriété title
      if ('title' in value && typeof value.title === 'string') {
        return value.title;
      }
      // Cas particulier: objet avec propriété firstName et lastName
      if ('firstName' in value && 'lastName' in value) {
        return `${value.firstName} ${value.lastName}`;
      }
      
      // Pour les objets génériques, afficher les propriétés principales
      const objEntries = Object.entries(value)
        .filter(([k, v]) => !excludeKeys.includes(k) && v !== undefined && v !== null && v !== '');
      
      if (objEntries.length === 0) return '{ }';
      if (objEntries.length === 1) {
        const [objKey, objValue] = objEntries[0];
        return `${objKey}: ${formatValue(objValue, depth + 1)}`;
      }
      if (objEntries.length <= 3) {
        return objEntries.map(([k, v]) => `${k}: ${formatValue(v, depth + 1)}`).join(', ');
      }
      return `${objEntries.slice(0, 3).map(([k, v]) => `${k}: ${formatValue(v, depth + 1)}`).join(', ')} (+${objEntries.length - 3})`;
    }
    
    return String(value);
  };

  // Traduire les clés en français
  const translateKey = (key: string): string => {
    const translations: Record<string, string> = {
      title: 'Titre',
      name: 'Nom',
      productionHouse: 'Maison de Production',
      country: 'Pays',
      type: 'Type',
      price: 'Prix',
      releaseDate: 'Date de sortie',
      publishDate: 'Date de publication',
      format: 'Format',
      category: 'Catégorie',
      genre: 'Genre',
      director: 'Directeur',
      duration: 'Durée',
      language: 'Langue',
      ageRating: 'Classification',
      description: 'Synopsis',
      actors: 'Acteurs',
      blockCountries: 'Pays bloqués',
      rightHolderId: 'Ayant droit',
      entertainmentMode: 'Type de programme',
      isSafliixProd: 'Production SaFlix',
      haveSubtitles: 'Sous-titres',
      subtitleLanguages: 'Langues sous-titres',
      movieFile: 'Fichier film',
      trailerFile: 'Bande-annonce',
      mainImage: 'Image principale',
      secondaryImage: 'Image secondaire',
    };
    return translations[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };

  return (
    <div className="space-y-2">
      <h4 className="font-bold border-b border-white/5 pb-1 text-[11px] uppercase tracking-widest text-white/40">
        Informations ({entries.length} champs)
      </h4>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {entries.map(([key, value]) => {
          const resolved = fieldResolvers?.[key]?.[String(value)];
          const display = resolved ?? formatValue(value);
          return (
            <div key={key} className="flex justify-between py-1 text-xs border-b border-white/5 last:border-0">
              <span className="text-white/50">{translateKey(key)}</span>
              <span className="font-medium text-white/80 text-right max-w-[60%] truncate" title={display}>
                {display}
              </span>
            </div>
          );
        })}
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