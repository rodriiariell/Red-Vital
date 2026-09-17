# API de RedVital

Backend TypeScript con Fastify y PostgreSQL mediante Prisma. Implementa autenticación y gestión del perfil; las solicitudes de sangre siguen fuera de alcance.

## Configuración

Copiar `.env.example` como `.env` dentro de `apps/api` y reemplazar los valores. `DATABASE_URL` debe apuntar a una base PostgreSQL vacía para la primera migración.

## Comandos

```powershell
npm.cmd run dev:api
npm.cmd run db:generate --workspace=@redvital/api
npm.cmd run db:migrate:dev --workspace=@redvital/api
npm.cmd run db:migrate:deploy --workspace=@redvital/api
npm.cmd run db:check --workspace=@redvital/api
```

- Salud del proceso: `GET /health`
- OpenAPI/Swagger UI: `/docs`

## Autenticación

- Registro público: `POST /auth/register` (solo `donor` y `patient`).
- Sesión: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- Recuperación: `POST /auth/forgot-password`, `POST /auth/reset-password`.
- Perfil autenticado: `GET /users/me`, `GET/PATCH /users/me/profile`, `PATCH /users/me/availability`.

Web usa access y refresh tokens en cookies `httpOnly`, `sameSite=lax` y `secure` en producción; no se devuelven tokens al JavaScript web. Mobile enviará/recibirá ambos tokens mediante su futuro almacenamiento seguro. El proveedor de email aún no está conectado: integrar un notifier que reciba el token de recuperación y entregue un enlace al usuario, sin registrarlo ni devolverlo por la API.

La ruta de salud no abre una conexión a PostgreSQL. `db:check`, las migraciones y el futuro repositorio de datos sí la requerirán.
