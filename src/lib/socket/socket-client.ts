import { io, Socket } from "socket.io-client";

// URL racine du video-processor — namespace /processing
// NEXT_PUBLIC_SOCKET_URL est reservee pour les futures connexions socket admin (adminApp)
const PROCESSOR_SOCKET_URL = process.env.NEXT_PUBLIC_PROCESSOR_SOCKET_URL;
console.log(`🔧 [socket-client] PROCESSOR_SOCKET_URL="${PROCESSOR_SOCKET_URL}" → connecting to "${PROCESSOR_SOCKET_URL}/processing"`);

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

// ── DEBUG GLOBAL — à retirer une fois le diagnostic terminé ──
videoSocket.onAny((event: string, ...args: unknown[]) => {
  console.log(`🌐 [socket-client][ANY] "${event}"`, ...args);
});

videoSocket.on("connect", () =>
  console.log(`🔌 [socket-client] connected  id=${videoSocket.id}`)
);
videoSocket.on("disconnect", (reason: string) =>
  console.log(`🔌 [socket-client] disconnected reason="${reason}"`)
);
videoSocket.on("connect_error", (err: Error) =>
  console.error(`❌ [socket-client] connect_error:`, err.message)
);