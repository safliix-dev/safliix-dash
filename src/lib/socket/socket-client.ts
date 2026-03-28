import { io, Socket } from "socket.io-client";

// L'URL de votre backend NestJS
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "https://dashboard-api.safliix.com";

/**
 * Instance unique du socket pour le namespace video-progress.
 * autoConnect est à false car nous gérons la connexion manuellement après l'authentification.
 */
export const videoSocket: Socket = io(`${SOCKET_URL}/admin`, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});