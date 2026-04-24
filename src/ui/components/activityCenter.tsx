'use client';

import { useState } from 'react';
import { Activity, Wifi, WifiOff, Clock, AlertCircle, X } from 'lucide-react';
import { useGlobalJobs } from '@/lib/contexts/JobContext';
import { useGlobalSocket } from '@/lib/contexts/SocketContext';
import { EncodingJobsMonitor } from './EncodingJobsMonitor';

export const ActivityCenter = () => {
  const { activeCount, failedCount } = useGlobalJobs();
  const { isConnected } = useGlobalSocket();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bouton d'ouverture */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`group relative flex items-center gap-3 px-4 py-2 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm hover:from-gray-800 hover:to-gray-800 border transition-all duration-300 rounded-full shadow-lg hover:shadow-xl ${
          isConnected 
            ? 'border-gray-600 hover:border-primary/50' 
            : 'border-red-500/50 bg-red-500/10'
        }`}
      >
        <div className="relative">
          <div className={`p-0.5 rounded-full transition-all duration-300 ${
            activeCount > 0 ? 'bg-primary/20' : ''
          }`}>
            <Activity className={`w-4 h-4 transition-all duration-300 ${
              activeCount > 0 
                ? 'text-primary animate-pulse' 
                : isConnected ? 'text-gray-400' : 'text-red-400'
            }`} />
          </div>
          
          <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-gray-900 transition-all duration-300 ${
            isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
          }`} />
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <div className={`text-xs font-bold tracking-wide ${
              activeCount > 0 ? 'text-primary' : 'text-gray-400'
            }`}>
              {activeCount}
            </div>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              En cours
            </span>
          </div>
          
          {failedCount > 0 && (
            <>
              <div className="w-px h-3 bg-gray-700" />
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-bold text-red-400">
                  {failedCount}
                </div>
                <span className="text-[10px] font-medium text-red-400/70 uppercase tracking-wider">
                  Échecs
                </span>
              </div>
            </>
          )}
        </div>
      </button>

      {/* Modal/Panel avec bouton de fermeture */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-200" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Panel */}
          <div className="fixed right-4 top-20 w-[500px] md:w-[600px] bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-right-8 duration-200">
            
            {/* Header avec bouton de fermeture */}
            <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200">
                  Centre d&apos;activité
                </h3>
                <div className="flex items-center gap-2">
                  {/* Statut de connexion */}
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isConnected 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {isConnected ? (
                      <>
                        <Wifi className="w-2.5 h-2.5" />
                        <span>Connecté</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-2.5 h-2.5" />
                        <span>Déconnecté</span>
                      </>
                    )}
                  </div>
                  
                  {/* Bouton de fermeture */}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
              
              {/* Alerte déconnexion */}
              {!isConnected && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-[10px] text-red-300 font-medium">
                    Connexion au serveur perdue - Les mises à jour en temps réel sont interrompues
                  </p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="max-h-[550px] overflow-y-auto custom-scrollbar">
              <EncodingJobsMonitor 
                showHeader={true}
                showFilters={true}
                title="Flux de rendu"
                maxHeight="max-h-none"
                className="border-none shadow-none bg-transparent"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-gray-800 bg-gray-900/30">
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Mises à jour en temps réel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  <span>{isConnected ? 'Live' : 'En pause'}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};