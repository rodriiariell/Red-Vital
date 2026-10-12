const baseUrl = process.env.REDVITAL_WEB_BASE_URL || "http://127.0.0.1:8000/api";
const suffix = Date.now();
const value = { firstName: "Flow", lastName: "Patient", email: `flow.patient.${suffix}@redvital.local`, password: "RedVitalFlow2026!", phone: "+5491100000000", bloodType: "B-", city: "Avellaneda", role: "patient", available: false };

const normalizeBloodType = (value) => ({ bloodType: value.slice(0, -1), rhFactor: value.slice(-1) });
const buildRegisterPayload = (input) => ({ ...input, ...normalizeBloodType(input.bloodType) });
const payload = buildRegisterPayload(value);
const response = await fetch(`${baseUrl}/auth/register`, { method: "POST", headers: { "content-type": "application/json", origin: "http://127.0.0.1:8000" }, body: JSON.stringify(payload) });
const body = await response.json();
if (response.status !== 201 || !body.id || body.role !== "patient") throw new Error(`register failed: ${response.status}`);
if (payload.password !== value.password || payload.bloodType !== "B" || payload.rhFactor !== "-") throw new Error("payload mapping failed");
const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: value.email, password: value.password, client: "web" }) });
if (login.status !== 200) throw new Error(`login failed: ${login.status}`);
console.log(JSON.stringify({ registerStatus: response.status, response: { id: body.id, email: body.email, role: body.role, status: body.status }, loginStatus: login.status }));
