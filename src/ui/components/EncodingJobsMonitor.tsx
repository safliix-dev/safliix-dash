// ui/components/EncodingJobsMonitor.tsx
'use client';

import { useState, useEffect } from 'react';
import { useEncodingJobs } from '@/lib/hooks/useEncodingJobs';
import type { EncodingJob } from '@/types/api/job';

interface EncodingJobsMonitorProps {
  room: "movies" | "episodes" | "series";
  jobType: "MOVIE" | "EPISODE" | "SERIE";
  title?: string;
  showHeader?: boolean;
  maxHeight?: string;
  className?: string;
  onJobClick?: (job: EncodingJob) => void;
  onConnectionChange?: (connected: boolean, authenticated: boolean) => void;
}

export const EncodingJobsMonitor = ({
  room,
  jobType,
  title = "Tâches d'encodage",
  showHeader = true,
  maxHeight = "max-h-96",
  className = "",
  onJobClick,
  onConnectionChange
}: EncodingJobsMonitorProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const {
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
  } = useEncodingJobs({ room, jobType });

  // Notifier les changements de connexion
  useEffect(() => {
    onConnectionChange?.(socketConnected, isAuthenticated);
  }, [socketConnected, isAuthenticated, onConnectionChange]);

  const hasNoJobs = jobs.length === 0 && !isLoading;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return '🎬';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'paused': return '⏸️';
      default: return '📋';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing': return 'Encodage en cours';
      case 'completed': return 'Encodage terminé';
      case 'failed': return 'Échec d\'encodage';
      case 'paused': return 'En pause';
      default: return 'En attente';
    }
  };

  return (
    <div className={`bg-neutral rounded-2xl border border-base-300 p-4 shadow-sm ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-white/50">Encodage</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {activeJobsCount > 0 && (
                <span className="badge badge-sm badge-warning animate-pulse">
                  {activeJobsCount} en cours
                </span>
              )}
              {completedJobsCount > 0 && (
                <span className="badge badge-sm badge-success">
                  {completedJobsCount} terminés
                </span>
              )}
              {failedJobsCount > 0 && (
                <span className="badge badge-sm badge-error">
                  {failedJobsCount} échoués
                </span>
              )}
              {socketConnected && isAuthenticated && activeJobsCount > 0 && (
                <span className="badge badge-xs badge-success gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Live
                </span>
              )}
              {hasNoJobs && socketConnected && isAuthenticated && (
                <span className="badge badge-xs badge-info gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Connecté
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span>
              Source: {socketConnected && isAuthenticated ? 'WebSocket (temps réel)' : 'API (polling)'}
            </span>
            {lastUpdate && socketConnected && (
              <span className="text-white/40 text-[10px]">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <label className="flex items-center gap-2 cursor-pointer text-white/70">
              <span>{isExpanded ? "Masquer" : "Afficher"}</span>
              <input 
                type="checkbox" 
                className="toggle toggle-primary toggle-sm" 
                checked={isExpanded} 
                onChange={() => setIsExpanded(!isExpanded)} 
              />
            </label>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className={`mt-3 space-y-3 ${maxHeight} overflow-y-auto custom-scrollbar`}>
          {isLoading && jobs.length === 0 ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="ml-2 text-xs text-white/50">Chargement des tâches...</span>
            </div>
          ) : hasNoJobs ? (
            <div className="text-center py-4 text-white/40 text-sm">
              Aucune tâche d&apos;encodage en cours
            </div>
          ) : (
            jobs.map((job) => (
              <div 
                key={job.id} 
                className={`rounded-xl border p-3 space-y-2 transition-all cursor-pointer hover:shadow-lg ${getJobStatusColor(job.status)}`}
                onClick={() => onJobClick?.(job)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white/70">{job.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {getStatusIcon(job.status)} {getStatusText(job.status)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-white/50">{job.startedAt}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                      <span>Progression</span>
                      <span className="font-mono">{job.progress}%</span>
                    </div>
                    <progress 
                      className={`progress w-full ${getProgressColor(job.status)}`} 
                      value={job.progress} 
                      max="100"
                    ></progress>
                  </div>
                  
                  {/* ✅ Actions temporairement désactivées si non implémentées */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {job.status === 'failed' && retryJob && (
                      <button 
                        className="btn btn-xs btn-primary" 
                        onClick={() => retryJob(job.id)}
                      >
                        Relancer
                      </button>
                    )}
                    
                    {job.status !== 'completed' && job.status !== 'failed' && (
                      <>
                        <button 
                          className="btn btn-xs btn-ghost text-white/60 hover:text-white/80" 
                          onClick={() => failJob?.(job.id)}
                        >
                          Échouer
                        </button>
                        
                        {job.status === 'processing' ? (
                          <button 
                            className="btn btn-xs btn-warning text-white" 
                            onClick={() => pauseJob?.(job.id)}
                          >
                            Pause
                          </button>
                        ) : job.status === 'paused' ? (
                          <button 
                            className="btn btn-xs btn-primary" 
                            onClick={() => resumeJob?.(job.id)}
                          >
                            Reprendre
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};