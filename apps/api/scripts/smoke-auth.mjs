import { loadEnvironment } from "../dist/src/config.js";
import { buildApp } from "../dist/src/app.js";
import { createDatabaseClient } from "../dist/src/database.js";
import { hashPassword, hashToken } from "../dist/src/auth/crypto.js";

const env = loadEnvironment();
const db = createDatabaseClient(env.DATABASE_URL);
const resetTokens = new Map();
const app = await buildApp(env, undefined, async (token) => resetTokens.set("smoke", token));
await app.listen({ host: "127.0.0.1", port: env.API_PORT });

const checks = [];
const check = (name, condition, detail = "") => { checks.push({ name, ok: Boolean(condition), detail }); if (!condition) throw new Error(`${name}: ${detail}`); console.log(`${name} PASS`); };
const jar = () => new Map();
const request = async (cookies, path, options = {}) => {
  const headers = new Headers(options.headers);
  if (cookies.size) headers.set("cookie", [...cookies].map(([k, v]) => `${k}=${v}`).join("; "));
  const response = await fetch(`http://127.0.0.1:${env.API_PORT}${path}`, { ...options, headers });
  for (const value of response.headers.getSetCookie?.() ?? []) { const [pair] = value.split(";"); const index = pair.indexOf("="); const [name, token] = [pair.slice(0, index), pair.slice(index + 1)]; if (token) cookies.set(name, token); else cookies.delete(name); }
  let body = null; try { body = await response.json(); } catch {}
  return { response, body };
};
const json = (method, body) => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const unique = `smoke-${Date.now()}`;
const base = { firstName: "Smoke", lastName: "User", phone: "+5491112345678", bloodType: "O", rhFactor: "-", city: "Test", available: false };
const user = (role, email) => ({ ...base, email, password: "ValidPass1", role });

try {
  const donorJar = jar(); const patientJar = jar();
  let x = await request(donorJar, "/health"); check("health", x.response.status === 200, String(x.response.status));
  x = await request(donorJar, "/auth/register", json("POST", user("donor", `${unique}-donor@example.com`))); check("register donor", x.response.status === 201, String(x.response.status));
  x = await request(patientJar, "/auth/register", json("POST", user("patient", `${unique}-patient@example.com`))); check("register patient", x.response.status === 201, String(x.response.status));
  x = await request(donorJar, "/auth/register", json("POST", user("donor", `${unique}-donor@example.com`))); check("duplicate", x.response.status === 409, String(x.response.status));
  x = await request(donorJar, "/auth/register", json("POST", user("admin", `${unique}-admin@example.com`))); check("public admin rejected", x.response.status === 400, String(x.response.status));
  x = await request(donorJar, "/auth/login", json("POST", { email: `${unique}-donor@example.com`, password: "ValidPass1" })); check("login donor cookies", x.response.status === 200 && donorJar.has(env.AUTH_COOKIE_NAME) && donorJar.has(env.AUTH_ACCESS_COOKIE_NAME));
  check("login no sensitive fields", !JSON.stringify(x.body).includes("passwordHash") && !JSON.stringify(x.body).includes("password"));
  x = await request(donorJar, "/users/me"); check("me", x.response.status === 200 && x.body.role === "donor");
  x = await request(jar(), "/users/me"); check("me without cookies", x.response.status === 401);
  x = await request(donorJar, "/users/me/profile"); check("profile read", x.response.status === 200);
  x = await request(donorJar, "/users/me/profile", json("PATCH", { city: "Updated" })); check("profile update", x.response.status === 200 && x.body.city === "Updated");
  x = await request(donorJar, "/users/me/availability", json("PATCH", { available: true })); check("availability", x.response.status === 200 && x.body.available === true);
  x = await request(donorJar, "/auth/refresh", json("POST", {})); check("refresh rotation", x.response.status === 200 && donorJar.has(env.AUTH_COOKIE_NAME));
  x = await request(donorJar, "/auth/logout", json("POST", {})); check("logout", x.response.status === 204);
  x = await request(donorJar, "/users/me"); check("logout revocation", x.response.status === 401);
  x = await request(patientJar, "/auth/login", json("POST", { email: `${unique}-patient@example.com`, password: "ValidPass1" })); check("login patient", x.response.status === 200);
  x = await request(patientJar, "/admin/users"); check("patient forbidden", x.response.status === 403);
  const adminPasswordHash = await hashPassword("ValidPass1");
  const admin = await db.user.create({ data: { email: `${unique}-admin@example.com`, passwordHash: adminPasswordHash, role: "ADMIN", profile: { create: { firstName: "Smoke", lastName: "Admin", phone: base.phone, bloodType: "O", rhFactor: "NEGATIVE", city: "Test", available: false } } } });
  const adminJar = jar(); x = await request(adminJar, "/auth/login", json("POST", { email: admin.email, password: "ValidPass1" })); check("admin login", x.response.status === 200);
  x = await request(adminJar, "/admin/users"); check("admin authorized", x.response.status === 200);
  x = await request(adminJar, "/auth/forgot-password", json("POST", { email: `${unique}-patient@example.com` })); check("forgot existing", x.response.status === 202 && resetTokens.has("smoke"));
  const token = resetTokens.get("smoke"); const before = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } }); check("reset hash persisted", Boolean(before));
  x = await request(adminJar, "/auth/reset-password", json("POST", { token, password: "NewValid1" })); check("reset password", x.response.status === 204);
  x = await request(adminJar, "/auth/reset-password", json("POST", { token, password: "Another1" })); check("reset one use", x.response.status === 400);
  x = await request(jar(), "/auth/login", json("POST", { email: `${unique}-patient@example.com`, password: "NewValid1" })); check("new password login", x.response.status === 200);
  const rows = await db.$queryRawUnsafe("SELECT action FROM audit_logs WHERE entity_id = ? OR entity = 'Auth'", admin.id); check("audit persistence", rows.length > 0);
  const stored = await db.user.findUnique({ where: { email: `${unique}-donor@example.com` } }); check("scrypt password format", stored.passwordHash?.startsWith("scrypt$v1$") === true);
  console.log(`TOTAL: ${checks.length}/${checks.length} PASS`);
} catch (error) { console.error(`SMOKE FAILED: ${error.message}`); process.exitCode = 1; } finally { await app.close(); await db.$disconnect(); }
