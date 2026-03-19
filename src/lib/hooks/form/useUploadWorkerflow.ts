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
  const [stats, setStats] = useState<UploadStats>({
    totalFiles: 0,
    totalBytes: 0,
    uploadedBytes: 0,
    speed: 0,
    timeRemaining: 0,
    startTime: 0
  });
  
  // Ref pour l'AbortController et les stats de vitesse
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

  // Fonction d'annulation
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

  // Fonction de mise à jour des statistiques de vitesse
  const updateSpeed = useCallback((uploadedBytes: number) => {
    const now = Date.now();
    const timeDiff = (now - speedTrackingRef.current.lastTime) / 1000; // en secondes
    const bytesDiff = uploadedBytes - speedTrackingRef.current.lastBytes;
    
    if (timeDiff > 0.5) { // Mise à jour toutes les 500ms
      const currentSpeed = bytesDiff / timeDiff; // bytes/sec
      
      // Garder une moyenne glissante des 5 dernières mesures
      speedTrackingRef.current.speeds.push(currentSpeed);
      if (speedTrackingRef.current.speeds.length > 5) {
        speedTrackingRef.current.speeds.shift();
      }
      
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

  // Fonction de tentative avec retry
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
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Opération annulée");
        }
        return await attemptFn(abortControllerRef.current!.signal);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Vérifier si on doit réessayer
        if (attempt === maxRetries) break;
        
        const shouldRetry = retryConfig?.retryCondition 
          ? retryConfig.retryCondition(lastError, key as string)
          : true;
        
        if (!shouldRetry) break;
        
        // Attendre avant de réessayer
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
    } = {}
  ): Promise<UploadResult<TSlot>> => {
    
    // Vérification des clés uniques
    const uniqueKeys = new Set(files.map(f => f.key));
    if (uniqueKeys.size !== files.length) {
      throw new Error("Les clés des fichiers doivent être uniques");
    }

    // Initialisation du contrôleur d'annulation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Calcul des stats initiales
    const totalBytes = files.reduce((acc, f) => acc + f.file.size, 0);
    setStats({
      totalFiles: files.length,
      totalBytes,
      uploadedBytes: 0,
      speed: 0,
      timeRemaining: 0,
      startTime: Date.now()
    });
    speedTrackingRef.current = {
      lastBytes: 0,
      lastTime: Date.now(),
      speeds: []
    };

    // Filtrage pour le RETRY sélectif
    const filesToProcess = options.retryKeys 
      ? files.filter(f => options.retryKeys!.includes(f.key))
      : files;

    if (filesToProcess.length === 0) {
      return { 
        successful: [], 
        failed: [], 
        cancelled: false,
        stats: { ...stats, endTime: Date.now() }
      };
    }

    try {
      // 1. PRESIGN (avec timeout optionnel)
      setStep("presign");
      setDetail("Préparation des accès...");
      
      setProgress(prev => ({
        ...prev,
        ...filesToProcess.reduce((acc, f) => ({ ...acc, [f.key]: 0 }), {})
      }));

      let presignPromise = handlers.presign(filesToProcess);
      if (handlers.timeouts?.presign) {
        presignPromise = withTimeout(
          presignPromise,
          handlers.timeouts.presign,
          "Timeout lors de la préparation des signatures"
        );
      }
      const slots = await presignPromise;

      // 2. UPLOAD
      setStep("upload");
      
      const uploadTask = async (slot: PresignedSlot<TSlot>) => {
        console.log("Fichiers disponibles au Front :", filesToProcess.map(f => f.key));
        console.log("Slot reçu du Back :", slot.key);
        const fileDesc = filesToProcess.find((f) => f.key === slot.key);
        if (!fileDesc) return { key: slot.key, error: new Error("Fichier introuvable") };

        try {
          // Tentative avec retry si configuré
          await attemptWithRetry(
            slot.key,
            async (signal) => {
              let uploadPromise = handlers.uploadToUrl(slot.uploadUrl, fileDesc.file, (p) => {
                setProgress(prev => ({ ...prev, [slot.key]: p }));
                
                // Mise à jour des stats (portion du fichier uploadé)
                const fileBytes = (p / 100) * fileDesc.file.size;
                const totalUploaded = Object.entries(progress).reduce((acc, [key, prog]) => {
                  const file = files.find(f => f.key === key);
                  return acc + (file ? (prog / 100) * file.file.size : 0);
                }, fileBytes);
                
                updateSpeed(totalUploaded);
              }, signal);

              if (handlers.timeouts?.upload) {
                uploadPromise = withTimeout(
                  uploadPromise,
                  handlers.timeouts.upload,
                  `Timeout lors de l'upload de ${String(slot.key)}`
                );
              }
              
              await uploadPromise;
            },
            options.retryConfig
          );

          return { key: slot.key, finalUrl: slot.finalUrl };
        } catch {
          if (signal.aborted) {
            return { key: slot.key, error: new Error("Transfert annulé") };
          }
          return { key: slot.key, error: new Error("Erreur upload") };
        }
      };

      setDetail(options.parallel ? "Transfert simultané..." : "Transfert un par un...");
      
      const results = options.parallel 
        ? await Promise.all(slots.map(uploadTask))
        : await (async () => {
            const res = [];
            for (const slot of slots) {
              if (signal.aborted) break;
              res.push(await uploadTask(slot));
            }
            return res;
          })();

      const successful = results.filter((r): r is { key: TSlot; finalUrl: string } => 'finalUrl' in r);
      const failed = results.filter((r): r is { key: TSlot; error: Error } => 'error' in r);

      // Mise à jour des erreurs
      setErrors(prev => {
        const filteredPrev = prev.filter(p => !filesToProcess.some(f => f.key === p.key));
        return [...filteredPrev, ...failed];
      });

      if (successful.length === 0 && failed.length > 0 && !signal.aborted) {
        throw new Error("Aucun fichier n'a pu être transféré.");
      }

      // 3. FINALIZE (si on a des succès)
      if (successful.length > 0 && !signal.aborted) {
        setStep("finalize");
        setDetail("Finalisation de l'enregistrement...");
        
        try {
          let finalizePromise = handlers.finalize(successful);
          if (handlers.timeouts?.finalize) {
            finalizePromise = withTimeout(
              finalizePromise,
              handlers.timeouts.finalize,
              "Timeout lors de la finalisation"
            );
          }
          await finalizePromise;
        } catch (e:unknown) {
          throw new Error("Erreur lors de la validation finale en base de données.");
        }
      }

      // 4. CONCLUSION
      const endTime = Date.now();
      setStats(prev => ({ ...prev, endTime }));

      if (signal.aborted) {
        setStep("idle");
        setDetail("Opération annulée");
        return { 
          successful: [], 
          failed: [], 
          cancelled: true,
          stats: { ...stats, endTime }
        };
      }

      if (failed.length > 0) {
        setStep("partial_success");
        setDetail(`${failed.length} échec(s) détecté(s).`);
      } else {
        setStep("idle");
        setDetail(null);
      }

      return { 
        successful, 
        failed, 
        cancelled: false,
        stats: { ...stats, endTime }
      };

    } catch (e) {
      const endTime = Date.now();
      setStats(prev => ({ ...prev, endTime }));

      if (signal.aborted) {
        return { 
          successful: [], 
          failed: [], 
          cancelled: true,
          stats: { ...stats, endTime }
        };
      }
      
      setStep("error");
      setDetail(e instanceof Error ? e.message : "Erreur fatale");
      return { 
        successful: [], 
        failed: filesToProcess.map(f => ({ key: f.key, error: e as Error })),
        cancelled: false,
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
    runUpload, 
    cancel, 
    reset 
  };
}