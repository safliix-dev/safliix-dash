'use client';

import { memo } from 'react';
import { Film, Tv, Pause, Play, RotateCcw } from 'lucide-react';
import type { EncodingJob } from '@/types/api/job';

interface JobItemProps {
  job: EncodingJob;
  onJobClick?: (job: EncodingJob) => void;
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  dotClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  barClass: string;
  pulse: boolean;
}> = {
  processing: {
    label: 'Encodage',
    dotClass: 'bg-primary',
    borderClass: 'border-l-primary',
    bgClass: 'hover:bg-primary/5',
    textClass: 'text-primary',
    barClass: 'bg-primary',
    pulse: true,
  },
  completed: {
    label: 'Terminé',
    dotClass: 'bg-success',
    borderClass: 'border-l-success',
    bgClass: 'hover:bg-success/5',
    textClass: 'text-success',
    barClass: 'bg-success',
    pulse: false,
  },
  failed: {
    label: 'Échec',
    dotClass: 'bg-error',
    borderClass: 'border-l-error',
    bgClass: 'hover:bg-error/5',
    textClass: 'text-error',
    barClass: 'bg-error',
    pulse: false,
  },
  paused: {
    label: 'En pause',
    dotClass: 'bg-warning',
    borderClass: 'border-l-warning',
    bgClass: 'hover:bg-warning/5',
    textClass: 'text-warning',
    barClass: 'bg-warning',
    pulse: false,
  },
};

const getConfig = (status: string) =>
  STATUS_CONFIG[status] ?? STATUS_CONFIG['processing'];

const formatStage = (stage: string) =>
  stage.replace(/_/g, ' ').toLowerCase();

export const JobItem = memo(({ job, onJobClick, onRetry, onPause, onResume }: JobItemProps) => {
  const cfg = getConfig(job.status);
  const isProcessing = job.status === 'processing';

  return (
    <div
      className={`group relative rounded-xl border border-white/5 border-l-2 ${cfg.borderClass} bg-white/[0.02] ${cfg.bgClass} p-4 cursor-pointer transition-all duration-300 animate-fade-in`}
      onClick={() => onJobClick?.(job)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5">
            {job.type === 'SERIES' || job.type === 'SERIE'
              ? <Tv className="w-3.5 h-3.5 text-white/30" />
              : <Film className="w-3.5 h-3.5 text-white/30" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/85 truncate leading-tight">
              {job.title || 'Sans titre'}
            </p>
            <p className="text-[9px] text-white/20 font-mono mt-0.5 tracking-tight">
              {job.id.slice(0, 8)}…
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/8">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass} ${cfg.pulse ? 'animate-pulse' : ''}`} />
          <span className={`text-[9px] font-bold uppercase tracking-widest ${cfg.textClass}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Progress section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/25 uppercase tracking-widest font-medium">
            {isProcessing && job.stage
              ? formatStage(job.stage)
              : isProcessing
              ? 'initialisation…'
              : '—'}
          </span>
          <span className={`text-xs font-bold tabular-nums ${cfg.textClass}`}>
            {job.progress}%
          </span>
        </div>

        {/* Custom animated progress bar */}
        <div className="relative h-[3px] rounded-full bg-white/6 overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${cfg.barClass} transition-[width] duration-700 ease-out`}
            style={{ width: `${job.progress}%` }}
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>
      </div>

      {/* Action buttons (appear on hover) */}
      <div className="mt-3 flex justify-end gap-1.5 h-0 overflow-hidden group-hover:h-auto group-hover:overflow-visible opacity-0 group-hover:opacity-100 transition-all duration-200">
        {job.status === 'failed' && (
          <button
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wider transition-all`}
            onClick={(e) => { e.stopPropagation(); onRetry?.(); }}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Réessayer
          </button>
        )}
        {job.status === 'processing' && (
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 text-[9px] font-bold uppercase tracking-wider transition-all"
            onClick={(e) => { e.stopPropagation(); onPause?.(); }}
          >
            <Pause className="w-2.5 h-2.5" />
            Pause
          </button>
        )}
        {job.status === 'paused' && (
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wider transition-all"
            onClick={(e) => { e.stopPropagation(); onResume?.(); }}
          >
            <Play className="w-2.5 h-2.5" />
            Reprendre
          </button>
        )}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.job.id === next.job.id &&
  prev.job.progress === next.job.progress &&
  prev.job.status === next.job.status &&
  prev.job.stage === next.job.stage
);

JobItem.displayName = 'JobItem';
