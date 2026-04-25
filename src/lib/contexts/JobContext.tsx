import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGlobalSocket } from './SocketContext';
import { videoSocket } from '@/lib/socket/socket-client';
import { jobApi } from '@/lib/api/job';
import { useAccessToken } from '@/lib/auth/useAccessToken';
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
  const accessToken = useAccessToken();
  
  const [jobs, setJobs] = useState<EncodingJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Refs pour éviter les cycles
  const isSetupComplete = useRef<boolean>(false);
  const isInitialized = useRef<boolean>(false);
  const roomsJoined = useRef<Set<string>>(new Set());

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
          // Merge : conserver toutes les propriétés existantes
          jobMap.set(update.id, { ...existing, ...update });
        } else {
          // Nouveau job
          jobMap.set(update.id, createMinimalJob(update));
        }
      }
      
      return Array.from(jobMap.values());
    });
  }, []);

  const loadInitialJobs = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    if (isInitialized.current) return;
    
    console.log('🔄 [JobContext] Loading initial jobs...');
    setIsLoading(true);
    
    try {
      const data = await jobApi.list({ accessToken });
      console.log(`✅ [JobContext] Loaded ${data.length} initial jobs`);
      setJobs(data);
      isInitialized.current = true;
    } catch (err) {
      const error = err as Error;
      console.error("❌ [JobContext] Error loading initial jobs:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const refreshAll = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    
    console.log('🔄 [JobContext] Manual refresh...');
    setIsLoading(true);
    
    try {
      const data = await jobApi.list({ accessToken });
      upsertJobs(data);
    } catch (err) {
      const error = err as Error;
      console.error("❌ [JobContext] Error refreshing jobs:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, upsertJobs]);

  // ============================================================
  // JOB ACTIONS
  // ============================================================

  const pauseJob = useCallback(async (jobId: string): Promise<void> => {
    if (!accessToken) return;
    
    try {
      console.log(`⏸️ [JobContext] Pausing job: ${jobId}`);
      await jobApi.pause(jobId, accessToken);
    } catch (err) {
      const error = err as Error;
      console.error(`❌ [JobContext] Error pausing job ${jobId}:`, error.message);
    }
  }, [accessToken]);

  const resumeJob = useCallback(async (jobId: string): Promise<void> => {
    if (!accessToken) return;
    
    try {
      console.log(`▶️ [JobContext] Resuming job: ${jobId}`);
      await jobApi.resume(jobId, accessToken);
    } catch (err) {
      const error = err as Error;
      console.error(`❌ [JobContext] Error resuming job ${jobId}:`, error.message);
    }
  }, [accessToken]);

  const retryJob = useCallback(async (jobId: string): Promise<void> => {
    if (!accessToken) return;
    
    try {
      console.log(`🔄 [JobContext] Retrying job: ${jobId}`);
      // Optimistic update
      upsertJobs({ id: jobId, status: 'processing' , progress: 0 });
      await jobApi.retry(jobId, accessToken);
    } catch (err) {
      const error = err as Error;
      console.error(`❌ [JobContext] Error retrying job ${jobId}:`, error.message);
      upsertJobs({ id: jobId, status: 'failed'  });
    }
  }, [accessToken, upsertJobs]);

  // ============================================================
  // SOCKET SETUP
  // ============================================================

  useEffect(() => {
    // Attendre que la socket soit authentifiée
    if (!isAuthenticated || !isConnected) {
      console.log('⏳ [JobContext] Waiting for socket authentication...');
      return;
    }
    
    // Éviter les doubles setups
    if (isSetupComplete.current) {
      console.log('✅ [JobContext] Already setup, skipping...');
      return;
    }
    
    console.log('✅ [JobContext] Setting up socket handlers...');
    isSetupComplete.current = true;
    
    const rooms: readonly string[] = ["movies", "episodes", "series"] as const;
    const currentRooms = roomsJoined.current;
    
    // Rejoindre les rooms
    for (const room of rooms) {
      if (!currentRooms.has(room)) {
        console.log(`📡 [JobContext] Joining room: ${room}`);
        videoSocket.emit("join_room", { room });
        currentRooms.add(room);
      }
    }

    // Handlers socket
    const handleJobCreated = (data: JobCreatedEvent): void => {
      console.log("🆕 [JobContext] Job created:", data.job?.id);
      if (data.job) {
        upsertJobs(data.job);
      }
    };

    const handleJobProgress = (data: RawJobProgressEvent): void => {
      const { jobId, progress, status } = data;
      if (jobId) {
        upsertJobs({ 
          id: jobId, 
          progress, 
          status: (status?.toLowerCase() ) ?? 'processing'
        });
      }
    };

    const handleJobCompleted = (data: JobCompletedEvent): void => {
      console.log("✅ [JobContext] Job completed:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          progress: 100, 
          status: 'completed' 
        });
      }
    };

    const handleJobFailed = (data: JobFailedEvent): void => {
      console.log("❌ [JobContext] Job failed:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'failed' 
          
        });
      }
    };

    const handleJobPaused = (data: JobPausedEvent): void => {
      console.log("⏸️ [JobContext] Job paused:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'paused' 
        });
      }
    };

    const handleJobResumed = (data: JobResumedEvent): void => {
      console.log("▶️ [JobContext] Job resumed:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'processing'
        });
      }
    };

    const handleJobDeleted = (data: JobDeletedEvent): void => {
      console.log("🗑️ [JobContext] Job deleted:", data.jobId);
      if (data.jobId) {
        setJobs((prev: EncodingJob[]): EncodingJob[] => 
          prev.filter((job: EncodingJob): boolean => job.id !== data.jobId)
        );
      }
    };

    // Enregistrement des handlers
    videoSocket.on('job_created', handleJobCreated);
    videoSocket.on('job_progress', handleJobProgress);
    videoSocket.on('job_completed', handleJobCompleted);
    videoSocket.on('job_failed', handleJobFailed);
    videoSocket.on('job_paused', handleJobPaused);
    videoSocket.on('job_resumed', handleJobResumed);
    videoSocket.on('job_deleted', handleJobDeleted);

    // Chargement initial
    loadInitialJobs();

    // Cleanup - uniquement au démontage
    return (): void => {
      console.log('🧹 [JobContext] Component unmounting, cleaning up...');
      
      // Retirer les handlers
      videoSocket.off('job_created', handleJobCreated);
      videoSocket.off('job_progress', handleJobProgress);
      videoSocket.off('job_completed', handleJobCompleted);
      videoSocket.off('job_failed', handleJobFailed);
      videoSocket.off('job_paused', handleJobPaused);
      videoSocket.off('job_resumed', handleJobResumed);
      videoSocket.off('job_deleted', handleJobDeleted);
      
      // Quitter les rooms
      for (const room of currentRooms) {
        console.log(`👋 [JobContext] Leaving room: ${room}`);
        videoSocket.emit("leave_room", { room });
      }
      currentRooms.clear();
      
      isSetupComplete.current = false;
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