import { io, Socket } from "socket.io-client";

// URL racine du backend (sans /api) — NEXT_PUBLIC_API_URL contient /api et ne convient pas ici
// socket.io monte sur ws://host/socket.io/, pas sur ws://host/api/socket.io/
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

/**
 * Instance unique du socket pour le namespace /processing.
 * autoConnect est à false car nous gérons la connexion manuellement après l'authentification.
 */
export const videoSocket: Socket = io(`${SOCKET_URL}/processing`, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});