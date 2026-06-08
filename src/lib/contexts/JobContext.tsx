import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGlobalSocket } from './SocketContext';
import { videoSocket } from '@/lib/socket/socket-client';
import { jobApi } from '@/lib/api/job';
import type { EncodingJob } from '@/types/api/job';

// ============================================================
// TYPES
// ============================================================

interface JobCreatedEvent {
  job: EncodingJob;
  room: string;
}

interface JobCompletedEvent {
  jobId: string;
  s3Key?: string;
  outputUrl?: string;
  status?: string;
  completedAt?: string;
  room?: string;
}

interface JobFailedEvent {
  jobId: string;
  s3Key?: string;
  error: string;
  message?: string;
  status?: string;
  failedAt?: string;
  room?: string;
}

interface JobPausedEvent {
  jobId: string;
  status?: string;
  pausedAt?: string;
  room?: string;
}

interface JobResumedEvent {
  jobId: string;
  status?: string;
  resumedAt?: string;
  room?: string;
}

interface JobDeletedEvent {
  jobId: string;
  room?: string;
  deletedAt?: string;
}

interface RawJobProgressEvent {
  s3Key: string;
  room: string;
  jobId: string;
  stage: string;
  progress: number;
  status: string;
  message?: string;
  updatedAt: string;
  timestamp: string;
}

type JobUpdate = Partial<EncodingJob> & { id: string };

interface JobContextValue {
  jobs: EncodingJob[];
  isLoading: boolean;
  activeCount: number;
  completedCount: number;
  failedCount: number;
  refreshAll: () => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  resumeJob: (jobId: string) => Promise<void>;
  pauseJob: (jobId: string) => Promise<void>;
}

// ============================================================
// HELPERS
// ============================================================

const createMinimalJob = (update: JobUpdate): EncodingJob => {
  const now = new Date().toISOString();
  return {
    id: update.id,
    status: (update.status) || 'pending',
    progress: update.progress ?? 0,
    title: update.title || '',
    createdAt: now,
    type: "MOVIE",
    startedAt: update.startedAt || now,
    updatedAt: now,
  } as EncodingJob;
};

// ============================================================
// CONTEXT
// ============================================================

const JobContext = createContext<JobContextValue | undefined>(undefined);

export const JobProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isConnected } = useGlobalSocket();
  
  const [jobs, setJobs] = useState<EncodingJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const isInitialized = useRef<boolean>(false);

  // ============================================================
  // JOB MANAGEMENT
  // ============================================================

  const upsertJobs = useCallback((updates: JobUpdate | JobUpdate[]): void => {
    const updatesArray = Array.isArray(updates) ? updates : [updates];
    
    setJobs((prev: EncodingJob[]): EncodingJob[] => {
      const jobMap = new Map<string, EncodingJob>();
      
      // Ajouter les jobs existants
      for (const job of prev) {
        jobMap.set(job.id, job);
      }
      
      // Merger les mises à jour
      for (const update of updatesArray) {
        const existing = jobMap.get(update.id);

        if (existing) {
          // Règle monotone : pour un job en traitement, le progress ne recule jamais.
          // Ceci évite les régressions visuelles quand le pipeline passe à une nouvelle étape.
          const incomingStatus = update.status ?? existing.status;
          const isRunning = existing.status === 'processing' && incomingStatus === 'processing';
          const resolvedProgress =
            isRunning &&
            update.progress !== undefined &&
            update.progress < (existing.progress ?? 0)
              ? existing.progress
              : update.progress;

          jobMap.set(update.id, {
            ...existing,
            ...update,
            ...(resolvedProgress !== undefined ? { progress: resolvedProgress } : {}),
          });
        } else {
          jobMap.set(update.id, createMinimalJob(update));
        }
      }
      
      return Array.from(jobMap.values());
    });
  }, []);

  const loadInitialJobs = useCallback(async (): Promise<void> => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log('🔄 [JobContext] Loading initial jobs...');
    setIsLoading(true);
    try {
      const data = await jobApi.list({ status: "Processing" });
      console.log(`✅ [JobContext] Loaded ${data.length} initial jobs`);
      // Merge with any socket-created jobs that arrived before this response.
      upsertJobs(data);
    } catch (err) {
      const error = err as Error;
      console.error("❌ [JobContext] Error loading initial jobs:", error.message);
      // Reset so a reconnect can retry.
      isInitialized.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [upsertJobs]);

  const refreshAll = useCallback(async (): Promise<void> => {
    console.log('🔄 [JobContext] Manual refresh...');
    setIsLoading(true);
    try {
      const data = await jobApi.list({ status: "Processing" });
      // Replace the list entirely so stale failed/completed jobs don't linger.
      setJobs(data);
    } catch (err) {
      const error = err as Error;
      console.error("❌ [JobContext] Error refreshing jobs:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================
  // JOB ACTIONS
  // ============================================================

  const pauseJob = useCallback(async (jobId: string): Promise<void> => {
    
    
    try {
      console.log(`⏸️ [JobContext] Pausing job: ${jobId}`);
      await jobApi.pause(jobId, );
    } catch (err) {
      const error = err as Error;
      console.error(`❌ [JobContext] Error pausing job ${jobId}:`, error.message);
    }
  }, []);

  const resumeJob = useCallback(async (jobId: string): Promise<void> => {
   
    try {
      console.log(`▶️ [JobContext] Resuming job: ${jobId}`);
      await jobApi.resume(jobId, );
    } catch (err) {
      const error = err as Error;
      console.error(`❌ [JobContext] Error resuming job ${jobId}:`, error.message);
    }
  }, []);

  const retryJob = useCallback(async (jobId: string): Promise<void> => {
   
    try {
      console.log(`🔄 [JobContext] Retrying job: ${jobId}`);
      // Optimistic update
      upsertJobs({ id: jobId, status: 'processing' , progress: 0 });
      await jobApi.retry(jobId, );
    } catch (err) {
      const error = err as Error;
      console.error(`❌ [JobContext] Error retrying job ${jobId}:`, error.message);
      upsertJobs({ id: jobId, status: 'failed'  });
    }
  }, [, upsertJobs]);

  // ============================================================
  // SOCKET SETUP
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated || !isConnected) {
      console.log('⏳ [JobContext] Waiting for socket authentication...');
      return;
    }

    console.log('✅ [JobContext] Setting up socket handlers...');

    const handleJobCreated = (data: JobCreatedEvent): void => {
      console.log("🆕 [JobContext] Job created:", data.job?.id);
      if (data.job) upsertJobs({ ...data.job, status: normalizeStatus(data.job.status) });
    };

    const normalizeStatus = (status: string | undefined): string =>
      status?.toLowerCase() === 'running' ? 'processing' : (status?.toLowerCase() ?? 'processing');

    const handleJobProgress = (data: RawJobProgressEvent): void => {
      console.log(`📊 [JobContext] Job progress: jobId=${data.jobId} progress=${data.progress}% stage=${data.stage} status=${data.status}`);
      const { jobId, progress, status, stage } = data;
      if (jobId) {
        upsertJobs({
          id: jobId,
          progress,
          status: normalizeStatus(status),
          stage: stage || undefined,
        });
      }
    };

    const handleJobCompleted = (data: JobCompletedEvent): void => {
      console.log("✅ [JobContext] Job completed:", data.jobId);
      if (data.jobId) upsertJobs({ id: data.jobId, progress: 100, status: 'completed' });
    };

    const handleJobFailed = (data: JobFailedEvent): void => {
      console.log("❌ [JobContext] Job failed:", data.jobId);
      if (data.jobId) upsertJobs({ id: data.jobId, status: 'failed' });
    };

    const handleJobPaused = (data: JobPausedEvent): void => {
      console.log("⏸️ [JobContext] Job paused:", data.jobId);
      if (data.jobId) upsertJobs({ id: data.jobId, status: 'paused' });
    };

    const handleJobResumed = (data: JobResumedEvent): void => {
      console.log("▶️ [JobContext] Job resumed:", data.jobId);
      if (data.jobId) upsertJobs({ id: data.jobId, status: 'processing' });
    };

    const handleJobDeleted = (data: JobDeletedEvent): void => {
      console.log("🗑️ [JobContext] Job deleted:", data.jobId);
      if (data.jobId) {
        setJobs((prev: EncodingJob[]): EncodingJob[] =>
          prev.filter((job: EncodingJob): boolean => job.id !== data.jobId)
        );
      }
    };

    videoSocket.on('job_created', handleJobCreated);
    videoSocket.on('job_progress', handleJobProgress);
    videoSocket.on('job_completed', handleJobCompleted);
    videoSocket.on('job_failed', handleJobFailed);
    videoSocket.on('job_paused', handleJobPaused);
    videoSocket.on('job_resumed', handleJobResumed);
    videoSocket.on('job_deleted', handleJobDeleted);

    loadInitialJobs();

    return (): void => {
      console.log('🧹 [JobContext] Cleaning up socket handlers...');

      videoSocket.off('job_created', handleJobCreated);
      videoSocket.off('job_progress', handleJobProgress);
      videoSocket.off('job_completed', handleJobCompleted);
      videoSocket.off('job_failed', handleJobFailed);
      videoSocket.off('job_paused', handleJobPaused);
      videoSocket.off('job_resumed', handleJobResumed);
      videoSocket.off('job_deleted', handleJobDeleted);

      isInitialized.current = false;
    };
  }, [isAuthenticated, isConnected, upsertJobs, loadInitialJobs]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const stats = useMemo((): { activeCount: number; completedCount: number; failedCount: number } => {
    const activeStatuses = ['processing', 'pending'];
    const activeCount = jobs.filter((job: EncodingJob): boolean => 
      activeStatuses.includes(job.status)
    ).length;
    
    const completedCount = jobs.filter((job: EncodingJob): boolean => 
      job.status === 'completed'
    ).length;
    
    const failedCount = jobs.filter((job: EncodingJob): boolean => 
      job.status === 'failed'
    ).length;
    
    return { activeCount, completedCount, failedCount };
  }, [jobs]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value = useMemo((): JobContextValue => ({
    jobs,
    isLoading,
    refreshAll,
    retryJob,
    pauseJob,
    resumeJob,
    ...stats,
  }), [jobs, isLoading, refreshAll, retryJob, pauseJob, resumeJob, stats]);

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
};

// ============================================================
// HOOK
// ============================================================

export const useGlobalJobs = (): JobContextValue => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useGlobalJobs must be used within a JobProvider');
  }
  return context;
};