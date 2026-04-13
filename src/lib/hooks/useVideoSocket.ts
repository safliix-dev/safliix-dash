// lib/hooks/useJobSocket.ts
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
  const { isConnected, isAuthenticated, reconnect } = useGlobalSocket();
  
  const onJobUpdateRef = useRef(onJobUpdate);
  onJobUpdateRef.current = onJobUpdate;
  
  const roomRef = useRef(room);
  roomRef.current = room;

  const onSocketError = useCallback((error: { message: string; code: string }) => {
    console.error(`🚨 [${roomRef.current}] Erreur:`, error);
    onError?.(error);
    
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
      reconnect();
    }
  }, [onError, reconnect]);

  useEffect(() => {
    const currentRoom = roomRef.current;
    
    const onJobProgress = (data: JobProgressPayload) => {
      // Optionnel: filtrer par room si le payload contient la room
      // if (data.room === currentRoom) {
        onJobUpdateRef.current(data);
      // }
    };

    videoSocket.on("job_progress", onJobProgress);
    videoSocket.on("error", onSocketError);

    if (isAuthenticated) {
      console.log(`📡 [${currentRoom}] Joining room...`);
      videoSocket.emit("join_room", { room: currentRoom });
    }

    return () => {
      console.log(`🧹 [${currentRoom}] Leaving room...`);
      videoSocket.emit("leave_room", { room: currentRoom });
      videoSocket.off("job_progress", onJobProgress);
      videoSocket.off("error", onSocketError);
    };
  }, [isAuthenticated, onSocketError]); // Pas de room dans dépendances !

  return { 
    isConnected, 
    isAuthenticated,
    reconnect
  };
};