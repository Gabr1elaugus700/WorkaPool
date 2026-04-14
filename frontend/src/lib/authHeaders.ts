/**
 * Headers para chamadas autenticadas à API (mesmo token do AuthContext / localStorage).
 * Use `json: true` apenas quando o body for JSON (POST/PATCH/PUT).
 */
export function getAuthHeaders(options?: { json?: boolean }): HeadersInit {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options?.json === true) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}
