import { loadEnvironment } from "../../api/dist/src/config.js";
import { createDatabaseClient } from "../../api/dist/src/database.js";
import { RedVitalApiClient } from "../../../packages/api-client/dist/index.js";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../../api/.env", import.meta.url) });

const baseUrl = process.env.REDVITAL_API_BASE_URL || "http://127.0.0.1:3001";
const database = createDatabaseClient(loadEnvironment().DATABASE_URL);
const unique = `mobile-blood-${Date.now()}`;
const password = "ValidPass1";
const checks = [];
const check = (name, ok, detail = "") => { checks.push({ name, ok }); if (!ok) throw new Error(`${name}: ${detail}`); console.log(`${name} PASS`); };
const call = async (path, options = {}) => { const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } }); let body = null; try { body = await response.json(); } catch {} return { response, body }; };
const json = (method, body, token) => ({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, ...(method === "GET" ? {} : { body: JSON.stringify(body) }) });
const register = (role, email) => ({ firstName: "Mobile", lastName: "Request", email, password, phone: "+5491112345678", bloodType: "O", rhFactor: "+", city: "Avellaneda", role, available: false });
const payload = (extra = {}) => ({ bloodType: "O", rhFactor: "+", hospital: "Hospital Mobile", city: "Avellaneda", priority: "high", contactPhone: "+5491112345678", contactEmail: `${unique}-patient@example.com`, description: "Solicitud mobile real de prueba.", ...extra });
const login = async (email) => { const result = await call("/auth/login", json("POST", { email, password, client: "mobile" })); return { result, access: result.body?.accessToken, refresh: result.body?.refreshToken }; };
try {
  for (const [role, suffix] of [["patient", "patient"], ["donor", "donor"], ["patient", "other"]]) { const x = await call("/auth/register", json("POST", register(role, `${unique}-${suffix}@example.com`))); check(`register ${suffix}`, x.response.status === 201); }
  const patient = await login(`${unique}-patient@example.com`); const donor = await login(`${unique}-donor@example.com`); const other = await login(`${unique}-other@example.com`);
  check("patient mobile login", patient.result.response.status === 200 && patient.access && patient.refresh);
  check("donor mobile login", donor.result.response.status === 200 && donor.access && donor.refresh);
  let x = await call("/blood-requests", json("POST", payload(), patient.access)); check("patient creates", x.response.status === 201); const id = x.body?.id; check("created persisted response", Boolean(id)); check("blood response safe", !JSON.stringify(x.body).match(/passwordHash|refreshToken|tokenHash/i));
  x = await call("/blood-requests", json("POST", payload(), donor.access)); check("donor create rejected", x.response.status === 403);
  x = await call("/blood-requests", json("POST", payload())); check("no token create rejected", x.response.status === 401);
  x = await call("/blood-requests", json("GET", {}, donor.access)); check("donor list", x.response.status === 200 && x.body.some((item) => item.id === id));
  x = await call("/blood-requests?bloodType=O", json("GET", {}, donor.access)); check("blood filter", x.response.status === 200 && x.body.some((item) => item.id === id));
  x = await call("/blood-requests?city=Avellaneda", json("GET", {}, donor.access)); check("locality filter", x.response.status === 200 && x.body.some((item) => item.id === id));
  x = await call(`/blood-requests/${id}`, json("GET", {}, donor.access)); check("detail existing", x.response.status === 200 && x.body.id === id);
  x = await call("/blood-requests/00000000-0000-4000-8000-000000000000", json("GET", {}, donor.access)); check("detail missing", x.response.status === 404);
  x = await call("/users/me/blood-requests", json("GET", {}, patient.access)); check("owner own list", x.response.status === 200 && x.body.some((item) => item.id === id));
  x = await call("/users/me/blood-requests", json("GET", {}, other.access)); check("other own list isolated", x.response.status === 200 && !x.body.some((item) => item.id === id));
  x = await call(`/blood-requests/${id}`, json("PATCH", payload({ description: "Descripción mobile actualizada." }), other.access)); check("other edit rejected", x.response.status === 403);
  x = await call(`/blood-requests/${id}`, json("PATCH", payload({ description: "Descripción mobile actualizada." }), patient.access)); check("owner edit", x.response.status === 200 && x.body.description.includes("actualizada"));
  x = await call(`/blood-requests/${id}/status`, json("PATCH", { status: "resolved" }, other.access)); check("other resolve rejected", x.response.status === 403);
  x = await call(`/blood-requests/${id}/status`, json("PATCH", { status: "resolved" }, patient.access)); check("owner resolve", x.response.status === 200 && x.body.status === "resolved");
  x = await call(`/blood-requests/${id}`, json("GET", {}, donor.access)); check("resolved persisted", x.response.status === 200 && x.body.status === "resolved"); check("no private fields", !JSON.stringify(x.body).match(/passwordHash|refreshToken|tokenHash/i));
  const auditRows = await database.auditLog.findMany({ where: { entity: "BloodRequest", entityId: id }, select: { action: true } });
  const auditActions = new Set(auditRows.map((row) => row.action));
  check("audit create", auditActions.has("BLOOD_REQUEST_CREATED"));
  check("audit update", auditActions.has("BLOOD_REQUEST_UPDATED"));
  check("audit resolve", auditActions.has("BLOOD_REQUEST_RESOLVED"));
  const rotated = await call("/auth/refresh", json("POST", { refreshToken: donor.refresh, client: "mobile" })); check("mobile refresh rotation", rotated.response.status === 200 && rotated.body?.accessToken && rotated.body?.refreshToken !== donor.refresh); x = await call("/blood-requests", json("GET", {}, rotated.body.accessToken)); check("session works after rotation", x.response.status === 200);
  const mobileClient = new RedVitalApiClient({ baseUrl }); mobileClient.setAccessToken("expired-access-token"); let refreshed = false; mobileClient.setUnauthorizedHandler(async () => { const next = await mobileClient.refresh(rotated.body.refreshToken, "mobile"); mobileClient.setAccessToken(next.accessToken ?? null); refreshed = true; return Boolean(next.accessToken); }); await mobileClient.listBloodRequests(); check("expired access uses mobile refresh", refreshed);
  console.log(`TOTAL: ${checks.length}/${checks.length} PASS`);
} catch (error) { console.error(`SMOKE FAILED: ${error.message}`); process.exitCode = 1; }
finally { await database.$disconnect(); }
