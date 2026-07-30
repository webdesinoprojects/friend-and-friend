import api from "./api";
import { io } from "socket.io-client";

let chatSocket = null;
let socketToken = "";

function socketBaseUrl() {
  const base = String(api.defaults.baseURL || "/api");
  if (/^https?:\/\//i.test(base)) return base.replace(/\/api\/?$/, "");
  return window.location.origin;
}

function getChatSocket() {
  const token = localStorage.getItem("buddybook_token") || localStorage.getItem("token") || "";
  if (chatSocket && socketToken === token) return chatSocket;
  chatSocket?.disconnect();
  socketToken = token;
  chatSocket = io(socketBaseUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 400,
    reconnectionDelayMax: 3000,
    timeout: 8000,
  });
  return chatSocket;
}

function emitWithAck(event, payload, timeout = 8000) {
  const socket = getChatSocket();
  return new Promise((resolve, reject) => {
    if (!socket.connected) socket.connect();
    socket.timeout(timeout).emit(event, payload, (error, response) => {
      if (error) return reject(new Error("Real-time chat did not respond. Please retry."));
      if (!response?.ok) return reject(new Error(response?.message || "Chat action failed."));
      return resolve(response.data);
    });
  });
}

export function subscribeSocketChatEvents(onEvent, onStatus) {
  const socket = getChatSocket();
  const events = {
    "chat:ready": "connected",
    "chat:message": "chat",
    "chat:edited": "edit",
    "chat:deleted": "delete",
    "chat:cleared": "cleared",
    "chat:read-update": "read",
    "chat:typing": "typing",
    "chat:presence": "presence",
    "chat:location-update": "location",
    "chat:reaction-update": "reaction",
    "chat:pin-update": "pin",
  };
  const listeners = Object.entries(events).map(([socketEvent, localEvent]) => {
    const listener = (payload) => onEvent(localEvent, payload || {});
    socket.on(socketEvent, listener);
    return [socketEvent, listener];
  });
  const connected = () => onStatus?.(true);
  const disconnected = () => onStatus?.(false);
  const connectError = (error) => onStatus?.(false, error);
  socket.on("connect", connected);
  socket.on("disconnect", disconnected);
  socket.on("connect_error", connectError);
  if (socket.connected) connected(); else socket.connect();
  return () => {
    listeners.forEach(([event, listener]) => socket.off(event, listener));
    socket.off("connect", connected);
    socket.off("disconnect", disconnected);
    socket.off("connect_error", connectError);
  };
}

export function joinRealtimeChat(threadId) {
  return emitWithAck("chat:join", { threadId });
}

export function leaveRealtimeChat(threadId) {
  return emitWithAck("chat:leave", { threadId }, 3000);
}

export function sendRealtimeChatMessage(threadId, payload) {
  return emitWithAck("chat:send", { threadId, ...payload });
}

export function editRealtimeChatMessage(threadId, messageId, text) {
  return emitWithAck("chat:edit", { threadId, messageId, text });
}

export function deleteRealtimeChatMessage(threadId, messageId) {
  return emitWithAck("chat:delete", { threadId, messageId });
}

export function readRealtimeChat(threadId) {
  return emitWithAck("chat:read", { threadId });
}

export function signalRealtimeChat(threadId, type, active = true) {
  return emitWithAck(type === "presence" ? "chat:presence" : "chat:typing", { threadId, active }, 3000);
}

export function updateRealtimeLocation(threadId, messageId, coordinates) {
  return emitWithAck("chat:location-update", { threadId, messageId, ...coordinates });
}

export function reactRealtimeChatMessage(threadId, messageId, emoji) {
  return emitWithAck("chat:react", { threadId, messageId, emoji });
}

export function pinRealtimeChatMessage(threadId, messageId) {
  return emitWithAck("chat:pin", { threadId, messageId });
}

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

export async function listChats() {
  const response = await api.get("/chats", { timeout: 30000 });
  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
}

export async function listChatMessages(threadId, { before, limit = 50 } = {}) {
  const response = await api.get(`/chats/${threadId}/messages`, {
    params: { ...(before ? { before } : {}), limit },
    timeout: 30000,
  });
  return {
    messages: Array.isArray(response.data?.data) ? response.data.data : [],
    hasMore: Boolean(response.data?.hasMore),
  };
}

export async function sendChatMessage(threadId, payload) {
  return unwrap(await api.post(`/chats/${threadId}/messages`, payload, { timeout: 30000 }));
}

export async function uploadVoiceMessage(threadId, blob, durationSeconds) {
  const form = new FormData();
  const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
  form.append("voice", blob, `voice-${Date.now()}.${extension}`);
  form.append("durationSeconds", String(Math.max(1, Math.round(durationSeconds))));
  return unwrap(await api.post(`/chats/${threadId}/voice`, form, { timeout: 60000 }));
}

export async function updateLiveLocation(threadId, messageId, coordinates) {
  return unwrap(await api.patch(`/chats/${threadId}/messages/${messageId}/location`, coordinates));
}

export async function markChatRead(threadId) {
  return unwrap(await api.post(`/chats/${threadId}/read`));
}

export async function signalChat(threadId, type, active = true) {
  return unwrap(await api.post(`/chats/${threadId}/signal`, { type, active }));
}

export async function deleteChat(threadId) {
  return unwrap(await api.delete(`/chats/${threadId}/messages`));
}

export async function deleteChatMessage(threadId, messageId) {
  return unwrap(await api.delete(`/chats/${threadId}/messages/${messageId}`));
}

export async function editChatMessage(threadId, messageId, text) {
  return unwrap(await api.patch(`/chats/${threadId}/messages/${messageId}`, { text }));
}

export async function subscribeChatEvents(onEvent, { signal } = {}) {
  const token = localStorage.getItem("buddybook_token") || localStorage.getItem("token");
  const baseUrl = String(api.defaults.baseURL || "").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chats/events`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat stream failed (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (!signal?.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = block.match(/^event:\s*(.+)$/m)?.[1] || "message";
      const dataLines = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());
      if (dataLines.length) {
        try {
          onEvent(event, JSON.parse(dataLines.join("\n")));
        } catch {
          // Ignore malformed keep-alive/event data and keep the stream alive.
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}
