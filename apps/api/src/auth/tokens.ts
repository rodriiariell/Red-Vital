import { SignJWT, jwtVerify } from "jose";
import type { UserRecord } from "./types.js";
import type { Environment } from "../config.js";

const encoder = new TextEncoder();
export async function createAccessToken(user: UserRecord, environment: Environment) {
  return new SignJWT({ role: user.role }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime(environment.AUTH_ACCESS_TOKEN_TTL).sign(encoder.encode(environment.AUTH_ACCESS_TOKEN_SECRET));
}
export async function verifyAccessToken(token: string, environment: Environment) {
  const { payload } = await jwtVerify(token, encoder.encode(environment.AUTH_ACCESS_TOKEN_SECRET));
  if (!payload.sub) throw new Error("Missing subject");
  return payload.sub;
}
export function expiryFromTtl(ttl: string) {
  const match = /^(\d+)([mhd])$/.exec(ttl); if (!match) throw new Error("Unsupported token TTL");
  const multiplier = { m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as "m" | "h" | "d"];
  return new Date(Date.now() + Number(match[1]) * multiplier);
}
