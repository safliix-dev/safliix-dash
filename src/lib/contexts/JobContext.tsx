// lib/contexts/JobContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGlobalSocket } from './SocketContext';
import { videoSocket } from '@/lib/socket/socket-client';
import { jobApi } from '@/lib/api/job';
import { useAccessToken } from '@/lib/auth/useAccessToken';
import type { EncodingJob } from '@/types/api/job';

// Types pour les événements socket (inchangés)
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

const JobContext = createContext<JobContextValue | undefined>(undefined);

export const JobProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useGlobalSocket();
  const accessToken = useAccessToken();
  const [jobs, setJobs] = useState<EncodingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ Refs pour éviter les réinitialisations multiples
  const isInitializedRef = useRef(false);
  const handlersSetupRef = useRef(false);

  // ✅ Fonction utilitaire stable (pas besoin de useCallback car pas de dépendances)
  const createMinimalJob = (update: JobUpdate): EncodingJob => {
    const now = new Date().toISOString();
    return {
      id: update.id,
      status: update.status || 'processing',
      progress: update.progress || 0,
      title: update.title || '',
      createdAt: now,
      type: "MOVIE",
      startedAt: update.startedAt || now,
    } as EncodingJob;
  };

  // ✅ upsertJobs stable : dépendances vides car createMinimalJob est une fonction pure
  const upsertJobs = useCallback((updates: JobUpdate | JobUpdate[]) => {
    const updatesArray = Array.isArray(updates) ? updates : [updates];
    
    setJobs(prev => {
      const jobMap = new Map<string, EncodingJob>();
      
      prev.forEach(job => jobMap.set(job.id, job));
      
      updatesArray.forEach(update => {
        const existing = jobMap.get(update.id);
        
        if (existing) {
          jobMap.set(update.id, { ...existing, ...update });
        } else {
          const newJob = createMinimalJob(update);
          jobMap.set(update.id, newJob);
        }
      });
      
      return Array.from(jobMap.values());
    });
  }, []); // ✅ Pas de dépendances

  // ✅ Chargement initial - version stable
  const loadInitialJobs = useCallback(async () => {
    if (!accessToken) return;
    if (isInitializedRef.current) return;
    
    console.log('🔄 [JobContext] Loading initial jobs...');
    setIsLoading(true);
    try {
      const data = await jobApi.list({ accessToken });
      console.log(`✅ [JobContext] Loaded ${data.length} initial jobs`);
      setJobs(data);
      isInitializedRef.current = true;
    } catch (err) {
      console.error("❌ [JobContext] Error loading initial jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]); // ✅ Dépend seulement à accessToken

  // ✅ Refresh manuel
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

  // ✅ Actions utilisateur stables
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
      upsertJobs({ id: jobId, status: 'processing', progress: 0 });
      await jobApi.retry(jobId, accessToken);
    } catch (err) {
      console.error(`❌ [JobContext] Error retrying job ${jobId}:`, err);
      upsertJobs({ id: jobId, status: 'failed' });
    }
  }, [accessToken, upsertJobs]);

  // ✅ Setup des sockets - version stable
  useEffect(() => {
    if (!isAuthenticated) return;
    if (handlersSetupRef.current) return; // ✅ Évite les doubles setups
    
    console.log('✅ [JobContext] Setting up socket handlers...');
    handlersSetupRef.current = true;
    
    const rooms = ["movies", "episodes", "series"] as const;
    
    // Rejoindre les rooms
    rooms.forEach(room => {
      console.log(`📡 [JobContext] Joining room: ${room}`);
      videoSocket.emit("join_room", { room });
    });

    // ✅ Handlers stables définis à l'intérieur (pas de dépendances externes)
    const handleJobCreated = (data: JobCreatedEvent) => {
      console.log("🆕 [JobContext] Job created:", data.job?.id);
      if (data.job) {
        upsertJobs(data.job);
      }
    };

    const handleJobProgress = (data: RawJobProgressEvent) => {
      console.log(`📊 [JobContext] Progress: ${data.jobId} - ${data.progress}%`);
      const { jobId, progress, status } = data;
      if (jobId) {
        upsertJobs({ 
          id: jobId,
          progress,
          status: status?.toLowerCase() ?? 'processing',
        });
      }
    };

    const handleJobCompleted = (data: JobCompletedEvent) => {
      console.log("✅ [JobContext] Job completed:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          progress: 100, 
          status: 'completed'
        });
      }
    };

    const handleJobFailed = (data: JobFailedEvent) => {
      console.log("❌ [JobContext] Job failed:", data.jobId, data.error);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'failed',
        });
      }
    };

    const handleJobPaused = (data: JobPausedEvent) => {
      console.log("⏸️ [JobContext] Job paused:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'paused',
        });
      }
    };

    const handleJobResumed = (data: JobResumedEvent) => {
      console.log("▶️ [JobContext] Job resumed:", data.jobId);
      if (data.jobId) {
        upsertJobs({ 
          id: data.jobId, 
          status: 'processing',
        });
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

    // Chargement initial
    loadInitialJobs();

    // Cleanup - uniquement au démontage du provider
    return () => {
      console.log('🧹 [JobContext] Cleaning up socket handlers...');
      
      videoSocket.off('job_created', handleJobCreated);
      videoSocket.off('job_progress', handleJobProgress);
      videoSocket.off('job_completed', handleJobCompleted);
      videoSocket.off('job_failed', handleJobFailed);
      videoSocket.off('job_paused', handleJobPaused);
      videoSocket.off('job_resumed', handleJobResumed);
      videoSocket.off('job_deleted', handleJobDeleted);
      
      rooms.forEach(room => {
        console.log(`👋 [JobContext] Leaving room: ${room}`);
        videoSocket.emit("leave_room", { room });
      });
      
      handlersSetupRef.current = false;
      isInitializedRef.current = false;
    };
  }, [isAuthenticated, upsertJobs, loadInitialJobs]); // ✅ Dépendances maintenant stables

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