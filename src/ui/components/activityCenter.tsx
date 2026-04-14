// ui/components/ActivityCenter.tsx
'use client';

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useGlobalJobs } from '@/lib/contexts/JobContext';
import { EncodingJobsMonitor } from './EncodingJobsMonitor'; // Ton composant existant

export const ActivityCenter = () => {
  const { activeCount, failedCount } = useGlobalJobs();
  const [isOpen, setIsOpen] = useState(false);

  // On n'affiche rien du tout si aucune activité (zéro job en base ou historique vide)
  // Mais généralement, on l'affiche dès qu'il y a un job "important" (actif ou échec)
  if (activeCount === 0 && failedCount === 0) return null;

  return (
    <div className="relative">
      {/* Le bouton déclencheur unique */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full transition-all active:scale-95 group hover:border-primary/50"
      >
        <Activity className={`w-3.5 h-3.5 ${activeCount > 0 ? 'text-primary animate-pulse' : 'text-error'}`} />
        <span className="text-[11px] font-bold text-white">ACTIVITÉ</span>
        {activeCount > 0 && (
           <span className="badge badge-primary badge-xs py-2 px-1.5 font-bold">{activeCount}</span>
        )}
      </button>

      {/* Le Moniteur unique en mode Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-96 bg-gray-800 border border-gray-700 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* On réutilise ton moniteur tel quel ! */}
            <EncodingJobsMonitor 
               showHeader={true} 
               title="Flux de rendu" 
               maxHeight="max-h-[450px]" 
            />
          </div>
        </>
      )}
    </div>
  );
};