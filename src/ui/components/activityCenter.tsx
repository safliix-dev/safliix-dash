'use client';

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useGlobalJobs } from '@/lib/contexts/JobContext';
import { useGlobalSocket } from '@/lib/contexts/SocketContext'; // Pour l'état de connexion
import { EncodingJobsMonitor } from './EncodingJobsMonitor';

export const ActivityCenter = () => {
  const { activeCount, failedCount } = useGlobalJobs();
  const { isConnected } = useGlobalSocket(); // On récupère l'état de la connexion
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 border transition-all rounded-full active:scale-95 group ${
          isConnected ? 'border-gray-700' : 'border-error/50 bg-error/5'
        }`}
      >
        {/* Indicateur de connexion + Icone */}
        <div className="relative">
          <Activity className={`w-3.5 h-3.5 ${activeCount > 0 ? 'text-primary animate-pulse' : 'text-gray-500'}`} />
          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-gray-900 ${
            isConnected ? 'bg-success' : 'bg-error'
          }`} />
        </div>

        <div className="flex gap-2 text-[11px] font-bold items-center">
          <span className={activeCount > 0 ? 'text-primary' : 'text-gray-400'}>
            {activeCount} EN COURS
          </span>
          {failedCount > 0 && (
            <span className="text-error bg-error/10 px-1.5 rounded text-[9px]">
              {failedCount} ERR
            </span>
          )}
        </div>
      </button>

      {/* Le Moniteur unique en mode Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-96 bg-gray-900 border border-gray-700 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Petit bandeau d'état de connexion à l'intérieur du menu */}
            {!isConnected && (
              <div className="bg-error/20 text-error text-[10px] py-1 text-center font-bold">
                DÉCONNECTÉ DU SERVEUR
              </div>
            )}

            <EncodingJobsMonitor 
              showHeader={true}
              showFilters={true}
              title="Flux de rendu"
              maxHeight="max-h-[450px]"
              className="border-none shadow-none"
            />
          </div>
        </>
      )}
    </div>
  );
};