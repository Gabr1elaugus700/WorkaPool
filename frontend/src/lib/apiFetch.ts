import { getBaseUrl } from "@/lib/apiBase";
import { getAuthHeaders } from "@/lib/authHeaders";

export type ApiFetchOptions = RequestInit & {
  /** Não envia Authorization (ex.: login) */
  skipAuth?: boolean;
};

function buildUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function readErrorMessage(res: Response): Promise<string> {
  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) {
    try {
      const body = await res.json();
      if (typeof body?.error === "string") return body.error;
      if (typeof body?.message === "string") return body.message;
    } catch {
      /* ignore */
    }
  }
  try {
    const text = await res.text();
    if (text) return text;
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

/**
 * fetch centralizado: base URL, Bearer quando houver token, Content-Type JSON em mutações.
 */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { skipAuth, headers: extra, ...init } = options;
  const url = buildUrl(path);

  const headers = new Headers(skipAuth ? {} : getAuthHeaders());
  if (!skipAuth && init.body != null && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (skipAuth && init.body != null && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (extra) {
    new Headers(extra).forEach((value, key) => headers.set(key, value));
  }

  return fetch(url, { ...init, headers });
}

/**
 * apiFetch + parse JSON em sucesso; lança Error com mensagem legível em falha.
 */
export async function apiFetchJson<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const ct = res.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
