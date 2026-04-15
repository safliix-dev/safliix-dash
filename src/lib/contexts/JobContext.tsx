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

// Type pour le payload brut de job_progress du backend
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

  const updateJob = useCallback((jobId: string, changes: Partial<EncodingJob>) => {
    console.log(`📝 [JobContext] updateJob called for jobId: ${jobId}`, changes);
    
    setJobs(prev => {
      const jobIndex = prev.findIndex(j => j.id === jobId);
      if (jobIndex === -1) {
        console.warn(`⚠️ [JobContext] Job ${jobId} not found in list`);
        return prev;
      }

      const currentJob = prev[jobIndex];
      
      if (currentJob.progress === changes.progress && currentJob.status === changes.status) {
        console.log(`⏭️ [JobContext] Skipping update - no changes for job ${jobId}`);
        return prev;
      }

      console.log(`✅ [JobContext] Updating job ${jobId}: ${currentJob.progress}% → ${changes.progress}%, ${currentJob.status} → ${changes.status}`);
      
      const newJobs = [...prev];
      newJobs[jobIndex] = { 
        ...currentJob, 
        ...changes,
      };
      return newJobs;
    });
  }, []);

  const refreshAll = useCallback(async () => {
    if (!accessToken) {
      console.warn('⚠️ [JobContext] refreshAll skipped - no access token');
      return;
    }
    console.log('🔄 [JobContext] Refreshing all jobs...');
    setIsLoading(true);
    try {
      const data = await jobApi.list({ accessToken });
      console.log(`✅ [JobContext] Loaded ${data.length} jobs from API`);
      setJobs(data);
    } catch (err) {
      console.error("❌ [JobContext] Error syncing jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

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
      updateJob(jobId, { status: 'processing', progress: 0 });
      await jobApi.retry(jobId, accessToken);
    } catch (err) {
      console.error(`❌ [JobContext] Error retrying job ${jobId}:`, err);
      updateJob(jobId, { status: 'failed' });
    }
  }, [accessToken, updateJob]);

  useEffect(() => {
    console.log('🎬 [JobContext] useEffect triggered, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('⏸️ [JobContext] Skipping socket setup - not authenticated');
      return;
    }

    console.log('✅ [JobContext] Setting up socket handlers...');
    console.log('🔌 [JobContext] Socket connection state:', {
      connected: videoSocket.connected,
      id: videoSocket.id,
    });

    // Rejoindre toutes les rooms
    const rooms = ["movies", "episodes", "series"] as const;
    console.log(`🏠 [JobContext] Joining rooms: ${rooms.join(', ')}`);
    
    rooms.forEach(room => {
      console.log(`📡 [JobContext] Emitting join_room for: ${room}`);
      videoSocket.emit("join_room", { room }, (response?: { event: string; data: string }) => {
        console.log(`✅ [JobContext] join_room response for ${room}:`, response);
      });
    });

    // Handler pour job_created
    const handleJobCreated = (data: JobCreatedEvent) => {
      console.log("🆕 [JobContext] job_created event received:", JSON.stringify(data, null, 2));
      if (data.job) {
        console.log(`📊 New job: ${data.job.id} - ${data.job.status}`);
        setJobs(prev => [data.job, ...prev]);
      } else {
        console.warn("⚠️ job_created: no job field in data", data);
      }
    };

    // Handler pour job_progress
    const handleJobProgress = (data: RawJobProgressEvent) => {
      console.log("📊 [JobContext] job_progress RAW event received:", JSON.stringify(data, null, 2));
      
      const { jobId, progress, status } = data;
      
      console.log(`📈 [JobContext] Parsed progress data:`, {
        jobId,
        progress,
        status,
      });
      
      if (!jobId) {
        console.error("❌ [JobContext] Cannot extract jobId from payload:", data);
        return;
      }
      
      updateJob(jobId, {
        progress: progress ?? 0,
        status: status?.toLowerCase() ?? 'processing',
      });
    };

    // Handler pour job_completed
    const handleJobCompleted = (data: JobCompletedEvent) => {
      console.log("✅ [JobContext] job_completed event received:", data);
      const { jobId } = data;
      if (jobId) {
        console.log(`🎉 Job ${jobId} completed!`);
        updateJob(jobId, { progress: 100, status: 'completed' });
      } else {
        console.warn("⚠️ job_completed: no jobId found", data);
      }
    };

    // Handler pour job_failed
    const handleJobFailed = (data: JobFailedEvent) => {
      console.log("❌ [JobContext] job_failed event received:", data);
      const { jobId, error, message } = data;
      if (jobId) {
        console.log(`💀 Job ${jobId} failed: ${message ?? error}`);
        updateJob(jobId, { status: 'failed' });
      } else {
        console.warn("⚠️ job_failed: no jobId found", data);
      }
    };

    // Handler pour job_paused
    const handleJobPaused = (data: JobPausedEvent) => {
      console.log("⏸️ [JobContext] job_paused event received:", data);
      const { jobId } = data;
      if (jobId) {
        updateJob(jobId, { status: 'paused' });
      }
    };

    // Handler pour job_resumed
    const handleJobResumed = (data: JobResumedEvent) => {
      console.log("▶️ [JobContext] job_resumed event received:", data);
      const { jobId } = data;
      if (jobId) {
        updateJob(jobId, { status: 'processing' });
      }
    };

    // Handler pour job_deleted
    const handleJobDeleted = (data: JobDeletedEvent) => {
      console.log("🗑️ [JobContext] job_deleted event received:", data);
      const { jobId } = data;
      if (jobId) {
        console.log(`Removing job ${jobId} from list`);
        setJobs(prev => prev.filter(j => j.id !== jobId));
      }
    };

    // Écouter TOUS les événements pour debug (sans any)
    const onAnyEvent = (event: string, ...args: unknown[]) => {
      console.log(`🔔 [JobContext] Socket ANY event: "${event}"`, args);
    };
    videoSocket.onAny(onAnyEvent);

    // Enregistrer les handlers spécifiques
    videoSocket.on('job_created', handleJobCreated);
    videoSocket.on('job_progress', handleJobProgress);
    videoSocket.on('job_completed', handleJobCompleted);
    videoSocket.on('job_failed', handleJobFailed);
    videoSocket.on('job_paused', handleJobPaused);
    videoSocket.on('job_resumed', handleJobResumed);
    videoSocket.on('job_deleted', handleJobDeleted);
    
    // Rafraîchir la liste des jobs
    refreshAll();

    // Nettoyage
    return () => {
      console.log('🧹 [JobContext] Cleaning up socket handlers...');
      videoSocket.offAny(onAnyEvent);
      
      videoSocket.off('job_created', handleJobCreated);
      videoSocket.off('job_progress', handleJobProgress);
      videoSocket.off('job_completed', handleJobCompleted);
      videoSocket.off('job_failed', handleJobFailed);
      videoSocket.off('job_paused', handleJobPaused);
      videoSocket.off('job_resumed', handleJobResumed);
      videoSocket.off('job_deleted', handleJobDeleted);
      
      rooms.forEach(room => {
        console.log(`📡 [JobContext] Leaving room: ${room}`);
        videoSocket.emit("leave_room", { room });
      });
    };
  }, [isAuthenticated, updateJob, refreshAll]);

  // Statistiques mémorisées
  const stats = useMemo(() => {
    const statsData = {
      activeCount: jobs.filter(j => ['processing', 'running', 'paused'].includes(j.status)).length,
      completedCount: jobs.filter(j => j.status === 'completed').length,
      failedCount: jobs.filter(j => j.status === 'failed').length,
    };
    console.log(`📊 [JobContext] Stats updated:`, statsData);
    return statsData;
  }, [jobs]);

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