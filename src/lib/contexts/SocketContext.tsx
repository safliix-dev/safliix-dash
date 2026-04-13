// lib/contexts/SocketContext.tsx
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { videoSocket } from '@/lib/socket/socket-client';

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

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SocketState>(() => ({
    isConnected: videoSocket.connected,
    isAuthenticated: false,
    error: null,
  }));

  const disconnect = useCallback(() => {
    videoSocket.disconnect();
    setState(prev => ({ ...prev, isConnected: false, isAuthenticated: false }));
  }, []);

  const reconnect = useCallback(() => {
    videoSocket.connect();
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    const onConnect = () => {
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    };

    const onDisconnect = () => {
      setState(prev => ({ ...prev, isConnected: false, isAuthenticated: false }));
    };

    const onAuthenticated = () => {
      setState(prev => ({ ...prev, isAuthenticated: true }));
    };

    const onConnectError = (error: Error) => {
      setState(prev => ({ ...prev, error: error.message }));
    };

    videoSocket.on('connect', onConnect);
    videoSocket.on('disconnect', onDisconnect);
    videoSocket.on('authenticated', onAuthenticated);
    videoSocket.on('connect_error', onConnectError);

    return () => {
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