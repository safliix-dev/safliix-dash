// lib/components/SocketIndicator.tsx
import { useGlobalSocket } from '@/lib/contexts/SocketContext';

interface SocketIndicatorProps {
  /** Override l'état de connexion (utile pour les tests) */
  isConnected?: boolean;
  /** Override l'état d'authentification (utile pour les tests) */
  isAuthenticated?: boolean;
  /** Dernière mise à jour reçue via WebSocket */
  lastUpdate?: Date | null;
  /** Taille du composant */
  size?: 'sm' | 'md' | 'lg';
  /** Afficher le texte ou seulement le dot */
  showLabel?: boolean;
  /** Variante d'affichage */
  variant?: 'full' | 'compact' | 'minimal';
}

export const SocketIndicator = ({ 
  isConnected: propIsConnected,
  isAuthenticated: propIsAuthenticated,
  lastUpdate,
  size = 'md',
  showLabel = true,
  variant = 'full'
}: SocketIndicatorProps) => {
  const { isConnected: globalIsConnected, isAuthenticated: globalIsAuthenticated } = useGlobalSocket();
  
  const isConnected = propIsConnected ?? globalIsConnected;
  const isAuthenticated = propIsAuthenticated ?? globalIsAuthenticated;
  
  const isActive = isConnected && isAuthenticated;
  const isPending = isConnected && !isAuthenticated;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px] gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2.5'
  };
  
  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };
  
  const statusClasses = isActive
    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
    : isPending
      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      : 'bg-red-500/20 text-red-400 border border-red-500/30';
  
  const dotClasses = `${dotSizeClasses[size]} rounded-full ${
    isActive ? 'bg-green-400 animate-pulse' 
    : isPending ? 'bg-yellow-400 animate-pulse'
    : 'bg-red-400'
  }`;
  
  const getLabel = () => {
    if (variant === 'compact') {
      return isActive ? 'Live' : isPending ? 'Conn.' : 'Off';
    }
    return isActive ? 'Temps réel actif' : isPending ? 'Authentification...' : 'Déconnecté';
  };
  
  return (
    <div className={`flex items-center rounded-full transition-colors duration-300 ${sizeClasses[size]} ${statusClasses}`}>
      <span className={dotClasses} />
      
      {showLabel && variant !== 'minimal' && (
        <span className="font-medium">
          {getLabel()}
        </span>
      )}
      
      {lastUpdate && isActive && variant === 'full' && (
        <span className="text-white/40 text-[10px] ml-1 border-l border-white/10 pl-2">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};