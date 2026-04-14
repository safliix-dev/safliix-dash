// ui/components/EncodingJobsMonitor.tsx
'use client';

import { useState, useMemo } from 'react';
import { useGlobalJobs } from '@/lib/contexts/JobContext'; // Utilisation directe du context
import { JobItem } from './jobItem';
import { EncodingJob } from '@/types/api/job';

interface EncodingJobsMonitorProps {
  title?: string;
  showHeader?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
  className?: string;
  onJobClick?: (job: EncodingJob) => void;
}

export const EncodingJobsMonitor = (props: EncodingJobsMonitorProps) => {
  const {
    title = "Flux global d'encodage", showHeader = true,
    showFilters = false, maxHeight = "max-h-96", className = "", onJobClick
  } = props;

  const [isExpanded, setIsExpanded] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // On récupère TOUT sans filtre de type
  const {
    jobs, isLoading, activeCount,
    refreshAll, pauseJob, resumeJob, retryJob // Assure-toi que ces méthodes existent dans useGlobalJobs
  } = useGlobalJobs();

  const filteredJobs = useMemo(() => {
    // Tri : On met les jobs en cours et les erreurs en haut
    const sorted = [...jobs].sort((a) => {
      if (a.status === 'processing' || a.status === 'failed') return -1;
      return 1;
    });

    if (statusFilter === 'all') return sorted;
    return sorted.filter(job => job.status === statusFilter);
  }, [jobs, statusFilter]);

  const hasNoJobs = useMemo(() => 
    filteredJobs.length === 0 && !isLoading, 
    [filteredJobs.length, isLoading]
  );

  // ✅ Helpers (statiques ou mémorisés)
  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'border-primary/30 bg-primary/5';
      case 'completed': return 'border-success/30 bg-success/5';
      case 'failed': return 'border-error/30 bg-error/5';
      case 'paused': return 'border-warning/30 bg-warning/5';
      default: return 'border-base-300/60 bg-base-200/40';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'failed': return 'progress-error';
      case 'completed': return 'progress-success';
      case 'paused': return 'progress-warning';
      default: return 'progress-primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing': return 'Encodage en cours';
      case 'completed': return 'Terminé';
      case 'failed': return 'Échec';
      case 'paused': return 'En pause';
      default: return 'En attente';
    }
  };

  return (
    <div className={`bg-neutral flex flex-col ${className}`}>
      {showHeader && (
        <div className="p-4 border-b border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h3>
            <div className="flex gap-1.5">
               {activeCount > 0 && <span className="badge badge-primary badge-xs font-bold p-2">{activeCount}</span>}
               <input type="checkbox" className="toggle toggle-primary toggle-xs" checked={isExpanded} onChange={() => setIsExpanded(!isExpanded)} />
            </div>
          </div>

          {showFilters && (
            <div className="flex gap-2">
              <select 
                className="select select-xs select-bordered bg-base-300 text-[10px] flex-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="processing">En cours</option>
                <option value="failed">Échecs</option>
                <option value="completed">Finis</option>
              </select>
              <button onClick={refreshAll} className="btn btn-xs btn-ghost text-[9px]">Actualiser</button>
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <div className={`p-3 space-y-3 ${maxHeight} overflow-y-auto custom-scrollbar`}>
          {isLoading && jobs.length === 0 ? (
            <div className="flex justify-center py-6"><span className="loading loading-spinner text-primary"></span></div>
          ) : hasNoJobs ? (
            <div className="text-center py-10 text-white/20 text-[10px] uppercase font-bold tracking-widest">
               Aucun flux actif
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobItem 
                key={job.id} 
                job={job}
                onJobClick={onJobClick}
                onRetry={() => retryJob?.(job.id)}
                onPause={() => pauseJob?.(job.id)}
                onResume={() => resumeJob?.(job.id)}
                getStatusText={getStatusText}
                getJobStatusColor={getJobStatusColor}
                getProgressColor={getProgressColor}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};