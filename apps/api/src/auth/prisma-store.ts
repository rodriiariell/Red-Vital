import type { PrismaClient } from "../../generated/prisma/client.js";
import type { AuthStore, ProfileRecord, UserRecord } from "./types.js";

const role = (value: string) => value.toLowerCase() as UserRecord["role"];
const profile = (value: any): ProfileRecord | null => value ? ({ firstName: value.firstName, lastName: value.lastName, phone: value.phone, bloodType: value.bloodType, rhFactor: value.rhFactor === "POSITIVE" ? "+" : "-", city: value.city, available: value.available }) : null;
const user = (value: any): UserRecord => ({ id: value.id, email: value.email, passwordHash: value.passwordHash, role: role(value.role), status: value.status.toLowerCase(), deletedAt: value.deletedAt, profile: profile(value.profile) });
const dbRole = (value: string) => value.toUpperCase() as any;
const dbBlood = (value: string) => value as any;
const dbRh = (value: string) => value === "+" ? "POSITIVE" : "NEGATIVE";

export class PrismaAuthStore implements AuthStore {
  constructor(private readonly db: PrismaClient) {}
  async createUser(input: Omit<UserRecord, "id" | "status" | "deletedAt">) { const value = await this.db.user.create({ data: { email: input.email, passwordHash: input.passwordHash, role: dbRole(input.role), profile: { create: { firstName: input.profile!.firstName, lastName: input.profile!.lastName, phone: input.profile!.phone, bloodType: dbBlood(input.profile!.bloodType), rhFactor: dbRh(input.profile!.rhFactor), city: input.profile!.city, available: input.profile!.available } }, }, include: { profile: true } }); return user(value); }
  async findUserByEmail(email: string) { const value = await this.db.user.findUnique({ where: { email }, include: { profile: true } }); return value ? user(value) : null; }
  async findUserById(id: string) { const value = await this.db.user.findUnique({ where: { id }, include: { profile: true } }); return value ? user(value) : null; }
  async updateProfile(userId: string, changes: Partial<ProfileRecord>) { const data: any = { ...changes }; if (changes.rhFactor) data.rhFactor = dbRh(changes.rhFactor); if (changes.bloodType) data.bloodType = dbBlood(changes.bloodType); const value = await this.db.user.update({ where: { id: userId }, data: { profile: { update: data } }, include: { profile: true } }); return user(value); }
  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) { await this.db.refreshToken.create({ data: { userId, tokenHash, expiresAt } }); }
  async rotateRefreshToken(tokenHash: string, _replacementHash: string, _expiresAt: Date) { return this.db.$transaction(async (tx) => { const token = await tx.refreshToken.findUnique({ where: { tokenHash }, include: { user: { include: { profile: true } } } }); if (!token || token.revokedAt || token.expiresAt <= new Date() || token.user.status !== "ACTIVE" || token.user.deletedAt) return null; await tx.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } }); return user(token.user); }); }
  async revokeRefreshToken(tokenHash: string) { await this.db.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } }); }
  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) { await this.db.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }); }
  async consumePasswordResetToken(tokenHash: string, passwordHash: string) { return this.db.$transaction(async (tx) => { const token = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: { include: { profile: true } } } }); if (!token || token.usedAt || token.expiresAt <= new Date()) return null; await tx.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }); await tx.user.update({ where: { id: token.userId }, data: { passwordHash } }); await tx.refreshToken.updateMany({ where: { userId: token.userId, revokedAt: null }, data: { revokedAt: new Date() } }); return user(token.user); }); }
  async audit(action: string, entity: string, entityId?: string, actorId?: string) { await this.db.auditLog.create({ data: { action, entity, entityId, actorId } }); }
  async listUsers() { return (await this.db.user.findMany({ include: { profile: true } })).map(user); }
}
