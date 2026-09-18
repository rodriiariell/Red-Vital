import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const statements = [
  "PRAGMA foreign_keys = ON",
  "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT, role TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL, deleted_at DATETIME)",
  "CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone TEXT, blood_type TEXT NOT NULL, rh_factor TEXT NOT NULL, city TEXT NOT NULL, available BOOLEAN NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT)",
  "CREATE TABLE IF NOT EXISTS blood_requests (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT NOT NULL, blood_type TEXT NOT NULL, rh_factor TEXT NOT NULL, hospital TEXT NOT NULL, city TEXT NOT NULL, priority TEXT NOT NULL, contact_phone TEXT NOT NULL, contact_email TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL, resolved_at DATETIME, FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT)",
  "CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at DATETIME NOT NULL, revoked_at DATETIME, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)",
  "CREATE TABLE IF NOT EXISTS password_reset_tokens (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at DATETIME NOT NULL, used_at DATETIME, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)",
  "CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY NOT NULL, actor_id TEXT, action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, metadata JSON, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL)",
  "CREATE INDEX IF NOT EXISTS blood_requests_owner_status_idx ON blood_requests(owner_id,status)",
  "CREATE INDEX IF NOT EXISTS blood_requests_status_blood_idx ON blood_requests(status,blood_type,rh_factor)",
  "CREATE INDEX IF NOT EXISTS refresh_tokens_user_expiry_idx ON refresh_tokens(user_id,expires_at)",
  "CREATE INDEX IF NOT EXISTS password_reset_tokens_user_expiry_idx ON password_reset_tokens(user_id,expires_at)",
  "CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity,entity_id)",
  "CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx ON audit_logs(actor_id,created_at)"
];

for (const sql of statements) await db.execute(sql);
console.log("SQLite schema initialized");
