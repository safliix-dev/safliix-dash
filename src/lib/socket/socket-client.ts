import { io, Socket } from "socket.io-client";

// L'URL de votre backend NestJS
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "https://svr-processor.safliix.com";

/**
 * Instance unique du socket pour le namespace video-progress.
 * autoConnect est à false car nous gérons la connexion manuellement après l'authentification.
 */

console.log(SOCKET_URL);
export const videoSocket: Socket = io(`${SOCKET_URL}/processing`, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});