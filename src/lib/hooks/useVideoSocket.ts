// hooks/useJobSocket.ts
import { useEffect, useRef, useState } from "react";
import { videoSocket } from "@/lib/socket/socket-client";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import type { JobProgressPayload, JobRoom } from "@/types/socket";

const roomRefCounter = new Map<string, number>();

export const useJobSocket = (
  room: JobRoom,
  onJobUpdate: (data: JobProgressPayload) => void
) => {
  const accessToken = useAccessToken();
  const [isConnected, setIsConnected] = useState(videoSocket.connected);
  
  const onJobUpdateRef = useRef(onJobUpdate);
  onJobUpdateRef.current = onJobUpdate;

  // Mise à jour de l'auth quand le token change
  useEffect(() => {
    if (accessToken) {
      console.log("🔐 Mise à jour du token d'authentification");
      videoSocket.auth = { token: accessToken };
    }
  }, [accessToken]);

  useEffect(() => {
   /*  if (!accessToken) {
      console.log("⏳ Pas de token d'accès, en attente...");
      return;
    } */

    // Le nom de la room est exactement "movies", "episodes", etc.
    const roomName = room;
    console.log(`📡 Connexion à la room: ${roomName}`);

    // Gestion du compteur de références
    const currentCount = roomRefCounter.get(roomName) || 0;
    roomRefCounter.set(roomName, currentCount + 1);
    console.log(`📊 Room ${roomName} - ${currentCount + 1} référence(s)`);

    // Handlers
    const onConnect = () => {
      console.log(`✅ Socket connecté - ID: ${videoSocket.id}`);
      setIsConnected(true);
      
      // ✅ Envoyer un objet avec la propriété 'room'
      console.log(`🚪 Rejoint la room: ${roomName}`);
      videoSocket.emit("join_room", { room: roomName });
    };

    const onDisconnect = (reason: string) => {
      console.log(`❌ Socket déconnecté - Raison: ${reason}`);
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error(`⚠️ Erreur de connexion socket:`, error.message);
      setIsConnected(false);
    };

    const onJobProgress = (data: JobProgressPayload) => {
      console.log(`📡 Mise à jour reçue:`, data);
      onJobUpdateRef.current(data);
    };

    // Ajout des listeners
    videoSocket.on("connect", onConnect);
    videoSocket.on("disconnect", onDisconnect);
    videoSocket.on("connect_error", onConnectError);
    videoSocket.on("job_progress", onJobProgress);

    // Connexion si nécessaire
    if (videoSocket.connected) {
      console.log(`🔌 Socket déjà connecté, rejoint la room`);
      setIsConnected(true);
      videoSocket.emit("join_room", { room: roomName });
    } else {
      console.log(`🔌 Connexion du socket en cours...`);
      videoSocket.connect();
    }

    // Cleanup
    return () => {
      console.log(`🧹 Nettoyage de la room: ${roomName}`);
      
      videoSocket.off("connect", onConnect);
      videoSocket.off("disconnect", onDisconnect);
      videoSocket.off("connect_error", onConnectError);
      videoSocket.off("job_progress", onJobProgress);

      const newCount = (roomRefCounter.get(roomName) || 1) - 1;
      
      if (newCount <= 0) {
        roomRefCounter.delete(roomName);
        if (videoSocket.connected) {
          console.log(`🚪 Quitte la room: ${roomName}`);
          // ✅ Envoyer un objet avec la propriété 'room'
          videoSocket.emit("leave_room", { room: roomName });
        }
      } else {
        roomRefCounter.set(roomName, newCount);
      }
    };
  }, [accessToken, room]);

  return { isConnected };
};