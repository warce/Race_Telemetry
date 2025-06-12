import { io, Socket } from "socket.io-client";
import { queryClient } from "./queryClient";

let socket: Socket | null = null;

export function connectWebSocket(sessionId: number) {
  if (socket?.connected) {
    socket.disconnect();
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  socket = io(wsUrl, {
    transports: ['websocket', 'polling']
  });

  socket.on("connect", () => {
    console.log("WebSocket connected");
    socket?.emit("join-session", sessionId);
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected");
  });

  socket.on("session-status-changed", (session) => {
    console.log("Session status changed:", session);
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
  });

  socket.on("session-reset", ({ sessionId: resetSessionId }) => {
    console.log("Session reset:", resetSessionId);
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
  });

  socket.on("lap-completed", (data) => {
    console.log("Lap completed:", data);
    // Invalidate all relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/leaderboard`] });
    queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/stats`] });
    queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/recent-laps`] });
  });

  socket.on("session-created", (session) => {
    console.log("New session created:", session);
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
  });

  socket.on("kart-added", (kart) => {
    console.log("Kart added:", kart);
    queryClient.invalidateQueries({ queryKey: ["/api/karts"] });
  });

  return socket;
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
