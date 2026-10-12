import { apiFetch, apiJson } from "./api.js";
import { renderShell } from "./ui.js";

const PRIVATE_ROLES = {
  panel: ["patient", "donor"], perfil: ["patient", "donor"],
  solicitudes: ["donor"], nueva: ["patient"], "mis-solicitudes": ["patient"],
  editar: ["patient"], detalle: ["patient", "donor", "admin"], "admin-api": ["admin"],
};

function roleDestination(role) {
  return role === "admin" ? "admin.html" : "panel.html";
}

export async function initWebSession() {
  const page = document.body.dataset.page;
  if (document.querySelector(".site-header")) return null;
  const isPrivate = Boolean(PRIVATE_ROLES[page]);
  document.body.dataset.sessionState = "loading";
  let user;
  try {
    user = (await apiFetch("/users/me")).data;
  } catch (error) {
    if (error.status === 401 && isPrivate) {
      const next = `${location.pathname.split("/").pop()}${location.search}`;
      return location.replace(`login.html?next=${encodeURIComponent(next)}`);
    }
    user = null;
  }
  if (!isPrivate) {
    document.body.dataset.sessionState = "ready";
    renderShell(user, async () => { try { await apiJson("/auth/logout", "POST", {}); } finally { location.replace("index.html"); } });
    return user;
  }
  const allowed = PRIVATE_ROLES[page];
  if (!allowed.includes(user.role)) return location.replace(roleDestination(user.role));
  document.body.dataset.sessionState = "ready";
  renderShell(user, async () => {
    try { await apiJson("/auth/logout", "POST", {}); } finally { location.replace("index.html"); }
  });
  return user;
}

queueMicrotask(() => initWebSession());
