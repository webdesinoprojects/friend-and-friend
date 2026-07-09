import api from "./api";

export async function listChats() {
  const { data } = await api.get("/chats");
  return Array.isArray(data?.data) ? data.data : [];
}

export async function sendChatMessage(threadId, payload) {
  const { data } = await api.post(`/chats/${threadId}/messages`, payload);
  return data?.data || data?.message || data;
}

export async function markChatRead(threadId) {
  return api.post(`/chats/${threadId}/read`);
}

export async function deleteChat(threadId) {
  return api.delete(`/chats/${threadId}`);
}

export async function deleteChatMessage(threadId, messageId) {
  return api.delete(`/chats/${threadId}/messages/${messageId}`);
}
