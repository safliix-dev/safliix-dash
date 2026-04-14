// lib/contexts/JobContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useGlobalSocket } from './SocketContext';
import { videoSocket } from '@/lib/socket/socket-client';
import { jobApi } from '@/lib/api/job';
import { useAccessToken } from '@/lib/auth/useAccessToken';
import type { EncodingJob } from '@/types/api/job';
import type { JobProgressPayload } from '@/types/socket';

interface JobContextValue {
  jobs: EncodingJob[];
  isLoading: boolean;
  activeCount: number;
  completedCount: number;
  failedCount: number;
  refreshAll: () => Promise<void>;
  retryJob: (jobId:string) => Promise<void>;
  resumeJob: (jobId:string) => Promise<void>;
  pauseJob: (jobId:string) => Promise<void>;
}

const JobContext = createContext<JobContextValue | undefined>(undefined);

export const JobProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useGlobalSocket();
  const accessToken = useAccessToken();
  const [jobs, setJobs] = useState<EncodingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateJob = useCallback((jobId: string, changes: Partial<EncodingJob>) => {
  setJobs(prev => {
    // On vérifie si le job existe et si les changements sont réels
    const jobIndex = prev.findIndex(j => j.id === jobId);
    if (jobIndex === -1) return prev;

    const currentJob = prev[jobIndex];
    
    // Optimisation : On ne met à jour que si les données critiques ont changé
    // (on évite de mettre à jour lastUpdate si le progrès est identique)
    if (currentJob.progress === changes.progress && currentJob.status === changes.status) {
      return prev;
    }

    const newJobs = [...prev];
    newJobs[jobIndex] = { 
      ...currentJob, 
      ...changes,
    };
    return newJobs;
  });
}, []);

  const refreshAll = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await jobApi.list({accessToken});
      setJobs(data);
    } catch (err) { 
      console.error("Erreur sync jobs:", err);
    } finally { 
      setIsLoading(false); 
    }
  }, [accessToken]);

  const pauseJob = useCallback(async (jobId: string) => {
    if (!accessToken) return;
    try {
      await jobApi.pause(jobId, accessToken);
      // Note: Le changement de statut sera géré par le socket "job_paused"
    } catch (err) {
      console.error("Erreur pause job:", err);
    }
  }, [accessToken]);

  const resumeJob = useCallback(async (jobId: string) => {
    if (!accessToken) return;
    try {
      await jobApi.resume(jobId,accessToken );
      // Note: Le changement de statut sera géré par le socket "job_resumed"
    } catch (err) {
      console.error("Erreur resume job:", err);
    }
  }, [accessToken]);

  const retryJob = useCallback(async (jobId: string) => {
    if (!accessToken) return;
    try {
      // On peut passer le job en "pending" localement pour UI feedback immédiat
      updateJob(jobId, { status: 'processing', progress: 0 });
      await jobApi.retry(jobId, accessToken);
    } catch (err) {
      console.error("Erreur retry job:", err);
      // En cas d'erreur API, on remet en failed
      updateJob(jobId, { status: 'failed' });
    }
  }, [accessToken, updateJob]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Rejoindre toutes les rooms
    const rooms = ["movies", "episodes", "series"] as const;
    rooms.forEach(room => videoSocket.emit("join_room", { room }));

    const handlers = {
      job_created: (data: { job: EncodingJob; room: string }) => {
        setJobs(prev => [data.job, ...prev]);
      },
      job_progress: (data: JobProgressPayload) => {
        updateJob(data.jobId, { 
          progress: data.progress, 
          status: data.status?.toLowerCase()  || 'processing',
        });
      },
      job_completed: (data: { jobId: string }) => {
        updateJob(data.jobId, { progress: 100, status: 'completed' });
      },
      job_failed: (data: { jobId: string; message?: string }) => {
        updateJob(data.jobId, { status: 'failed'});
      },
      job_paused: (data: { jobId: string }) => {
        updateJob(data.jobId, { status: 'paused' });
      },
      job_resumed: (data: { jobId: string }) => {
        updateJob(data.jobId, { status: 'processing' });
      },
      job_deleted: (data: { jobId: string }) => {
        setJobs(prev => prev.filter(j => j.id !== data.jobId));
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      videoSocket.on(event, handler);
    });
    
    refreshAll();

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        videoSocket.off(event, handler);
      });
      rooms.forEach(room => videoSocket.emit("leave_room", { room }));
    };
  }, [isAuthenticated, updateJob, refreshAll]);

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