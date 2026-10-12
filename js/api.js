export const API_BASE_URL = "/api";
let refreshing = null;

export async function apiFetch(path, options = {}, retry = true) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type"))
    headers.set("content-type", "application/json");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (
    response.status === 401 &&
    retry &&
    path !== "/auth/refresh" &&
    path !== "/auth/login"
  ) {
    refreshing ??= fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: "{}",
    }).finally(() => {
      refreshing = null;
    });
    if ((await refreshing).ok) return apiFetch(path, options, false);
  }
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const error = new Error(
      data?.message ||
        (response.status >= 500
          ? "Ocurrió un problema del servidor."
          : "Revisá los datos ingresados."),
    );
    error.status = response.status;
    throw error;
  }
  return { response, data };
}

export const apiJson = (path, method, body) =>
  apiFetch(path, { method, body: JSON.stringify(body) });
