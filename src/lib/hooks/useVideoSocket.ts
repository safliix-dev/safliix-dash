// lib/hooks/useJobSocket.ts - Version stable sans compteur
import { useEffect, useRef, useState, useCallback } from "react";
import { videoSocket } from "@/lib/socket/socket-client";
import { websocketAuth } from "@/services/websocket-auth.service";
import type { JobProgressPayload, JobRoom } from "@/types/socket";

interface UseJobSocketProps {
  room: JobRoom;
  accessToken: string | undefined;
  onJobUpdate: (data: JobProgressPayload) => void;
  onError?: (error: { message: string; code: string }) => void;
  autoConnect?: boolean;
}

export const useJobSocket = ({ 
  room, 
  onJobUpdate, 
  onError,
  autoConnect = true 
}: UseJobSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const onJobUpdateRef = useRef(onJobUpdate);
  onJobUpdateRef.current = onJobUpdate;

  const connect = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const wsToken = await websocketAuth.getValidToken();
      
      if (!wsToken) {
        throw new Error('Impossible d\'obtenir le token WebSocket');
      }
      
      videoSocket.auth = { token: wsToken };
      
      if (!videoSocket.connected) {
        videoSocket.connect();
      } else if (videoSocket.connected && !isAuthenticated) {
        // Déjà connecté mais pas authentifié
        videoSocket.emit("authenticate", { token: wsToken });
      }
      
    } catch (error) {
      console.error(`❌ [${room}] Erreur de connexion:`, error);
      onError?.({ 
        message: error instanceof Error ? error.message : 'Erreur inconnue', 
        code: 'CONNECTION_ERROR' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [room, isAuthenticated, isLoading, onError]);

  const disconnect = useCallback(() => {
    if (videoSocket.connected) {
      videoSocket.disconnect();
    }
    setIsConnected(false);
    setIsAuthenticated(false);
  }, []);

  const reconnect = useCallback(async () => {
    console.log(`🔄 [${room}] Reconnexion...`);
    websocketAuth.invalidateToken();
    disconnect();
    await connect();
  }, [room, connect, disconnect]);

  // Effet principal - sans compteur
  useEffect(() => {
    const roomName = room;
    
    console.log(`📡 [${roomName}] Initialisation du hook`);

    const onConnect = () => {
      console.log(`✅ [${roomName}] Socket connecté`);
      setIsConnected(true);
    };

    const onAuthenticated = (data: { message: string }) => {
      console.log(`✅ [${roomName}] Authentifié:`, data.message);
      setIsAuthenticated(true);
      videoSocket.emit("join_room", { room: roomName });
    };

    const onDisconnect = (reason: string) => {
      console.log(`❌ [${roomName}] Déconnecté: ${reason}`);
      setIsConnected(false);
      setIsAuthenticated(false);
    };

    const onJobProgress = (data: JobProgressPayload) => {
      onJobUpdateRef.current(data);
    };

    const onSocketError = (error: { message: string; code: string }) => {
      console.error(`🚨 [${roomName}] Erreur:`, error);
      onError?.(error);
      
      if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
        reconnect();
      }
    };

    videoSocket.on("connect", onConnect);
    videoSocket.on("authenticated", onAuthenticated);
    videoSocket.on("disconnect", onDisconnect);
    videoSocket.on("job_progress", onJobProgress);
    videoSocket.on("error", onSocketError);

    if (autoConnect && !videoSocket.connected) {
      console.log(`🚀 [${roomName}] Connexion auto`);
      connect();
    }

    return () => {
      console.log(`🧹 [${roomName}] Nettoyage - suppression des écouteurs`);
      videoSocket.off("connect", onConnect);
      videoSocket.off("authenticated", onAuthenticated);
      videoSocket.off("disconnect", onDisconnect);
      videoSocket.off("job_progress", onJobProgress);
      videoSocket.off("error", onSocketError);
      // ✅ NE PAS DÉCONNECTER LE SOCKET ICI
    };
  }, [room, autoConnect, connect, reconnect, onError]);

  return { 
    isConnected, 
    isAuthenticated, 
    isLoading,
    connect,
    disconnect,
    reconnect 
  };
};