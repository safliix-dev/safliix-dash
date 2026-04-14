import { useEffect, useRef, useCallback } from "react";
import { videoSocket } from "@/lib/socket/socket-client";
import { useGlobalSocket } from "@/lib/contexts/SocketContext";
import type { JobProgressPayload, JobRoom } from "@/types/socket";

interface UseJobSocketProps {
  room: JobRoom;
  onJobUpdate: (data: JobProgressPayload) => void;
  onError?: (error: { message: string; code: string }) => void;
}

export const useJobSocket = ({ 
  room, 
  onJobUpdate, 
  onError 
}: UseJobSocketProps) => {
  // 1. On consomme l'état de connexion global
  const { isConnected, isAuthenticated, reconnect } = useGlobalSocket();
  
  // 2. Ref pour le callback afin d'éviter de redéclencher le useEffect 
  // quand la logique de traitement des données change dans le composant parent
  const onJobUpdateRef = useRef(onJobUpdate);
  onJobUpdateRef.current = onJobUpdate;

  // 3. Gestion des erreurs
  const handleSocketError = useCallback((error: { message: string; code: string }) => {
    console.error(`🚨 [Socket Room: ${room}] Erreur:`, error);
    onError?.(error);
    
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
      reconnect();
    }
  }, [room, onError, reconnect]);

  useEffect(() => {
    // Gestionnaire de réception des données
    const onJobProgress = (data: JobProgressPayload) => {
      onJobUpdateRef.current(data);
    };

    // Attachement des écouteurs
    videoSocket.on("job_progress", onJobProgress);
    videoSocket.on("error", handleSocketError);

    // 4. CONNEXION À LA ROOM
    // On n'émet join_room que si le socket est authentifié globalement
    if (isAuthenticated) {
      console.log(`📡 [${room}] Joining room...`);
      videoSocket.emit("join_room", { room });
    }

    // 5. NETTOYAGE (Cleanup)
    // S'exécute quand on quitte la page OU quand 'room' change
    return () => {
      if (isAuthenticated) {
        console.log(`🧹 [${room}] Leaving room...`);
        videoSocket.emit("leave_room", { room });
      }
      videoSocket.off("job_progress", onJobProgress);
      videoSocket.off("error", handleSocketError);
    };
    
    // On ajoute 'room' dans les dépendances pour permettre le switch 
    // dynamique (ex: passer de Films à Séries)
  }, [room, isAuthenticated, handleSocketError]);

  return { 
    isConnected, 
    isAuthenticated,
    reconnect
  };
};