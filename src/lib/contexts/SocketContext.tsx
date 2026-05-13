// lib/contexts/SocketContext.tsx
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { videoSocket } from '@/lib/socket/socket-client';
import { websocketAuth } from "@/services/websocket-auth.service";

interface SocketState {
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface SocketError extends Error {
  data?: {
    code?: number;
    message?: string;
  };
}

interface SocketContextValue extends SocketState {
  disconnect: () => void;
  reconnect: () => void;
  clearError: () => void;
}

interface AuthenticatedEvent { message: string; userId: string; }

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SocketState>({
    isConnected: videoSocket.connected,
    isAuthenticated: false,
    error: null,
  });

  const isInitializing = useRef(false);
  const isRefreshingToken = useRef(false);

  const disconnect = useCallback(() => {
    console.log('🔌 [SocketContext] Manual disconnect');
    videoSocket.disconnect();
  }, []);

  const reconnect = useCallback(async () => {
    console.log('🔄 [SocketContext] Manual reconnect');
    if (videoSocket.connected) return;
    const token = await websocketAuth.getValidToken();
    if (token) {
      videoSocket.auth = { token };
      videoSocket.connect();
    }
  }, []);

  const clearError = useCallback(() => setState(prev => ({ ...prev, error: null })), []);

  useEffect(() => {
    let isMounted = true;

    // --- 1. DÉFINITION DES HANDLERS ---
    const onConnect = () => {
      console.log('🔌 [SocketContext] ✅ Connected', videoSocket.id);
      if (isMounted) setState(prev => ({ ...prev, isConnected: true, error: null }));
    };

    const onDisconnect = (reason: string) => {
      console.log('🔌 [SocketContext] ❌ Disconnected:', reason);
      if (isMounted) setState(prev => ({ ...prev, isConnected: false, isAuthenticated: false }));
      
      // Si déconnexion par le serveur (token expiré par ex), on tente de reconnecter
      if (reason === "io server disconnect") {
        videoSocket.connect();
      }
    };

    const onAuthenticated = (data: AuthenticatedEvent) => {
      console.log('👤 [SocketContext] Authenticated:', data.userId);
      if (isMounted) setState(prev => ({ ...prev, isAuthenticated: true }));
    };

    const onConnectError = async (err: SocketError) => {
      console.error('❌ [SocketContext] Connection Error:', err.message);

      if (err.message === "unauthorized" || err.data?.code === 401) {
        // Verrou : un seul refresh à la fois pour éviter les appels concurrents
        if (isRefreshingToken.current) return;
        isRefreshingToken.current = true;
        console.log('🔑 [SocketContext] Auth error, refreshing token...');
        try {
          const wsToken = await websocketAuth.getValidToken();
          if (wsToken && isMounted) {
            videoSocket.auth = { token: wsToken };
            videoSocket.connect();
          }
        } finally {
          isRefreshingToken.current = false;
        }
      }

      if (isMounted) setState(prev => ({ ...prev, error: err.message }));
    };

    // --- 2. ATTACHER LES LISTENERS (AVANT TOUTE ACTION) ---
    videoSocket.on('connect', onConnect);
    videoSocket.on('disconnect', onDisconnect);
    videoSocket.on('authenticated', onAuthenticated);
    videoSocket.on('connect_error', onConnectError);

    // --- 3. INITIALISATION ---
    const init = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        // Si déjà connecté, on synchronise juste le state
        if (videoSocket.connected) {
          setState(prev => ({ ...prev, isConnected: true }));
          return;
        }

        const wsToken = await websocketAuth.getValidToken();
        if (wsToken && isMounted) {
          videoSocket.auth = { token: wsToken };
          videoSocket.connect();
        }
      } catch (err) {
        console.error("Failed to init socket auth", err);
      } finally {
        isInitializing.current = false;
      }
    };

    init();

    // --- 4. CLEANUP (ON ENLÈVE LES ÉCOUTEURS MAIS ON GARDE LA CONNEXION) ---
    return () => {
      isMounted = false;
      videoSocket.off('connect', onConnect);
      videoSocket.off('disconnect', onDisconnect);
      videoSocket.off('authenticated', onAuthenticated);
      videoSocket.off('connect_error', onConnectError);
    };
  }, []);

  const value = useMemo(() => ({
    ...state,
    disconnect,
    reconnect,
    clearError,
  }), [state, disconnect, reconnect, clearError]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useGlobalSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useGlobalSocket must be used within a SocketProvider');
  return context;
};