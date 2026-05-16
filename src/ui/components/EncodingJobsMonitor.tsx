'use client';

import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useGlobalJobs } from '@/lib/contexts/JobContext';
import { JobItem } from './jobItem';
import type { EncodingJob } from '@/types/api/job';

interface EncodingJobsMonitorProps {
  title?: string;
  showHeader?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
  className?: string;
  onJobClick?: (job: EncodingJob) => void;
}

const FILTERS = [
  { key: 'all',        label: 'Tous'      },
  { key: 'processing', label: 'En cours'  },
  { key: 'completed',  label: 'Terminés'  },
  { key: 'failed',     label: 'Échecs'    },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

export const EncodingJobsMonitor = ({
  title = "Flux global d'encodage",
  showHeader = true,
  showFilters = false,
  maxHeight = 'max-h-96',
  className = '',
  onJobClick,
}: EncodingJobsMonitorProps) => {
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');

  const { jobs, isLoading, activeCount, completedCount, failedCount, refreshAll, pauseJob, resumeJob, retryJob } = useGlobalJobs();

  const filteredJobs = useMemo(() => {
    const sorted = [...jobs].sort((a, b) => {
      const priority: Record<string, number> = { processing: 0, paused: 1, failed: 2, completed: 3 };
      return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
    });
    if (statusFilter === 'all') return sorted;
    return sorted.filter(j => j.status === statusFilter);
  }, [jobs, statusFilter]);

  const countFor = (key: FilterKey) => {
    if (key === 'all')        return jobs.length;
    if (key === 'processing') return activeCount;
    if (key === 'completed')  return completedCount;
    if (key === 'failed')     return failedCount;
    return 0;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {showHeader && (
        <div className="px-5 py-4 space-y-3">
          {/* Title + refresh */}
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
              {title}
            </h3>
            <button
              onClick={refreshAll}
              className="p-1 rounded-md text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
              title="Actualiser"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary tabular-nums">{activeCount}</span>
              <span className="text-[9px] text-primary/60 uppercase tracking-widest">actifs</span>
            </div>
            {completedCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20">
                <span className="text-[10px] font-bold text-success tabular-nums">{completedCount}</span>
                <span className="text-[9px] text-success/60 uppercase tracking-widest">finis</span>
              </div>
            )}
            {failedCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-error/10 border border-error/20">
                <span className="text-[10px] font-bold text-error tabular-nums">{failedCount}</span>
                <span className="text-[9px] text-error/60 uppercase tracking-widest">échecs</span>
              </div>
            )}
          </div>

          {/* Filter tabs */}
          {showFilters && (
            <div className="flex gap-1">
              {FILTERS.map(f => {
                const count = countFor(f.key);
                const isActive = statusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all duration-200 border ${
                      isActive
                        ? 'bg-white/8 text-white/80 border-white/15'
                        : 'text-white/25 border-transparent hover:text-white/45 hover:bg-white/4'
                    }`}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={`px-1 rounded text-[8px] tabular-nums ${
                        isActive ? 'bg-white/15 text-white/70' : 'bg-white/8 text-white/30'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Job list */}
      <div className={`px-4 pb-4 space-y-2 ${maxHeight} overflow-y-auto custom-scrollbar`}>
        {isLoading && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span className="text-[9px] text-white/20 uppercase tracking-widest">Chargement…</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-white/15 text-lg">∅</span>
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">
              Aucun flux actif
            </span>
          </div>
        ) : (
          filteredJobs.map(job => (
            <JobItem
              key={job.id}
              job={job}
              onJobClick={onJobClick}
              onRetry={() => retryJob?.(job.id)}
              onPause={() => pauseJob?.(job.id)}
              onResume={() => resumeJob?.(job.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
