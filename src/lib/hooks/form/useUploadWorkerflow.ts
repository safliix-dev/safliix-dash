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

  const globalProgress = Object.keys(progress).length > 0
    ? Math.round(Object.values(progress).reduce((a, b) => a + b, 0) / Object.keys(progress).length)
    : 0;

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
        if (attempt === maxRetries) break;
        const shouldRetry = retryConfig?.retryCondition ? retryConfig.retryCondition(lastError, key as string) : true;
        if (!shouldRetry) break;
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
    
    const uniqueKeys = new Set(files.map(f => f.key));
    if (uniqueKeys.size !== files.length) throw new Error("Les clés des fichiers doivent être uniques");

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const filesToProcess = options.retryKeys && options.retryKeys.length > 0
      ? files.filter(f => options.retryKeys!.includes(f.key))
      : files;

    if (!options.retryKeys) {
      setFailedKeys([]);
      setSuccessfulKeys([]);
      setFailedAtStage(new Map());
    }

    const filesWithExistingSlots = options.existingSlots 
      ? filesToProcess.filter(f => options.existingSlots!.some(slot => slot.key === f.key))
      : [];
    
    const filesNeedingPresign = filesToProcess.filter(
      f => !filesWithExistingSlots.some(existing => existing.key === f.key)
    );

    let allSlots: PresignedSlot<TSlot>[] = options.existingSlots || [];

    const totalBytes = filesToProcess.reduce((acc, f) => acc + f.file.size, 0);
    setStats(prev => ({ ...prev, totalFiles: filesToProcess.length, totalBytes, startTime: Date.now() }));

    if (filesToProcess.length === 0) {
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
          allSlots = [...allSlots, ...newSlots];
        } catch (presignError) {
          filesNeedingPresign.forEach(file => {
            setFailedAtStage(prev => new Map(prev).set(file.key, 'presign'));
            setFailedKeys(prev => [...prev, file.key]);
          });
          throw presignError;
        }
      }

      // 2. UPLOAD
      setStep("upload");
      
      const uploadTask = async (slot: PresignedSlot<TSlot>): Promise<PresignedSlot<TSlot> | { key: TSlot; error: Error }> => {
        const fileDesc = filesToProcess.find((f) => f.key === slot.key);
        if (!fileDesc) return { key: slot.key, error: new Error("Fichier introuvable") };

        try {
          await attemptWithRetry(slot.key, async (signal) => {
            let uploadPromise = handlers.uploadToUrl(slot.uploadUrl, fileDesc.file, (p) => {
              setProgress(prev => ({ ...prev, [slot.key]: p }));
              const fileBytes = (p / 100) * fileDesc.file.size;
              updateSpeed(fileBytes);
            }, signal);

            if (handlers.timeouts?.upload) {
              uploadPromise = withTimeout(uploadPromise, handlers.timeouts.upload, `Timeout upload ${String(slot.key)}`);
            }
            await uploadPromise;
          }, options.retryConfig);

          return slot;
        } catch (err) {
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

      const smallResults = await Promise.all(smallSlots.map(uploadTask));

      const largeResults = [];
      for (const slot of largeSlots) {
        if (signal.aborted) break;
        largeResults.push(await uploadTask(slot));
      }

      const results = [...smallResults, ...largeResults];

      const successful = results.filter((r): r is PresignedSlot<TSlot> => 'finalUrl' in r);
      const failed = results.filter((r): r is { key: TSlot; error: Error } => 'error' in r);

      const successfulKeysFromResults = successful.map(s => s.key);
      const failedKeysFromResults = failed.map(f => f.key);

      setSuccessfulKeys(successfulKeysFromResults);
      setFailedKeys(failedKeysFromResults);
      setErrors(prev => {
        const filteredPrev = prev.filter(p => !filesToProcess.some(f => f.key === p.key));
        return [...filteredPrev, ...failed];
      });

      if (successful.length === 0 && failed.length > 0 && !signal.aborted) {
        throw new Error("Aucun fichier n'a pu être transféré.");
      }

      // 3. FINALIZE
      if (successful.length > 0 && !signal.aborted) {
        setStep("finalize");
        setDetail("Finalisation de l'enregistrement...");
        
        let finalizePromise = handlers.finalize(successful);
        if (handlers.timeouts?.finalize) {
          finalizePromise = withTimeout(finalizePromise, handlers.timeouts.finalize, "Timeout finalisation");
        }
        await finalizePromise;
      }

      const endTime = Date.now();
      if (signal.aborted) {
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

      setStep(failed.length > 0 ? "partial_success" : "done");
      
      return { 
        successful, 
        failed, 
        cancelled: false, 
        failedKeys: failedKeysFromResults,
        successfulKeys: successfulKeysFromResults,
        stats: { ...stats, endTime } 
      };

    } catch (e) {
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