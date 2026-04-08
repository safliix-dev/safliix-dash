// lib/hooks/useJobSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { videoSocket } from "@/lib/socket/socket-client";
import { websocketAuth } from "@/services/websocket-auth.service";
import type { JobProgressPayload, JobRoom } from "@/types/socket";

const roomRefCounter = new Map<string, number>();

interface UseJobSocketProps {
  room: JobRoom;
  accessToken: string | undefined;
  onJobUpdate: (data: JobProgressPayload) => void;
  onError?: (error: { message: string; code: string }) => void;
  autoConnect?: boolean;
}

export const useJobSocket = ({ 
  room, 
  accessToken,
  onJobUpdate, 
  onError,
  autoConnect = true 
}: UseJobSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const onJobUpdateRef = useRef(onJobUpdate);
  onJobUpdateRef.current = onJobUpdate;

  /**
   * Connexion au WebSocket
   */
  const connect = useCallback(async () => {
    if (!accessToken) {
      console.log(`⏳ [${room}] En attente du token...`);
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Mettre à jour l'accessToken dans le service
      websocketAuth.setAccessToken(accessToken);
      
      // 2. Récupérer le token WebSocket
      const wsToken = await websocketAuth.getValidToken();
      
      if (!wsToken) {
        throw new Error('Impossible d\'obtenir le token WebSocket');
      }
      
      // 3. Configurer et connecter le socket
      videoSocket.auth = { token: wsToken };
      
      if (!videoSocket.connected) {
        videoSocket.connect();
      } else if (videoSocket.connected && !isAuthenticated) {
        videoSocket.disconnect();
        videoSocket.connect();
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
  }, [accessToken, room, isAuthenticated, onError]);

  /**
   * Déconnexion
   */
  const disconnect = useCallback(() => {
    if (videoSocket.connected) {
      videoSocket.disconnect();
    }
    setIsConnected(false);
    setIsAuthenticated(false);
  }, []);

  /**
   * Reconnexion forcée
   */
  const reconnect = useCallback(async () => {
    console.log(`🔄 [${room}] Reconnexion...`);
    websocketAuth.invalidateToken();
    disconnect();
    await connect();
  }, [room, connect, disconnect]);

  // Effet pour la gestion du token d'accès
  useEffect(() => {
    if (accessToken && autoConnect) {
      console.log(`🔐 [${room}] Token disponible, connexion...`);
      connect();
    } else if (!accessToken) {
      console.log(`🔓 [${room}] Plus de token, déconnexion...`);
      disconnect();
    }
  }, [accessToken, room, connect, disconnect, autoConnect]);

  // Effet pour la gestion du socket
  useEffect(() => {
    const roomName = room;
    
    // Incrémenter le compteur de références
    const count = (roomRefCounter.get(roomName) || 0) + 1;
    roomRefCounter.set(roomName, count);
    console.log(`📊 [${roomName}] Références: ${count}`);

    // Handlers
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
      
      // Reconnexion auto si nécessaire
      if (reason === 'io server disconnect' && autoConnect && accessToken) {
        setTimeout(connect, 2000);
      }
    };

    const onJobProgress = (data: JobProgressPayload) => {
      onJobUpdateRef.current(data);
    };

    const onSocketError = (error: { message: string; code: string }) => {
      console.error(`🚨 [${roomName}] Erreur:`, error);
      onError?.(error);
      
      // Gestion des erreurs d'auth
      if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
        reconnect();
      }
    };

    // Subscribe aux événements
    videoSocket.on("connect", onConnect);
    videoSocket.on("authenticated", onAuthenticated);
    videoSocket.on("disconnect", onDisconnect);
    videoSocket.on("job_progress", onJobProgress);
    videoSocket.on("error", onSocketError);

    // Cleanup
    return () => {
      console.log(`🧹 [${roomName}] Nettoyage`);
      
      videoSocket.off("connect", onConnect);
      videoSocket.off("authenticated", onAuthenticated);
      videoSocket.off("disconnect", onDisconnect);
      videoSocket.off("job_progress", onJobProgress);
      videoSocket.off("error", onSocketError);

      // Décrémenter le compteur
      const newCount = (roomRefCounter.get(roomName) || 1) - 1;
      
      if (newCount <= 0) {
        roomRefCounter.delete(roomName);
        if (videoSocket.connected && isAuthenticated) {
          videoSocket.emit("leave_room", { room: roomName });
        }
        
        // Déconnecter si plus aucune room active
        if (roomRefCounter.size === 0) {
          console.log(`🔌 Plus de rooms actives, déconnexion`);
          videoSocket.disconnect();
        }
      } else {
        roomRefCounter.set(roomName, newCount);
      }
    };
  }, [room, autoConnect, accessToken, connect, reconnect, isAuthenticated, onError]);

  return { 
    isConnected, 
    isAuthenticated, 
    isLoading,
    connect,
    disconnect,
    reconnect 
  };
};