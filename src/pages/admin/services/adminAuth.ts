export function getAdminHeaders(includeJson = false) {
  const token = localStorage.getItem("auth-token");
  const headers: Record<string, string> = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}
