export function hasAuthToken() {
  return Boolean(localStorage.getItem("buddybook_auth_user"));
}
