import { io, Socket } from "socket.io-client";

// L'URL de votre backend NestJS
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://svr-processor.safliix.com";

console.log("socket url:"+SOCKET_URL)

/**
 * Instance unique du socket pour le namespace /processing.
 * autoConnect est à false car nous gérons la connexion manuellement après l'authentification.
 */
export const videoSocket: Socket = io(`${SOCKET_URL}/processing`, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});