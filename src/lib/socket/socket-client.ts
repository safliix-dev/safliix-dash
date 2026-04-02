import { io, Socket } from "socket.io-client";

// URL racine du backend (sans /api) — socket.io monte sur / pas sur /api
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

/**
 * Instance unique du socket pour le namespace video-progress.
 * autoConnect est à false car nous gérons la connexion manuellement après l'authentification.
 */
export const videoSocket: Socket = io(`${SOCKET_URL}/processing`, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});