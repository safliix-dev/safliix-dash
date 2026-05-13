// ui/components/JobItem.tsx
'use client';

import React, { memo } from 'react';
import type { EncodingJob } from '@/types/api/job';

interface JobItemProps {
  job: EncodingJob;
  onJobClick?: (job: EncodingJob) => void;
  onRetry?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  getStatusText: (status: string) => string;
  getJobStatusColor: (status: string) => string;
  getProgressColor: (status: string) => string;
}

export const JobItem = memo(({ 
  job, 
  onJobClick, 
  onRetry, 
  onPause, 
  onResume,
  getStatusText,
  getJobStatusColor,
  getProgressColor
}: JobItemProps) => {
  
  return (
    <div 
      className={`group rounded-xl border p-3 space-y-3 transition-all hover:border-white/20 cursor-pointer ${getJobStatusColor(job.status)}`}
      onClick={() => onJobClick?.(job)}
    >
      <div className="flex justify-between items-start">
        <div className="max-w-[70%]">
          <h4 className="text-sm font-medium text-white truncate">{job.title}</h4>
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-tighter">
            ID: {job.id.split('-')[0]}...
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/50 uppercase font-bold tracking-widest">
            {getStatusText(job.status)}
          </div>
         
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-white/40 italic">
            {job.status === 'processing'
              ? (job.stage ? `étape : ${job.stage}` : 'Calcul en cours...')
              : 'Statique'}
          </span>
          <span className="font-bold text-primary">{job.progress}%</span>
        </div>
        <progress 
          className={`progress w-full h-1.5 ${getProgressColor(job.status)} transition-all duration-500`} 
          value={job.progress} 
          max="100"
        ></progress>
      </div>

      <div className="flex justify-end gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {job.status === 'failed' && (
          <button 
            className="btn btn-xs btn-primary font-bold"
            onClick={(e) => { e.stopPropagation(); onRetry?.(job.id); }}
          >
            Réessayer
          </button>
        )}
        {job.status === 'processing' && (
          <button 
            className="btn btn-xs btn-warning text-black font-bold"
            onClick={(e) => { e.stopPropagation(); onPause?.(job.id); }}
          >
            Pause
          </button>
        )}
        {job.status === 'paused' && (
          <button 
            className="btn btn-xs btn-primary font-bold"
            onClick={(e) => { e.stopPropagation(); onResume?.(job.id); }}
          >
            Reprendre
          </button>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  // On ne re-rend que si ces valeurs critiques changent
  return (
    prev.job.id === next.job.id &&
    prev.job.progress === next.job.progress &&
    prev.job.status === next.job.status 
  );
});

JobItem.displayName = 'JobItem';