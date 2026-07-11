import api from "./api";

export async function listChats() {
  const { data } = await api.get("/chats", { timeout: 10000 });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function sendChatMessage(threadId, payload) {
  const { data } = await api.post(`/chats/${threadId}/messages`, payload);
  return data?.data || data?.message || data;
}

export async function markChatRead(threadId) {
  return api.post(`/chats/${threadId}/read`);
}
export async function signalChat(threadId, type, active = true) { return api.post(`/chats/${threadId}/signal`, { type, active }); }

export async function deleteChat(threadId) {
  return api.delete(`/chats/${threadId}`);
}

export async function deleteChatMessage(threadId, messageId) {
  return api.delete(`/chats/${threadId}/messages/${messageId}`);
}

export async function editChatMessage(threadId, messageId, text) {
  const { data } = await api.patch(`/chats/${threadId}/messages/${messageId}`, { text });
  return data?.data || data?.message || data;
}
