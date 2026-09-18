import type { FastifyRequest, preHandlerHookHandler } from "fastify";
import type { UserRole } from "@redvital/domain";
import { verifyAccessToken } from "./tokens.js";
import { AuthError } from "./service.js";
import type { AuthStore, UserRecord } from "./types.js";
import type { Environment } from "../config.js";

declare module "fastify" { interface FastifyRequest { authUser?: UserRecord; } }
export function authenticate(store: AuthStore, environment: Environment): preHandlerHookHandler { return async (request) => { const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? request.cookies[environment.AUTH_ACCESS_COOKIE_NAME]; if (!token) throw new AuthError(401, "Authentication required"); let id: string; try { id = await verifyAccessToken(token, environment); } catch { throw new AuthError(401, "Invalid access token"); } const user = await store.findUserById(id); if (!user || user.status !== "active" || user.deletedAt) throw new AuthError(401, "Authentication required"); request.authUser = user; }; }
export const requireRoles = (...roles: UserRole[]): preHandlerHookHandler => async (request: FastifyRequest) => { if (!request.authUser || !roles.includes(request.authUser.role)) throw new AuthError(403, "Forbidden"); };
