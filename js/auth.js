import { apiFetch, apiJson } from "./api.js";

let currentUser = null;
let sessionChecked = false;
export const activeUser = () => currentUser;
export async function loadCurrentUser() { try { currentUser = (await apiFetch("/users/me")).data; } catch (error) { if (error.status === 401) currentUser = null; else throw error; } sessionChecked = true; return currentUser; }
export const getCurrentUser = loadCurrentUser;
export async function login(email, password) { const result = await apiJson("/auth/login", "POST", { email, password, client: "web" }); currentUser = result.data?.user || await loadCurrentUser(); return currentUser; }
export async function logout() { try { await apiJson("/auth/logout", "POST", { client: "web" }); } finally { currentUser = null; location.href = "index.html"; } }
export async function requireAuth(role) { if (!sessionChecked) await loadCurrentUser(); if (!currentUser) { location.replace(`login.html?next=${encodeURIComponent(location.pathname.split("/").pop() || "panel.html")}`); return null; } const allowed = Array.isArray(role) ? role : [role]; if (role && !allowed.includes(currentUser.role)) { location.replace(currentUser.role === "admin" ? "admin.html" : "panel.html"); return null; } return currentUser; }
