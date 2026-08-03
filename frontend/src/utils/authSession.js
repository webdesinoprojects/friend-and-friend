export function hasAuthToken() {
  return Boolean(localStorage.getItem("PPlusOne_auth_user"));
}
