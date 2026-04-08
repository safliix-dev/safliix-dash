import { io, Socket } from "socket.io-client";

// URL racine de l'adminApp (sans /api) — pour les sockets admin
// socket.io monte sur ws://host/socket.io/, pas sur ws://host/api/socket.io/
const ADMIN_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

// URL racine du video-processor — namespace /processing
const PROCESSOR_SOCKET_URL = process.env.NEXT_PUBLIC_PROCESSOR_SOCKET_URL;

/**
 * Instance unique du socket pour le namespace /processing (video-processor).
 * autoConnect est à false car nous gérons la connexion manuellement après l'authentification.
 */
export const videoSocket: Socket = io(`${PROCESSOR_SOCKET_URL}/processing`, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});