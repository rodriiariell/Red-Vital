import { describe, expect, it, vi } from "vitest";
vi.mock("argon2", () => ({ default: { argon2id: 2, hash: async (value: string) => `test-argon2id-${value}`, verify: async (encoded: string, value: string) => encoded === `test-argon2id-${value}` }, argon2id: 2 }));
import { buildApp } from "../src/app.ts";
import type { Environment } from "../src/config.js";
import { MemoryStore } from "./memory-store.mjs";

const env: Environment = { NODE_ENV: "test", API_HOST: "127.0.0.1", API_PORT: 0, DATABASE_URL: "postgresql://test:test@localhost:5432/test", CORS_ORIGIN: "http://localhost:8000", AUTH_ACCESS_TOKEN_SECRET: "a".repeat(40), AUTH_REFRESH_TOKEN_SECRET: "b".repeat(40), AUTH_ACCESS_TOKEN_TTL: "15m", AUTH_REFRESH_TOKEN_TTL: "30d", AUTH_PASSWORD_RESET_TTL: "1h", AUTH_COOKIE_NAME: "rv_test", AUTH_ACCESS_COOKIE_NAME: "rv_access_test" };
const input = { firstName: "Sofía", lastName: "Demo", email: "sofia@example.com", password: "Demo1234", phone: "54911000000", bloodType: "O", rhFactor: "+", city: "Córdoba", role: "donor", available: true };

describe("authentication HTTP boundaries", () => {
  it("does not return password material and rejects unauthenticated access", async () => {
    const app = await buildApp(env, new MemoryStore());
    const registration = await app.inject({ method: "POST", url: "/auth/register", payload: input });
    expect(registration.statusCode).toBe(201);
    expect(registration.json()).not.toHaveProperty("password");
    expect(registration.json()).not.toHaveProperty("passwordHash");
    expect((await app.inject({ method: "GET", url: "/users/me" })).statusCode).toBe(401);
    await app.close();
  });

  it("uses httpOnly cookies for web sessions and rotates them", async () => {
    const app = await buildApp(env, new MemoryStore());
    await app.inject({ method: "POST", url: "/auth/register", payload: input });
    const login = await app.inject({ method: "POST", url: "/auth/login", payload: { email: input.email, password: input.password, client: "web" } });
    expect(login.statusCode).toBe(200);
    const cookies = login.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    expect(login.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringContaining("HttpOnly")]));
    const refreshed = await app.inject({ method: "POST", url: "/auth/refresh", headers: { cookie: cookies }, payload: { client: "web" } });
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.json()).not.toHaveProperty("accessToken");
    await app.close();
  });

  it("exposes the OpenAPI document for auth and protected routes", async () => {
    const app = await buildApp(env, new MemoryStore());
    const document = await app.inject({ method: "GET", url: "/docs/json" });
    expect(document.statusCode).toBe(200);
    expect(document.json().paths["/auth/register"]).toBeDefined();
    expect(document.json().paths["/users/me"].get.security).toEqual(expect.arrayContaining([expect.objectContaining({ bearerAuth: [] })]));
    await app.close();
  });
});
