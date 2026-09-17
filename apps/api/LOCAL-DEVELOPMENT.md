# Desarrollo local Windows

- Base: SQLite en `prisma/dev.db`.
- Inicialización: `scripts/init-sqlite.mjs`, idempotente y no destructiva.
- KDF local: `node:crypto` con scrypt, salt aleatorio y comparación constant-time.
- Producción futura: PostgreSQL con las migraciones Prisma existentes y Argon2id (`PASSWORD_HASHER=argon2`) en un entorno compatible.

El inicializador local existe para este entorno porque Application Control bloquea el schema engine de Prisma. No reemplaza las migraciones Prisma para infraestructura futura.
