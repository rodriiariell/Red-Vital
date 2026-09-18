import { randomUUID } from "node:crypto";

export class MemoryStore {
  users = new Map();
  refresh = new Map();
  resets = new Map();
  audits = [];
  async createUser(input) { const user = { ...input, id: randomUUID(), status: "active", deletedAt: null }; this.users.set(user.id, user); return user; }
  async findUserByEmail(email) { return [...this.users.values()].find((user) => user.email === email) ?? null; }
  async findUserById(id) { return this.users.get(id) ?? null; }
  async updateProfile(id, changes) { const user = this.users.get(id); user.profile = { ...user.profile, ...changes }; return user; }
  async createRefreshToken(userId, hash, expiresAt) { this.refresh.set(hash, { userId, expiresAt, revokedAt: null }); }
  async rotateRefreshToken(hash, replacement, expiresAt) { const token = this.refresh.get(hash); if (!token || token.revokedAt || token.expiresAt <= new Date()) return null; const user = this.users.get(token.userId); if (user.status !== "active" || user.deletedAt) return null; token.revokedAt = new Date(); this.refresh.set(replacement, { userId: user.id, expiresAt, revokedAt: null }); return user; }
  async revokeRefreshToken(hash) { const token = this.refresh.get(hash); if (token) token.revokedAt = new Date(); }
  async createPasswordResetToken(userId, hash, expiresAt) { this.resets.set(hash, { userId, expiresAt, usedAt: null }); }
  async consumePasswordResetToken(hash, passwordHash) { const token = this.resets.get(hash); if (!token || token.usedAt || token.expiresAt <= new Date()) return null; token.usedAt = new Date(); const user = this.users.get(token.userId); user.passwordHash = passwordHash; for (const refresh of this.refresh.values()) if (refresh.userId === user.id) refresh.revokedAt = new Date(); return user; }
  async audit(action) { this.audits.push(action); }
  async listUsers() { return [...this.users.values()]; }
}
