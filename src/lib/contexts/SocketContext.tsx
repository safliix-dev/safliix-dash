// lib/contexts/SocketContext.tsx
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { videoSocket } from '@/lib/socket/socket-client';
import { websocketAuth } from "@/services/websocket-auth.service";

interface SocketState {
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface SocketContextValue extends SocketState {
  disconnect: () => void;
  reconnect: () => void;
  clearError: () => void;
}

// Types pour les événements socket
interface AuthenticatedEvent {
  message: string;
  userId: string;
}

interface ConnectErrorEvent extends Error {
  message: string;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SocketState>(() => ({
    isConnected: videoSocket.connected,
    isAuthenticated: false,
    error: null,
  }));

  const disconnect = useCallback(() => {
    console.log('🔌 [SocketContext] Manual disconnect called');
    videoSocket.disconnect();
    setState(prev => ({ ...prev, isConnected: false, isAuthenticated: false }));
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 [SocketContext] Manual reconnect called');
    videoSocket.connect();
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearError = useCallback(() => {
    console.log('🧹 [SocketContext] Clearing error');
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    console.log('🎬 [SocketContext] useEffect initializing...');
    
    const initSocket = async () => {
      try {
        console.log('🔐 [SocketContext] Getting WebSocket token...');
        const wsToken = await websocketAuth.getValidToken();
        
        if (wsToken) {
          console.log('✅ [SocketContext] Token obtained, setting auth');
          videoSocket.auth = { token: wsToken };
          
          if (!videoSocket.connected) {
            console.log('🚀 [SocketContext] Connecting WebSocket...');
            //console.log('🔌 [SocketContext] Socket URL:', videoSocket.io?.uri);
            console.log('🏷️ [SocketContext] Socket connected state:', videoSocket.connected);
            videoSocket.connect();
          } else {
            console.log('✅ [SocketContext] Socket already connected');
          }
        } else {
          console.warn('⚠️ [SocketContext] No token received from websocketAuth');
        }
      } catch (err) {
        const error = err as Error;
        console.error('❌ [SocketContext] Failed to initialize socket:', error.message);
        setState(prev => ({ ...prev, error: "Erreur d'authentification WebSocket" }));
      }
    };

    initSocket();

    const onConnect = (): void => {
      console.log('🔌 [SocketContext] ✅ connect event - Socket connected');
      console.log('📡 [SocketContext] Socket ID:', videoSocket.id);
      // Utiliser io?.opts?.path pour avoir des infos sur la connexion
      //console.log('🔗 [SocketContext] Socket URI:', videoSocket.io?.uri);
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    };

    const onDisconnect = (reason: string): void => {
      console.log('🔌 [SocketContext] ❌ disconnect event - Reason:', reason);
      setState(prev => ({ ...prev, isConnected: false, isAuthenticated: false }));
    };

    const onAuthenticated = (data: AuthenticatedEvent): void => {
      console.log('✅ [SocketContext] authenticated event received:', data);
      console.log(`👤 [SocketContext] User ${data.userId} authenticated successfully`);
      setState(prev => ({ ...prev, isAuthenticated: true }));
    };

    const onConnectError = (error: ConnectErrorEvent): void => {
      console.error('❌ [SocketContext] connect_error event:', error.message);
      setState(prev => ({ ...prev, error: error.message }));
    };

    // Écouter tous les événements pour debug
    const onAnyEvent = (event: string, ...args: unknown[]): void => {
      console.log(`🔔 [SocketContext] ANY event: "${event}"`, args);
    };
    videoSocket.onAny(onAnyEvent);

    videoSocket.on('connect', onConnect);
    videoSocket.on('disconnect', onDisconnect);
    videoSocket.on('authenticated', onAuthenticated);
    videoSocket.on('connect_error', onConnectError);

    return (): void => {
      console.log('🧹 [SocketContext] Cleaning up listeners...');
      videoSocket.offAny(onAnyEvent);
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

export const useGlobalSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useGlobalSocket must be used within a SocketProvider');
  }
  return context;
};