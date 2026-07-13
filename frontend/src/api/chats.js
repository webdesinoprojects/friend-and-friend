import api from "./api";

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

export async function listChats() {
  const response = await api.get("/chats", { timeout: 10000 });
  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
}

export async function listChatMessages(threadId, { before, limit = 50 } = {}) {
  const response = await api.get(`/chats/${threadId}/messages`, {
    params: { ...(before ? { before } : {}), limit },
  });
  return {
    messages: Array.isArray(response.data?.data) ? response.data.data : [],
    hasMore: Boolean(response.data?.hasMore),
  };
}

export async function sendChatMessage(threadId, payload) {
  return unwrap(await api.post(`/chats/${threadId}/messages`, payload));
}

export async function uploadVoiceMessage(threadId, blob, durationSeconds) {
  const form = new FormData();
  const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
  form.append("voice", blob, `voice-${Date.now()}.${extension}`);
  form.append("durationSeconds", String(Math.max(1, Math.round(durationSeconds))));
  return unwrap(await api.post(`/chats/${threadId}/voice`, form));
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
  return unwrap(await api.delete(`/chats/${threadId}`));
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
