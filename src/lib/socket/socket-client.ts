import { io, Socket } from "socket.io-client";

// URL racine du video-processor — namespace /processing
// NEXT_PUBLIC_SOCKET_URL est reservee pour les futures connexions socket admin (adminApp)
const PROCESSOR_SOCKET_URL = process.env.NEXT_PUBLIC_PROCESSOR_SOCKET_URL;

/**
 * Instance unique du socket pour le namespace /processing (video-processor).
 * autoConnect est à false car nous gérons la connexion manuellement après l'authentification.
 */
export const videoSocket: Socket = io(`${PROCESSOR_SOCKET_URL}/processing`, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
  reconnection: false, // reconnexion gérée manuellement dans SocketContext
});