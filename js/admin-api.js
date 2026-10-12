import { apiFetch, apiJson } from "./api.js?v=admin-api-v2";

const $ = (selector) => document.querySelector(selector);
const roleLabel = {
  donor: "Donante",
  patient: "Paciente / Responsable",
  admin: "Administrador",
};
const statusLabel = { active: "Activo", disabled: "Deshabilitado" };
const text = (value, fallback = "—") =>
  value == null || value === "" ? fallback : String(value);
const card = (title, rows) => {
  const article = document.createElement("article");
  article.className = "card admin-card";
  const heading = document.createElement("h3");
  heading.textContent = title;
  article.append(heading);
  rows.forEach(([label, value, className = ""]) => {
    const line = document.createElement("p");
    line.className = className;
    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;
    line.append(strong, document.createTextNode(text(value)));
    article.append(line);
  });
  return article;
};
const statusBadge = (status) => {
  const badge = document.createElement("span");
  badge.className = `status-badge status-${status}`;
  badge.textContent = statusLabel[status] || status;
  return badge;
};
const setError = (selector, message) => {
  const target = $(selector);
  if (!target) return;
  target.hidden = false;
  target.textContent = message;
  const retry = selector.includes("users")
    ? $("[data-users-retry]")
    : selector.includes("requests")
      ? $("[data-requests-retry]")
      : null;
  if (retry) retry.hidden = false;
};
const setLoading = (selector, loading) => {
  const target = $(selector);
  if (target) target.hidden = !loading;
};

let currentAdmin;
let cachedUsers = [];
let cachedRequests = [];

const renderSummary = () => {
  const target = $("#admin-summary");
  if (!target) return;
  const values = [
    ["Usuarios registrados", cachedUsers.length],
    ["Donantes", cachedUsers.filter((user) => user.role === "donor").length],
    ["Pacientes", cachedUsers.filter((user) => user.role === "patient").length],
    [
      "Solicitudes activas",
      cachedRequests.filter((request) => request.status === "active").length,
    ],
    [
      "Solicitudes resueltas",
      cachedRequests.filter((request) => request.status === "resolved").length,
    ],
  ];
  target.replaceChildren(
    ...values.map(([label, value]) => card(label, [["Total", value]])),
  );
};

const loadUsers = async () => {
  setLoading("[data-users-loading]", true);
  try {
    cachedUsers = (await apiFetch("/admin/users")).data || [];
    renderUsers();
    renderSummary();
  } catch (error) {
    if (error.status === 401) {
      location.replace("login.html?next=admin.html");
      return;
    }
    setError("[data-users-error]", "No pudimos cargar los usuarios.");
  } finally {
    setLoading("[data-users-loading]", false);
  }
};
const loadRequests = async () => {
  setLoading("[data-requests-loading]", true);
  try {
    cachedRequests = (await apiFetch("/blood-requests")).data || [];
    renderRequests();
    renderSummary();
  } catch (error) {
    if (error.status === 401) {
      location.replace("login.html?next=admin.html");
      return;
    }
    setError("[data-requests-error]", "No pudimos cargar las solicitudes.");
  } finally {
    setLoading("[data-requests-loading]", false);
  }
};

const renderUsers = () => {
  const target = $("#admin-users");
  target.replaceChildren();
  if (!cachedUsers.length) {
    target.textContent = "No hay usuarios para mostrar.";
    return;
  }
  cachedUsers.forEach((user) => {
    const profile = user.profile;
    const name = profile
      ? `${text(profile.firstName)} ${text(profile.lastName)}`
      : user.email;
    const article = card(name, [
      ["Email", user.email],
      ["Rol", roleLabel[user.role] || user.role],
      ["Estado", ""],
    ]);
    article.querySelector("p:last-of-type")?.append(statusBadge(user.status));
    if (profile) {
      const profileDetails = card("", [
        ["Grupo", `${text(profile.bloodType)}${text(profile.rhFactor, "")}`],
        ["Localidad", profile.city],
      ]);
      article.append(...profileDetails.children);
    }
    if (user.id !== currentAdmin?.id) {
      const button = document.createElement("button");
      button.className = "btn btn-outline";
      button.type = "button";
      button.textContent =
        user.status === "active" ? "Deshabilitar usuario" : "Habilitar usuario";
      button.addEventListener("click", async () => {
        if (
          !confirm(
            `¿Querés ${user.status === "active" ? "deshabilitar" : "habilitar"} esta cuenta?`,
          )
        )
          return;
        button.disabled = true;
        try {
          await apiJson(`/admin/users/${user.id}/status`, "PATCH", {
            status: user.status === "active" ? "disabled" : "active",
          });
          await loadUsers();
        } catch {
          setError(
            "[data-users-error]",
            "No pudimos actualizar el estado del usuario.",
          );
          button.disabled = false;
        }
      });
      article.append(button);
    }
    $("#admin-users").append(article);
  });
};
const renderRequests = () => {
  const target = $("#admin-requests");
  target.replaceChildren();
  if (!cachedRequests.length) {
    target.textContent = "No hay solicitudes para supervisar.";
    return;
  }
  cachedRequests.forEach((request) => {
    const article = card(
      `${text(request.bloodType, "")} ${text(request.rhFactor, "")} · ${text(request.city)}`,
      [
        ["Centro", request.hospital],
        ["Prioridad", request.priority],
        ["Estado", ""],
        [
          "Fecha",
          request.createdAt
            ? new Date(request.createdAt).toLocaleString("es-AR")
            : "—",
        ],
      ],
    );
    article.querySelectorAll("p")[2]?.append(statusBadge(request.status));
    if (request.status === "active") {
      const button = document.createElement("button");
      button.className = "btn btn-outline";
      button.type = "button";
      button.textContent = "Marcar como resuelta";
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          await apiJson(`/blood-requests/${request.id}/status`, "PATCH", {
            status: "resolved",
          });
          await loadRequests();
        } catch {
          setError(
            "[data-requests-error]",
            "No pudimos actualizar la solicitud.",
          );
          button.disabled = false;
        }
      });
      article.append(button);
    }
    target.append(article);
  });
};

export async function initAdminApi() {
  let user;
  try {
    user = (await apiFetch("/users/me")).data;
  } catch (error) {
    if (error.status === 401) location.replace("login.html?next=admin.html");
    else setError("[data-admin-error]", "No pudimos verificar la sesión.");
    return;
  }
  if (user?.role !== "admin") {
    location.replace("panel.html");
    return;
  }
  currentAdmin = user;
  $("[data-users-retry]")?.addEventListener("click", loadUsers);
  $("[data-requests-retry]")?.addEventListener("click", loadRequests);
  await Promise.all([loadUsers(), loadRequests()]);
}
