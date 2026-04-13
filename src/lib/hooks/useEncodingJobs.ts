import { useEffect, useState, useCallback } from "react";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { jobApi } from "@/lib/api/job";
import { useJobSocket } from "./useVideoSocket";
import { useToast } from "@/ui/components/toast/ToastProvider";
import type { EncodingJob } from "@/types/api/job";
import type { JobProgressPayload } from "@/types/socket";

interface UseEncodingJobsOptions {
  room: "movies" | "episodes" | "series";
  jobType: "MOVIE" | "EPISODE" | "SERIE";
  autoLoad?: boolean;
}

export const useEncodingJobs = ({
  room,
  jobType,
  autoLoad = true
}: UseEncodingJobsOptions) => {
  const [jobs, setJobs] = useState<EncodingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const accessToken = useAccessToken();
  const toast = useToast();

  const mapSocketStatus = (status: string): EncodingJob['status'] => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'processing': return 'processing';
      case 'paused': return 'paused';
      case 'failed': return 'failed';
      case 'completed': return 'completed';
      default: return 'processing';
    }
  };

  // 1. Utilisation du nouveau useJobSocket simplifié
  const { isConnected: socketConnected, isAuthenticated } = useJobSocket({
    room,
    onJobUpdate: (data: JobProgressPayload) => {
      setLastUpdate(new Date());
      
      if (data.jobId) {
        setJobs(prev => prev.map(job => {
          if (job.id === data.jobId) {
            const updatedJob = {
              ...job,
              progress: data.progress ?? job.progress,
              status: mapSocketStatus(data.status ?? job.status),
              message: data.message || '',
            };
            
            // Logique de toast identique
            if (updatedJob.status === 'completed' && job.status !== 'completed') {
              toast.success({ title: "Terminé", description: job.title });
            } else if (updatedJob.status === 'failed' && job.status !== 'failed') {
              toast.error({ title: "Erreur", description: data.message || job.title });
            }
            
            return updatedJob;
          }
          return job;
        }));
      }
    },
    onError: (error) => {
      console.error(`❌ Socket Room Error [${room}]:`, error);
    }
  });

  // 2. Refresh Jobs (API REST)
  const refreshJobs = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await jobApi.list({ type: jobType }, accessToken);
      if (Array.isArray(res)) {
        setJobs(res);
      }
    } catch (err) {
      toast.error({ title: "Erreur", description: "Impossible de charger les tâches:"+err });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, jobType, toast]);

  // 3. Actions (API TODO)
  // Note: Ici vous devriez normalement appeler jobApi.pause() etc.
  const pauseJob = useCallback(async (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'paused' } : j));
  }, []);

  const resumeJob = useCallback(async (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'processing' } : j));
  }, []);

  const failJob = useCallback(async (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'failed' } : j));
  }, []);

  const retryJob = useCallback(async (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'processing', progress: 0 } : j));
  }, []);

  useEffect(() => {
    if (autoLoad && accessToken) refreshJobs();
  }, [autoLoad, accessToken, refreshJobs]);

  return {
    jobs,
    isLoading,
    activeJobsCount: jobs.filter(j => j.status === 'processing').length,
    completedJobsCount: jobs.filter(j => j.status === 'completed').length,
    failedJobsCount: jobs.filter(j => j.status === 'failed').length,
    lastUpdate,
    socketConnected,
    isAuthenticated,
    pauseJob,
    resumeJob,
    failJob,
    retryJob,
    refreshJobs,
  };
};