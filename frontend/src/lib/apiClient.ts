// Thin fetch wrapper around the backend API. Attaches the JWT from
// localStorage automatically. Import `api` and call api.get/post/patch.

const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL. Copy .env.example to .env and set it to your backend's URL.");
}

function getToken() {
  return localStorage.getItem("transitops_token");
}

export function hasToken() {
  return Boolean(getToken());
}

export function getStoredToken() {
  return getToken();
}

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  get: (path: string) => request("GET", path),
  post: (path: string, body?: unknown) => request("POST", path, body),
  patch: (path: string, body?: unknown) => request("PATCH", path, body),
};

export function setToken(token: string | null) {
  if (token) localStorage.setItem("transitops_token", token);
  else localStorage.removeItem("transitops_token");
}
