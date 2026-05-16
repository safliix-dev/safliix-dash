'use client';

import { useState } from 'react';
import { Activity, Wifi, WifiOff, X, Zap } from 'lucide-react';
import { useGlobalJobs } from '@/lib/contexts/JobContext';
import { useGlobalSocket } from '@/lib/contexts/SocketContext';
import { EncodingJobsMonitor } from './EncodingJobsMonitor';

export const ActivityCenter = () => {
  const { activeCount, failedCount } = useGlobalJobs();
  const { isConnected } = useGlobalSocket();
  const [isOpen, setIsOpen] = useState(false);

  const isActive  = activeCount > 0;
  const hasErrors = failedCount > 0;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`relative flex items-center gap-2 px-3.5 py-2 rounded-full border backdrop-blur-md transition-all duration-300 ${
          isActive
            ? 'bg-primary/10 border-primary/30 animate-active-glow'
            : 'bg-white/4 border-white/8 hover:bg-white/6 hover:border-white/15'
        }`}
      >
        {/* Connection dot */}
        <span
          className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-black transition-colors ${
            isConnected ? 'bg-success' : 'bg-error'
          }`}
        />

        <Activity className={`w-3.5 h-3.5 transition-colors ${
          isActive ? 'text-primary' : 'text-white/30'
        }`} />

        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold tabular-nums transition-colors ${
            isActive ? 'text-primary' : 'text-white/30'
          }`}>
            {activeCount}
          </span>
          <span className="text-[9px] text-white/20 uppercase tracking-widest hidden sm:block">
            en cours
          </span>
        </div>

        {hasErrors && (
          <span className="px-1.5 py-0.5 rounded-full bg-error/15 border border-error/25 text-error text-[9px] font-bold tabular-nums">
            {failedCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating panel */}
          <div className="fixed right-4 top-[4.5rem] w-[480px] z-50 rounded-2xl border border-white/8 bg-[#0d0d0d] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-white/15'}`} />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
                  Centre d&apos;activité
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Connection badge */}
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  isConnected
                    ? 'bg-success/8 text-success border-success/20'
                    : 'bg-error/8 text-error border-error/20'
                }`}>
                  {isConnected
                    ? <Wifi className="w-2.5 h-2.5" />
                    : <WifiOff className="w-2.5 h-2.5" />
                  }
                  <span>{isConnected ? 'Live' : 'Hors ligne'}</span>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[540px] overflow-y-auto custom-scrollbar">
              <EncodingJobsMonitor
                showHeader
                showFilters
                title="Flux de rendu"
                maxHeight="max-h-none"
                className="border-none shadow-none bg-transparent"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5">
              <span className="text-[9px] text-white/15 uppercase tracking-widest">
                Mises à jour en temps réel
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-primary animate-pulse' : 'bg-white/10'
              }`} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
