// hooks/useEncodingJobs.ts
import { useEffect, useState, useCallback } from "react";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { jobApi } from "@/lib/api/job";
import { useJobSocket } from "./useVideoSocket";
import { useToast } from "@/ui/components/toast/ToastProvider";
import type { EncodingJob } from "@/types/api/job";
import type { JobProgressPayload } from "@/types/socket";

interface UseEncodingJobsOptions {
  room: "movies" | "episodes" | "series"; // Selon tes besoins
  jobType: "MOVIE" | "SERIE" | "EPISODE";
  autoLoad?: boolean;
}

interface UseEncodingJobsReturn {
  jobs: EncodingJob[];
  isLoading: boolean;
  activeJobsCount: number;
  completedJobsCount: number;
  failedJobsCount: number;
  lastUpdate: Date | null;
  socketConnected: boolean;
  isAuthenticated: boolean;
  pauseJob: (jobId: string) => Promise<void>;
  resumeJob: (jobId: string) => Promise<void>;
  failJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
}

export const useEncodingJobs = ({
  room,
  jobType,
  autoLoad = true
}: UseEncodingJobsOptions): UseEncodingJobsReturn => {
  const [jobs, setJobs] = useState<EncodingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const accessToken = useAccessToken();
  const toast = useToast();

  // Helper pour mapper le statut socket
  const mapSocketStatus = (status: string): EncodingJob['status'] => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'processing':
        return 'processing';
      case 'paused':
        return 'paused';
      case 'failed':
        return 'failed';
      case 'completed':
        return 'completed';
      default:
        return 'processing';
    }
  };

  // WebSocket pour les mises à jour temps réel
  const { 
    isConnected: socketConnected, 
    isAuthenticated,
  } = useJobSocket({
    room,
    accessToken,
    onJobUpdate: (data: JobProgressPayload) => {
      console.log(`📡 Mise à jour socket reçue pour ${room}:`, data);
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
            
            // Notifications pour les événements importants
            if (updatedJob.status === 'completed' && job.status !== 'completed') {
              toast.success({ 
                title: "Encodage terminé", 
                description: `${job.title} est maintenant disponible` 
              });
            } else if (updatedJob.status === 'failed' && job.status !== 'failed') {
              toast.error({ 
                title: "Erreur d'encodage", 
                description: `${job.title} - ${data.message || 'Une erreur est survenue'}` 
              });
            }
            
            return updatedJob;
          }
          return job;
        }));
      }
    },
    onError: (error) => {
      console.error(`❌ Erreur WebSocket pour ${room}:`, error);
      toast.warning({ 
        title: "Connexion temps réel", 
        description: "Mise à jour des tâches en différé" 
      });
    }
  });

  // Chargement initial des jobs
  const refreshJobs = useCallback(async () => {
    if (!accessToken) return;
    
    setIsLoading(true);
    try {
      const res = await jobApi.list({ type: jobType }, accessToken);
      if (Array.isArray(res)) {
        setJobs(res);
        console.log(`📊 ${res.length} jobs d'encodage chargés pour ${room}`);
      }
    } catch (err) {
      console.error(`Erreur lors du chargement des jobs ${room}:`, err);
      toast.error({ 
        title: "Erreur", 
        description: "Impossible de charger les tâches d'encodage" 
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, jobType, room, toast]);

  // Actions sur les jobs
  const pauseJob = useCallback(async (jobId: string) => {
    try {
      // TODO: Appeler l'API de pause
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'paused' } : job
      ));
      toast.info({ title: "Encodage en pause", description: "La tâche a été mise en pause" });
    } catch (error) {
      toast.error({ title: "Erreur", description: "Impossible de mettre en pause"+error });
    }
  }, [toast]);

  const resumeJob = useCallback(async (jobId: string) => {
    try {
      // TODO: Appeler l'API de reprise
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'processing' } : job
      ));
      toast.success({ title: "Reprise de l'encodage", description: "La tâche a été reprise" });
    } catch (error) {
      toast.error({ title: "Erreur", description: "Impossible de reprendre"+error });
    }
  }, [toast]);

  const failJob = useCallback(async (jobId: string) => {
    try {
      // TODO: Appeler l'API d'échec
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'failed' } : job
      ));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const retryJob = useCallback(async (jobId: string) => {
    try {
      // TODO: Appeler l'API de relance
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'processing', progress: 0 } : job
      ));
      toast.info({ title: "Relance de l'encodage", description: "La tâche a été relancée" });
    } catch (error) {
      toast.error({ title: "Erreur", description: "Impossible de relancer"+error });
    }
  }, [toast]);

  // Auto-load
  useEffect(() => {
    if (autoLoad && accessToken) {
      refreshJobs();
    }
  }, [autoLoad, accessToken, refreshJobs]);

  // Stats
  const activeJobsCount = jobs.filter(j => j.status === 'processing').length;
  const completedJobsCount = jobs.filter(j => j.status === 'completed').length;
  const failedJobsCount = jobs.filter(j => j.status === 'failed').length;

  return {
    jobs,
    isLoading,
    activeJobsCount,
    completedJobsCount,
    failedJobsCount,
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