import api from "./api";

function unwrap(response) {
  return response?.data?.data || response?.data;
}

export async function getAccountStatus() {
  return unwrap(await api.get("/auth/account/status"));
}

export async function disableAccount() {
  return unwrap(await api.post("/auth/account/disable"));
}

export async function reactivateAccount() {
  return unwrap(await api.post("/auth/account/reactivate"));
}

export async function deleteAccountPermanently() {
  return unwrap(await api.delete("/auth/account", { data: { confirmation: "DELETE" } }));
}
