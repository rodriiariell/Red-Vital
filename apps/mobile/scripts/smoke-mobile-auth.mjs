const baseUrl = process.env.REDVITAL_API_BASE_URL || "http://127.0.0.1:3001";
const email = `mobile-${Date.now()}@example.com`;
const password = "ValidPass1";
const checks = [];
const check = (name, ok, detail = "") => { checks.push({ name, ok }); if (!ok) throw new Error(`${name}: ${detail}`); console.log(`${name} PASS`); };
const call = async (path, options = {}) => { const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } }); let body = null; try { body = await response.json(); } catch {} return { response, body }; };
const json = (method, body, accessToken) => ({ method, headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {}, ...(method === "GET" || method === "HEAD" ? {} : { body: JSON.stringify(body) }) });
const registration = { firstName: "Mobile", lastName: "Smoke", email, password, phone: "+5491112345678", bloodType: "O", rhFactor: "+", city: "Avellaneda", role: "donor", available: false };
try {
  let x = await call("/auth/register", json("POST", registration)); check("register mobile user", x.response.status === 201, String(x.response.status));
  x = await call("/auth/login", json("POST", { email, password, client: "mobile" })); const access = x.body?.accessToken; const refresh = x.body?.refreshToken; check("mobile login", x.response.status === 200); check("access token received", typeof access === "string" && access.length > 20); check("refresh token received", typeof refresh === "string" && refresh.length > 20); check("login response safe", !JSON.stringify(x.body).match(/passwordHash|password[^A-Za-z]|tokenHash/i));
  x = await call("/users/me", json("GET", {}, access)); check("me with bearer", x.response.status === 200 && x.body.email === email);
  x = await call("/users/me/profile", json("GET", {}, access)); check("profile GET bearer", x.response.status === 200);
  x = await call("/users/me/profile", json("PATCH", { city: "Updated Mobile City" }, access)); check("profile PATCH bearer", x.response.status === 200 && x.body.city === "Updated Mobile City");
  x = await call("/users/me/availability", json("PATCH", { available: true }, access)); check("availability PATCH bearer", x.response.status === 200 && x.body.available === true);
  x = await call("/auth/refresh", json("POST", { refreshToken: refresh, client: "mobile" })); const nextAccess = x.body?.accessToken; const nextRefresh = x.body?.refreshToken; check("refresh mobile", x.response.status === 200); check("new refresh token received", typeof nextRefresh === "string" && nextRefresh !== refresh); check("new access token works", (await call("/users/me", json("GET", {}, nextAccess))).response.status === 200);
  x = await call("/auth/refresh", json("POST", { refreshToken: refresh, client: "mobile" })); check("old refresh rejected", x.response.status === 401);
  x = await call("/auth/logout", json("POST", { refreshToken: nextRefresh, client: "mobile" })); check("mobile logout", x.response.status === 204);
  x = await call("/auth/refresh", json("POST", { refreshToken: nextRefresh, client: "mobile" })); check("revoked refresh rejected", x.response.status === 401);
  console.log(`TOTAL: ${checks.length}/${checks.length} PASS`);
} catch (error) { console.error(`SMOKE FAILED: ${error.message}`); process.exitCode = 1; }
