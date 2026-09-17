-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DONOR', 'PATIENT', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "BloodType" AS ENUM ('O', 'A', 'B', 'AB');
CREATE TYPE "RhFactor" AS ENUM ('POSITIVE', 'NEGATIVE');
CREATE TYPE "RequestPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "BloodRequestStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "blood_type" "BloodType" NOT NULL,
    "rh_factor" "RhFactor" NOT NULL,
    "city" VARCHAR(160) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blood_requests" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "blood_type" "BloodType" NOT NULL,
    "rh_factor" "RhFactor" NOT NULL,
    "hospital" VARCHAR(200) NOT NULL,
    "city" VARCHAR(160) NOT NULL,
    "priority" "RequestPriority" NOT NULL,
    "contact_phone" VARCHAR(30) NOT NULL,
    "contact_email" VARCHAR(320) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "status" "BloodRequestStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),
    CONSTRAINT "blood_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");
CREATE INDEX "blood_requests_owner_id_status_idx" ON "blood_requests"("owner_id", "status");
CREATE INDEX "blood_requests_status_blood_type_rh_factor_idx" ON "blood_requests"("status", "blood_type", "rh_factor");
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_user_id_expires_at_idx" ON "refresh_tokens"("user_id", "expires_at");
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blood_requests" ADD CONSTRAINT "blood_requests_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
