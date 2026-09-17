import type { BloodType, RhFactor, UserRole, UserStatus } from "@redvital/domain";

export interface ProfileRecord { firstName: string; lastName: string; phone: string | null; bloodType: BloodType; rhFactor: RhFactor; city: string; available: boolean; }
export interface UserRecord { id: string; email: string; passwordHash: string | null; role: UserRole; status: UserStatus; deletedAt: Date | null; profile: ProfileRecord | null; }
export interface RefreshRecord { user: UserRecord; expiresAt: Date; revokedAt: Date | null; }
export interface AuthStore {
  createUser(input: Omit<UserRecord, "id" | "status" | "deletedAt">): Promise<UserRecord>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  updateProfile(userId: string, changes: Partial<ProfileRecord>): Promise<UserRecord>;
  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  rotateRefreshToken(tokenHash: string, replacementHash: string, expiresAt: Date): Promise<UserRecord | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  consumePasswordResetToken(tokenHash: string, passwordHash: string): Promise<UserRecord | null>;
  audit(action: string, entity: string, entityId?: string, actorId?: string): Promise<void>;
  listUsers(): Promise<UserRecord[]>;
}
