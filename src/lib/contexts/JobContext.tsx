// lib/contexts/JobContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useGlobalSocket } from './SocketContext';
import { videoSocket } from '@/lib/socket/socket-client';
import { jobApi } from '@/lib/api/job';
import { useAccessToken } from '@/lib/auth/useAccessToken';
import type { EncodingJob } from '@/types/api/job';

// Types pour les événements socket
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

const JobContext = createContext<JobContextValue | undefined>(undefined);

export const JobProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useGlobalSocket();
  const accessToken = useAccessToken();
  const [jobs, setJobs] = useState<EncodingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fonction centrale de mise à jour avec déduplication automatique
  const upsertJobs = useCallback((newJobs: EncodingJob | EncodingJob[]) => {
    const jobsToAdd = Array.isArray(newJobs) ? newJobs : [newJobs];
    
    setJobs(prev => {
      const jobMap = new Map<string, EncodingJob>();
      
      // Ajouter les jobs existants
      prev.forEach(job => jobMap.set(job.id, job));
      
      // Merger les nouveaux (le plus récent basé sur updatedAt l'emporte)
      jobsToAdd.forEach(job => {
        const existing = jobMap.get(job.id);
        if (!existing || new Date(job.startedAt) > new Date(existing.startedAt)) {
          jobMap.set(job.id, job);
        }
      });
      
      return Array.from(jobMap.values());
    });
  }, []);

  // Chargement initial unique
  const loadInitialJobs = useCallback(async () => {
    if (!accessToken || isInitialized) return;
    
    console.log('🔄 [JobContext] Loading initial jobs...');
    setIsLoading(true);
    try {
      const data = await jobApi.list({ accessToken });
      console.log(`✅ [JobContext] Loaded ${data.length} initial jobs`);
      setJobs(data);
      setIsInitialized(true);
    } catch (err) {
      console.error("❌ [JobContext] Error loading initial jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isInitialized]);

  // Refresh manuel (pour bouton "Actualiser")
  const refreshAll = useCallback(async () => {
    if (!accessToken) return;
    
    console.log('🔄 [JobContext] Manual refresh...');
    setIsLoading(true);
    try {
      const data = await jobApi.list({ accessToken });
      upsertJobs(data);
    } catch (err) {
      console.error("❌ [JobContext] Error refreshing jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, upsertJobs]);

  // Actions utilisateur
  const pauseJob = useCallback(async (jobId: string) => {
    if (!accessToken) return;
    try {
      console.log(`⏸️ [JobContext] Pausing job: ${jobId}`);
      await jobApi.pause(jobId, accessToken);
    } catch (err) {
      console.error(`❌ [JobContext] Error pausing job ${jobId}:`, err);
    }
  }, [accessToken]);

  const resumeJob = useCallback(async (jobId: string) => {
    if (!accessToken) return;
    try {
      console.log(`▶️ [JobContext] Resuming job: ${jobId}`);
      await jobApi.resume(jobId, accessToken);
    } catch (err) {
      console.error(`❌ [JobContext] Error resuming job ${jobId}:`, err);
    }
  }, [accessToken]);

  const retryJob = useCallback(async (jobId: string) => {
    if (!accessToken) return;
    try {
      console.log(`🔄 [JobContext] Retrying job: ${jobId}`);
      // Optimistic update
      upsertJobs({ id: jobId, status: 'processing', progress: 0 } as EncodingJob);
      await jobApi.retry(jobId, accessToken);
    } catch (err) {
      console.error(`❌ [JobContext] Error retrying job ${jobId}:`, err);
      upsertJobs({ id: jobId, status: 'failed' } as EncodingJob);
    }
  }, [accessToken, upsertJobs]);

  // Setup des sockets
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('✅ [JobContext] Setting up socket handlers...');
    
    // Rejoindre les rooms
    const rooms = ["movies", "episodes", "series"] as const;
    rooms.forEach(room => {
      videoSocket.emit("join_room", { room });
    });

    // Handlers socket
    const handleJobCreated = (data: JobCreatedEvent) => {
      console.log("🆕 [JobContext] Job created:", data.job?.id);
      if (data.job) upsertJobs(data.job);
    };

    const handleJobProgress = (data: RawJobProgressEvent) => {
      const { jobId, progress, status } = data;
      if (jobId) {
        upsertJobs({ 
          id: jobId, 
          progress: progress ?? 0, 
          status: status?.toLowerCase() ?? 'processing' 
        } as EncodingJob);
      }
    };

    const handleJobCompleted = (data: JobCompletedEvent) => {
      console.log("✅ [JobContext] Job completed:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          progress: 100, 
          status: 'completed' 
        } as EncodingJob);
      }
    };

    const handleJobFailed = (data: JobFailedEvent) => {
      console.log("❌ [JobContext] Job failed:", data.jobId, data.error);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'failed' 
        } as EncodingJob);
      }
    };

    const handleJobPaused = (data: JobPausedEvent) => {
      console.log("⏸️ [JobContext] Job paused:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'paused' 
        } as EncodingJob);
      }
    };

    const handleJobResumed = (data: JobResumedEvent) => {
      console.log("▶️ [JobContext] Job resumed:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'processing' 
        } as EncodingJob);
      }
    };

    const handleJobDeleted = (data: JobDeletedEvent) => {
      console.log("🗑️ [JobContext] Job deleted:", data.jobId);
      if (data.jobId) {
        setJobs(prev => prev.filter(j => j.id !== data.jobId));
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

    // Chargement initial unique
    loadInitialJobs();

    // Cleanup
    return () => {
      videoSocket.off('job_created', handleJobCreated);
      videoSocket.off('job_progress', handleJobProgress);
      videoSocket.off('job_completed', handleJobCompleted);
      videoSocket.off('job_failed', handleJobFailed);
      videoSocket.off('job_paused', handleJobPaused);
      videoSocket.off('job_resumed', handleJobResumed);
      videoSocket.off('job_deleted', handleJobDeleted);
      
      rooms.forEach(room => {
        videoSocket.emit("leave_room", { room });
      });
    };
  }, [isAuthenticated, upsertJobs, loadInitialJobs]);

  // Statistiques mémorisées
  const stats = useMemo(() => ({
    activeCount: jobs.filter(j => ['processing', 'running', 'paused'].includes(j.status)).length,
    completedCount: jobs.filter(j => j.status === 'completed').length,
    failedCount: jobs.filter(j => j.status === 'failed').length,
  }), [jobs]);

  const value = useMemo(() => ({
    jobs,
    retryJob,
    pauseJob,
    resumeJob,
    isLoading,
    refreshAll,
    ...stats
  }), [jobs, retryJob, pauseJob, resumeJob, isLoading, refreshAll, stats]);

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
};

export const useGlobalJobs = () => {
  const context = useContext(JobContext);
  if (!context) throw new Error("useGlobalJobs must be used within JobProvider");
  return context;
};