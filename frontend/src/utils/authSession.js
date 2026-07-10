export function hasAuthToken() {
  return Boolean(
    localStorage.getItem("buddybook_token") ||
      localStorage.getItem("token")
  );
}
