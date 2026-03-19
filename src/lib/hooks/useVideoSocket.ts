// hooks/useJobSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { videoSocket } from "@/lib/socket/socket-client";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import type { JobProgressPayload, JobRoom } from "@/types/socket";

// Map pour stocker les compteurs de rooms
const roomRefCounter = new Map<string, number>();

export const useJobSocket = (
  room: JobRoom,
  onJobUpdate: (data: JobProgressPayload) => void
) => {
  const accessToken = useAccessToken();
  const [isConnected, setIsConnected] = useState(videoSocket.connected);
  
  const onJobUpdateRef = useRef(onJobUpdate);
  onJobUpdateRef.current = onJobUpdate;

  // ✅ Fonction pour configurer l'auth correctement
  const setupAuth = useCallback((token: string) => {
    // Différentes façons selon la version de socket.io-client
    
    // Méthode 1: Si .auth accepte un objet
    if (typeof videoSocket.auth === 'object') {
      videoSocket.auth = { token };
    } 
    // Méthode 2: Si .auth est une fonction callback
    else if (typeof videoSocket.auth === 'function') {
      videoSocket.auth = (cb: (authData: { token: string }) => void) => cb({ token });
    }
    // Méthode 3: Utiliser les options de connexion
    else {
      // Reconnecter avec les nouvelles options
      if (videoSocket.connected) {
        videoSocket.disconnect();
      }
     // videoSocket.io.opts.auth = { token };
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    // ✅ Configuration de l'auth
    setupAuth(accessToken);

    const roomName = `jobs:${room}`;

    // Gestionnaire de compteur de références
    const currentCount = roomRefCounter.get(roomName) || 0;
    roomRefCounter.set(roomName, currentCount + 1);

    // Handlers
    const onConnect = () => {
      console.log(`📡 Connecté - Room: ${roomName}`);
      setIsConnected(true);
      
      // Rejoindre la room si c'est le premier ou si reconnecté
      if (roomRefCounter.has(roomName)) {
        videoSocket.emit("join_room", roomName);
      }
    };

    const onDisconnect = () => {
      console.log("❌ Déconnecté");
      setIsConnected(false);
    };

    const onJobProgress = (data: JobProgressPayload) => {
      onJobUpdateRef.current(data);
    };

    // Listeners
    videoSocket.on("connect", onConnect);
    videoSocket.on("disconnect", onDisconnect);
    videoSocket.on("job_progress", onJobProgress);

    // Connexion si nécessaire
    if (!videoSocket.connected) {
      videoSocket.connect();
    } else {
      // Déjà connecté, rejoindre la room
      videoSocket.emit("join_room", roomName);
    }

    return () => {
      // Cleanup listeners
      videoSocket.off("connect", onConnect);
      videoSocket.off("disconnect", onDisconnect);
      videoSocket.off("job_progress", onJobProgress);

      // Décrémenter le compteur
      const newCount = (roomRefCounter.get(roomName) || 1) - 1;
      
      if (newCount <= 0) {
        roomRefCounter.delete(roomName);
        if (videoSocket.connected) {
          videoSocket.emit("leave_room", roomName);
        }
      } else {
        roomRefCounter.set(roomName, newCount);
      }
    };
  }, [accessToken, room, setupAuth]);

  return { isConnected };
};