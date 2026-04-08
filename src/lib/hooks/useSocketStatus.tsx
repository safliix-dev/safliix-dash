  // lib/hooks/useSocketStatus.ts
  import { useState, useCallback } from 'react';

  // ✅ Définition de l'interface indispensable pour le typage des props
  interface SocketStatus {
    connected: boolean;
    authenticated: boolean;
    lastUpdate: Date | null;
  }

  // ✅ Le composant doit être à l'EXTÉRIEUR du hook
  // Utilise l'export si tu veux l'utiliser dans d'autres fichiers
  export const SocketIndicator = ({ 
    connected, 
    authenticated, 
    lastUpdate 
  }: SocketStatus) => {
    // Calcul de la classe pour plus de clarté et éviter les erreurs de template string complexes
    const statusClasses = connected && authenticated 
      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
      : connected
        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        : 'bg-red-500/20 text-red-400 border border-red-500/30';

    const dotClasses = connected && authenticated 
      ? 'bg-green-400 animate-pulse' 
      : connected
        ? 'bg-yellow-400 animate-pulse'
        : 'bg-red-400';

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors duration-300 ${statusClasses}`}>
        <span className={`w-2 h-2 rounded-full ${dotClasses}`}></span>
        <span>
          {connected && authenticated 
            ? 'Temps réel actif' 
            : connected 
              ? 'Authentification...' 
              : 'Déconnecté'}
        </span>
        {lastUpdate && connected && (
          <span className="text-white/40 text-[10px] ml-1">
            {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  };

  export const useSocketStatus = () => {
    const [status, setStatus] = useState<SocketStatus>({
      connected: false,
      authenticated: false,
      lastUpdate: null
    });

    const onConnectionChange = useCallback((connected: boolean, authenticated: boolean) => {
      setStatus(prev => ({
        connected,
        authenticated,
        lastUpdate: (connected && authenticated) ? new Date() : prev.lastUpdate
      }));
    }, []);

    return {
      ...status,
      onConnectionChange,
      indicatorProps: status // On retourne l'objet complet pour faire <SocketIndicator {...indicatorProps} />
    };
  };