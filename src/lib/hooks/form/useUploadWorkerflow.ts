'use client';

import { useState, useCallback, useRef } from "react";
import { 
  UploadFileDescriptor, 
  PresignedSlot, 
  UploadResult, 
  UploadStats, 
  RetryConfig, 
  UploadWorkflowConfig,
  UploadStep,
  UploadProgress 
} from "@/types/upload";

// Fonction utilitaire pour ajouter un timeout à une promesse
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutHandle));
};

export function useUploadWorkflow<TSlot extends string>() {
  const [step, setStep] = useState<UploadStep>("idle");
  const [detail, setDetail] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({});
  const [errors, setErrors] = useState<{ key: TSlot; error: Error }[]>([]);
  const [failedKeys, setFailedKeys] = useState<TSlot[]>([]);
  const [successfulKeys, setSuccessfulKeys] = useState<TSlot[]>([]);
  const [failedAtStage, setFailedAtStage] = useState<Map<TSlot, 'presign' | 'upload'>>(new Map());
  const [stats, setStats] = useState<UploadStats>({
    totalFiles: 0,
    totalBytes: 0,
    uploadedBytes: 0,
    speed: 0,
    timeRemaining: 0,
    startTime: 0
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const speedTrackingRef = useRef<{
    lastBytes: number;
    lastTime: number;
    speeds: number[];
  }>({
    lastBytes: 0,
    lastTime: Date.now(),
    speeds: []
  });
  const fileSizesRef = useRef<Map<string, number>>(new Map());
  const uploadedBytesPerFileRef = useRef<Map<string, number>>(new Map());

  const globalProgress = (() => {
    const totalBytes = Array.from(fileSizesRef.current.values()).reduce((a, b) => a + b, 0);
    if (totalBytes === 0 || Object.keys(progress).length === 0) return 0;
    const weighted = Object.entries(progress).reduce((acc, [key, p]) => {
      return acc + (p / 100) * (fileSizesRef.current.get(key) ?? 0);
    }, 0);
    return Math.round((weighted / totalBytes) * 100);
  })();

  const reset = useCallback(() => {
    setStep("idle");
    setDetail(null);
    setProgress({});
    setErrors([]);
    setFailedKeys([]);
    setSuccessfulKeys([]);
    setFailedAtStage(new Map());
    setStats({
      totalFiles: 0,
      totalBytes: 0,
      uploadedBytes: 0,
      speed: 0,
      timeRemaining: 0,
      startTime: 0
    });
    abortControllerRef.current = null;
    speedTrackingRef.current = {
      lastBytes: 0,
      lastTime: Date.now(),
      speeds: []
    };
    fileSizesRef.current = new Map();
    uploadedBytesPerFileRef.current = new Map();
  }, []);

  const hasFailures = useCallback((): boolean => {
    return failedKeys.length > 0;
  }, [failedKeys]);

  const cancel = useCallback(async (onRollback?: () => Promise<void>) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStep("idle");
    setDetail("Opération annulée par l'utilisateur.");
    
    if (onRollback) {
      try {
        setDetail("Annulation en cours et nettoyage...");
        await onRollback();
      } catch (e) {
        console.error("Erreur lors du rollback:", e);
      }
    }
    reset();
  }, [reset]);

  const updateSpeed = useCallback((uploadedBytes: number) => {
    const now = Date.now();
    const timeDiff = (now - speedTrackingRef.current.lastTime) / 1000;
    const bytesDiff = uploadedBytes - speedTrackingRef.current.lastBytes;
    
    if (timeDiff > 0.5) {
      const currentSpeed = bytesDiff / timeDiff;
      speedTrackingRef.current.speeds.push(currentSpeed);
      if (speedTrackingRef.current.speeds.length > 5) speedTrackingRef.current.speeds.shift();
      
      const avgSpeed = speedTrackingRef.current.speeds.reduce((a, b) => a + b, 0) / 
                       speedTrackingRef.current.speeds.length;
      
      const remainingBytes = stats.totalBytes - uploadedBytes;
      const timeRemaining = avgSpeed > 0 ? remainingBytes / avgSpeed : 0;
      
      setStats(prev => ({
        ...prev,
        uploadedBytes,
        speed: Math.round(avgSpeed),
        timeRemaining: Math.round(timeRemaining * 10) / 10
      }));
      
      speedTrackingRef.current.lastBytes = uploadedBytes;
      speedTrackingRef.current.lastTime = now;
    }
  }, [stats.totalBytes]);

  const attemptWithRetry = async <T,>(
    key: TSlot,
    attemptFn: (signal: AbortSignal) => Promise<T>,
    retryConfig?: RetryConfig
  ): Promise<T> => {
    const maxRetries = retryConfig?.maxRetries ?? 0;
    const retryDelay = retryConfig?.retryDelay ?? 1000;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (abortControllerRef.current?.signal.aborted) throw new Error("Opération annulée");
        return await attemptFn(abortControllerRef.current!.signal);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`[useUploadWorkflow] Tentative ${attempt + 1}/${maxRetries + 1} pour ${String(key)} a échoué:`, lastError.message);
        if (attempt === maxRetries) break;
        const shouldRetry = retryConfig?.retryCondition ? retryConfig.retryCondition(lastError, key as string) : true;
        if (!shouldRetry) {
          console.log(`[useUploadWorkflow] Pas de nouvelle tentative pour ${String(key)} (condition non remplie)`);
          break;
        }
        setDetail(`Nouvelle tentative pour ${String(key)} (${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    throw lastError!;
  };

  const runUpload = async (
    files: UploadFileDescriptor<TSlot>[],
    handlers: UploadWorkflowConfig<TSlot>,
    options: { 
      parallel?: boolean; 
      retryKeys?: TSlot[];
      retryConfig?: RetryConfig;
      existingSlots?: PresignedSlot<TSlot>[];
    } = {}
  ): Promise<UploadResult<TSlot>> => {
    
    console.log('[useUploadWorkflow] 🚀 runUpload démarré', {
      filesCount: files.length,
      fileKeys: files.map(f => f.key),
      retryKeys: options.retryKeys,
      hasExistingSlots: !!options.existingSlots,
      existingSlotsCount: options.existingSlots?.length || 0
    });

    const uniqueKeys = new Set(files.map(f => f.key));
    if (uniqueKeys.size !== files.length) throw new Error("Les clés des fichiers doivent être uniques");

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const filesToProcess = options.retryKeys && options.retryKeys.length > 0
      ? files.filter(f => options.retryKeys!.includes(f.key))
      : files;

    console.log('[useUploadWorkflow] 📁 filesToProcess:', {
      count: filesToProcess.length,
      keys: filesToProcess.map(f => f.key),
      sizes: filesToProcess.map(f => f.file.size)
    });

    if (!options.retryKeys) {
      setFailedKeys([]);
      setSuccessfulKeys([]);
      setFailedAtStage(new Map());
      fileSizesRef.current = new Map(filesToProcess.map(f => [f.key, f.file.size]));
      uploadedBytesPerFileRef.current = new Map();
    }

    const filesWithExistingSlots = options.existingSlots 
      ? filesToProcess.filter(f => options.existingSlots!.some(slot => slot.key === f.key))
      : [];
    
    const filesNeedingPresign = filesToProcess.filter(
      f => !filesWithExistingSlots.some(existing => existing.key === f.key)
    );

    console.log('[useUploadWorkflow] 📋 Répartition des slots:', {
      filesWithExistingSlots: filesWithExistingSlots.map(f => f.key),
      filesNeedingPresign: filesNeedingPresign.map(f => f.key)
    });

    let allSlots: PresignedSlot<TSlot>[] = options.existingSlots || [];

    const totalBytes = filesToProcess.reduce((acc, f) => acc + f.file.size, 0);
    setStats(prev => ({ ...prev, totalFiles: filesToProcess.length, totalBytes, startTime: Date.now() }));

    if (filesToProcess.length === 0) {
      console.log('[useUploadWorkflow] ⚠️ Aucun fichier à traiter');
      return { 
        successful: [], 
        failed: [], 
        cancelled: false, 
        failedKeys: [], 
        successfulKeys: [], 
        stats: { ...stats, endTime: Date.now() } 
      };
    }

    try {
      // 1. PRESIGN
      if (filesNeedingPresign.length > 0) {
        console.log('[useUploadWorkflow] 🔑 Début PRESIGN pour:', filesNeedingPresign.map(f => f.key));
        setStep("presign");
        setDetail(`Préparation des accès pour ${filesNeedingPresign.length} fichier(s)...`);
        setProgress(prev => ({
          ...prev,
          ...filesNeedingPresign.reduce((acc, f) => ({ ...acc, [f.key]: 0 }), {})
        }));

        let presignPromise = handlers.presign(filesNeedingPresign);
        if (handlers.timeouts?.presign) {
          presignPromise = withTimeout(presignPromise, handlers.timeouts.presign, "Timeout Presign");
        }
        
        try {
          const newSlots = await presignPromise;
          console.log('[useUploadWorkflow] ✅ PRESIGN réussi, nouveaux slots:', newSlots.map(s => s.key));
          allSlots = [...allSlots, ...newSlots];
        } catch (presignError) {
          console.error('[useUploadWorkflow] ❌ PRESIGN échoué:', presignError);
          filesNeedingPresign.forEach(file => {
            setFailedAtStage(prev => new Map(prev).set(file.key, 'presign'));
            setFailedKeys(prev => [...prev, file.key]);
          });
          throw presignError;
        }
      } else {
        console.log('[useUploadWorkflow] 🔑 Pas de PRESIGN nécessaire (tous les slots existent déjà)');
      }

      console.log('[useUploadWorkflow] 📦 allSlots après presign:', allSlots.map(s => s.key));

      // 2. UPLOAD
      setStep("upload");
      
      const uploadTask = async (slot: PresignedSlot<TSlot>): Promise<PresignedSlot<TSlot> | { key: TSlot; error: Error }> => {
        console.log(`[useUploadWorkflow] 📤 Début upload pour ${slot.key}`);
        const fileDesc = filesToProcess.find((f) => f.key === slot.key);
        if (!fileDesc) {
          console.error(`[useUploadWorkflow] ❌ Fichier introuvable pour ${slot.key}`);
          return { key: slot.key, error: new Error("Fichier introuvable") };
        }

        try {
          await attemptWithRetry(slot.key, async (signal) => {
            console.log(`[useUploadWorkflow] ⬆️ Uploading ${slot.key} (${fileDesc.file.size} bytes) to ${slot.uploadUrl.substring(0, 50)}...`);
            let uploadPromise = handlers.uploadToUrl(slot.uploadUrl, fileDesc.file, (p) => {
              setProgress(prev => ({ ...prev, [slot.key]: p }));
              uploadedBytesPerFileRef.current.set(slot.key, (p / 100) * fileDesc.file.size);
              const totalUploaded = Array.from(uploadedBytesPerFileRef.current.values()).reduce((a, b) => a + b, 0);
              updateSpeed(totalUploaded);
            }, signal);

            if (handlers.timeouts?.upload) {
              uploadPromise = withTimeout(uploadPromise, handlers.timeouts.upload, `Timeout upload ${String(slot.key)}`);
            }
            await uploadPromise;
            console.log(`[useUploadWorkflow] ✅ Upload terminé pour ${slot.key}`);
          }, options.retryConfig);

          return slot;
        } catch (err) {
          console.error(`[useUploadWorkflow] ❌ Upload échoué pour ${slot.key}:`, err);
          setFailedAtStage(prev => new Map(prev).set(slot.key, 'upload'));
          setFailedKeys(prev => [...prev, slot.key]);
          return { key: slot.key, error: err instanceof Error ? err : new Error("Erreur upload") };
        }
      };

      setDetail(options.parallel ? "Transfert simultané..." : "Transfert un par un...");
      
      const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024;

      const smallSlots = allSlots.filter(s => {
        const f = filesToProcess.find(f => f.key === s.key);
        return f && f.file.size < LARGE_FILE_THRESHOLD;
      });

      const largeSlots = allSlots.filter(s => {
        const f = filesToProcess.find(f => f.key === s.key);
        return f && f.file.size >= LARGE_FILE_THRESHOLD;
      });

      console.log('[useUploadWorkflow] 📊 Répartition des uploads:', {
        smallSlots: smallSlots.map(s => s.key),
        largeSlots: largeSlots.map(s => s.key),
        parallel: options.parallel
      });

      const smallResults = await Promise.all(smallSlots.map(uploadTask));

      const largeResults = [];
      for (const slot of largeSlots) {
        if (signal.aborted) break;
        largeResults.push(await uploadTask(slot));
      }

      const results = [...smallResults, ...largeResults];

      const successful = results.filter((r): r is PresignedSlot<TSlot> => 'finalUrl' in r);
      const failed = results.filter((r): r is { key: TSlot; error: Error } => 'error' in r);

      console.log('[useUploadWorkflow] 📊 Résultats des uploads:', {
        successful: successful.map(s => s.key),
        failed: failed.map(f => f.key),
        total: results.length
      });

      const successfulKeysFromResults = successful.map(s => s.key);
      const failedKeysFromResults = failed.map(f => f.key);

      setSuccessfulKeys(successfulKeysFromResults);
      setFailedKeys(failedKeysFromResults);
      setErrors(prev => {
        const filteredPrev = prev.filter(p => !filesToProcess.some(f => f.key === p.key));
        return [...filteredPrev, ...failed];
      });

      if (successful.length === 0 && failed.length > 0 && !signal.aborted) {
        console.error('[useUploadWorkflow] ❌ Aucun fichier uploadé avec succès');
        throw new Error("Aucun fichier n'a pu être transféré.");
      }

      // 3. FINALIZE
      console.log('[useUploadWorkflow] 🔍 Vérification condition FINALIZE:', {
        successfulLength: successful.length,
        signalAborted: signal.aborted,
        willFinalize: successful.length > 0 && !signal.aborted
      });

      if (successful.length > 0 && !signal.aborted) {
        console.log('[useUploadWorkflow] 🎯 Début FINALIZE pour:', successful.map(s => s.key));
        setStep("finalize");
        setDetail("Finalisation de l'enregistrement...");
        
        try {
          let finalizePromise = handlers.finalize(successful);
          if (handlers.timeouts?.finalize) {
            finalizePromise = withTimeout(finalizePromise, handlers.timeouts.finalize, "Timeout finalisation");
          }
          await finalizePromise;
          console.log('[useUploadWorkflow] ✅ FINALIZE réussi');
        } catch (finalizeError) {
          console.error('[useUploadWorkflow] ❌ FINALIZE échoué:', finalizeError);
          throw finalizeError;
        }
      } else {
        console.log('[useUploadWorkflow] ⚠️ FINALIZE NON DÉCLENCHÉ car:', {
          reason: !successful.length ? 'successful est vide' : 'signal aborted',
          successfulLength: successful.length,
          signalAborted: signal.aborted
        });
      }

      const endTime = Date.now();
      if (signal.aborted) {
        console.log('[useUploadWorkflow] 🛑 Opération annulée');
        setStep("idle");
        return { 
          successful: [], 
          failed: [], 
          cancelled: true, 
          failedKeys: [], 
          successfulKeys: [], 
          stats: { ...stats, endTime } 
        };
      }

      const finalStep = failed.length > 0 ? "partial_success" : "done";
      console.log(`[useUploadWorkflow] 🏁 Terminé avec statut: ${finalStep}`, {
        successful: successful.length,
        failed: failed.length
      });
      setStep(finalStep);
      
      return { 
        successful, 
        failed, 
        cancelled: false, 
        failedKeys: failedKeysFromResults,
        successfulKeys: successfulKeysFromResults,
        stats: { ...stats, endTime } 
      };

    } catch (e) {
      console.error('[useUploadWorkflow] 💥 Erreur fatale:', e);
      const endTime = Date.now();
      setStep("error");
      setDetail(e instanceof Error ? e.message : "Erreur fatale");
      
      const allFailedKeys = filesToProcess.map(f => f.key);
      return { 
        successful: [], 
        failed: filesToProcess.map(f => ({ key: f.key, error: e as Error })), 
        cancelled: false, 
        failedKeys: allFailedKeys,
        successfulKeys: [],
        stats: { ...stats, endTime } 
      };
    }
  };

  return { 
    step, 
    detail, 
    progress, 
    globalProgress, 
    errors, 
    stats, 
    failedKeys,      
    successfulKeys,   
    hasFailures,
    failedAtStage,     
    runUpload, 
    cancel, 
    reset 
  };
}