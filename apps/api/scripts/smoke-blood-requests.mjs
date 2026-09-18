import { loadEnvironment } from "../dist/src/config.js";
import { buildApp } from "../dist/src/app.js";
import { createDatabaseClient } from "../dist/src/database.js";

const env = loadEnvironment();
const db = createDatabaseClient(env.DATABASE_URL);
const app = await buildApp(env);
const baseUrl = `http://127.0.0.1:${env.API_PORT}`;
await app.listen({ host: "127.0.0.1", port: env.API_PORT });

const checks = [];
const check = (name, ok, detail = "") => {
  checks.push({ name, ok: Boolean(ok), detail });
  if (!ok) throw new Error(`${name}: ${detail}`);
  console.log(`${name} PASS`);
};
const jar = () => new Map();
const request = async (cookies, path, options = {}) => {
  const headers = new Headers(options.headers);
  if (cookies.size) headers.set("cookie", [...cookies].map(([key, value]) => `${key}=${value}`).join("; "));
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  for (const value of response.headers.getSetCookie?.() ?? []) {
    const [pair] = value.split(";");
    const index = pair.indexOf("=");
    const name = pair.slice(0, index);
    const token = pair.slice(index + 1);
    if (token) cookies.set(name, token); else cookies.delete(name);
  }
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
};
const json = (method, body) => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const unique = `blood-${Date.now()}`;
const registration = (role, email) => ({ firstName: "Blood", lastName: "Smoke", phone: "+5491112345678", bloodType: "O", rhFactor: "-", city: "Smoke City", available: false, email, password: "ValidPass1", role });
const requestPayload = (overrides = {}) => ({ bloodType: "O", rhFactor: "-", hospital: "Hospital Smoke", city: "Smoke City", priority: "high", contactPhone: "+5491112345678", contactEmail: `${unique}-patient@example.com`, description: "Solicitud de prueba real.", ...overrides });

try {
  const patient = jar();
  const donor = jar();
  const otherPatient = jar();
  let x = await request(patient, "/auth/register", json("POST", registration("patient", `${unique}-patient@example.com`)));
  check("patient register", x.response.status === 201, String(x.response.status));
  x = await request(donor, "/auth/register", json("POST", registration("donor", `${unique}-donor@example.com`)));
  check("donor register", x.response.status === 201, String(x.response.status));
  x = await request(otherPatient, "/auth/register", json("POST", registration("patient", `${unique}-other@example.com`)));
  check("second patient register", x.response.status === 201, String(x.response.status));
  x = await request(patient, "/auth/login", json("POST", { email: `${unique}-patient@example.com`, password: "ValidPass1" }));
  check("patient login cookie", x.response.status === 200 && patient.size > 0);
  x = await request(donor, "/auth/login", json("POST", { email: `${unique}-donor@example.com`, password: "ValidPass1" }));
  check("donor login cookie", x.response.status === 200 && donor.size > 0);
  x = await request(otherPatient, "/auth/login", json("POST", { email: `${unique}-other@example.com`, password: "ValidPass1" }));
  check("second patient login cookie", x.response.status === 200 && otherPatient.size > 0);
  x = await request(jar(), "/blood-requests", json("POST", requestPayload()));
  check("create without session rejected", x.response.status === 401, String(x.response.status));
  x = await request(donor, "/blood-requests", json("POST", requestPayload()));
  check("donor create rejected", x.response.status === 403, String(x.response.status));
  x = await request(patient, "/blood-requests", json("POST", { bloodType: "O" }));
  check("invalid payload rejected", x.response.status === 400, String(x.response.status));
  x = await request(patient, "/blood-requests", json("POST", requestPayload()));
  check("patient create", x.response.status === 201 && x.body?.status === "active", String(x.response.status));
  const id = x.body.id;
  check("created response hides sensitive fields", !JSON.stringify(x.body).match(/passwordHash|tokenHash|refreshToken|resetToken/i));
  const stored = await db.bloodRequest.findUnique({ where: { id } });
  check("request persisted", Boolean(stored && stored.ownerId));
  x = await request(donor, "/blood-requests");
  check("list visible to donor", x.response.status === 200 && x.body.some((row) => row.id === id));
  x = await request(donor, "/blood-requests?bloodType=O");
  check("blood type filter", x.response.status === 200 && x.body.some((row) => row.id === id));
  x = await request(donor, "/blood-requests?city=Smoke%20City");
  check("locality filter", x.response.status === 200 && x.body.some((row) => row.id === id));
  x = await request(donor, `/blood-requests/${id}`);
  check("detail existing", x.response.status === 200 && x.body.id === id);
  x = await request(donor, "/blood-requests/00000000-0000-4000-8000-000000000000");
  check("detail missing", x.response.status === 404);
  x = await request(patient, "/users/me/blood-requests");
  check("owner list", x.response.status === 200 && x.body.some((row) => row.id === id));
  x = await request(donor, "/users/me/blood-requests");
  check("other user isolated", x.response.status === 200 && !x.body.some((row) => row.id === id));
  x = await request(otherPatient, "/blood-requests", json("PATCH", requestPayload({ description: "No autorizado" })));
  check("other user edit rejected", x.response.status === 404 || x.response.status === 403, String(x.response.status));
  x = await request(otherPatient, `/blood-requests/${id}`, json("PATCH", requestPayload({ description: "No autorizado" })));
  check("owner isolation edit rejected", x.response.status === 403, String(x.response.status));
  x = await request(patient, `/blood-requests/${id}`, json("PATCH", requestPayload({ description: "Descripción actualizada" })));
  check("owner edit", x.response.status === 200 && x.body.description === "Descripción actualizada");
  x = await request(otherPatient, `/blood-requests/${id}/status`, json("PATCH", { status: "resolved" }));
  check("other user resolve rejected", x.response.status === 403, String(x.response.status));
  x = await request(patient, `/blood-requests/${id}/status`, json("PATCH", { status: "resolved" }));
  check("owner resolve", x.response.status === 200 && x.body.status === "resolved");
  const persisted = await db.bloodRequest.findUnique({ where: { id } });
  check("resolved persisted", persisted?.status === "RESOLVED" && persisted.resolvedAt instanceof Date);
  const audits = await db.auditLog.findMany({ where: { entity: "BloodRequest", entityId: id }, select: { action: true } });
  const actions = new Set(audits.map((row) => row.action));
  check("audit create", actions.has("BLOOD_REQUEST_CREATED"));
  check("audit update", actions.has("BLOOD_REQUEST_UPDATED"));
  check("audit resolve", actions.has("BLOOD_REQUEST_RESOLVED"));
  const responseBodies = JSON.stringify([x.body]);
  check("list/detail omit secrets", !responseBodies.match(/passwordHash|tokenHash|refreshToken|resetToken/i));
  console.log(`TOTAL: ${checks.length}/${checks.length} PASS`);
} catch (error) {
  console.error(`SMOKE FAILED: ${error.message}`);
  process.exitCode = 1;
} finally {
  await app.close();
  await db.$disconnect();
}
