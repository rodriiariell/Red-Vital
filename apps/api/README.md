# API de RedVital

Backend Fastify + TypeScript + Prisma. El entorno local actual utiliza SQLite mediante `@prisma/adapter-libsql`.

PostgreSQL está reservado como alternativa futura/productiva; no es el proveedor activo de desarrollo local.

## Configuración local

Copiar:

```text
apps/api/.env.example → apps/api/.env
```

No publicar `.env` ni copiar sus secretos en documentación. Las variables necesarias están declaradas en `.env.example`.

La base local se configura con `DATABASE_URL` y apunta a `prisma/dev.db` en esta configuración.

## Comandos reales

Desde la raíz:

```powershell
npm run build --workspace=@redvital/api
npm run start --workspace=@redvital/api
npm run dev:api
npm run db:init:sqlite --workspace=@redvital/api
npm run db:generate --workspace=@redvital/api
npm run test --workspace=@redvital/api
```

La API local utiliza normalmente:

```text
http://127.0.0.1:3001
```

## AUTH

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
```

El registro público acepta los roles `donor` y `patient`. Los administradores no se registran mediante esta ruta pública.

## USERS / PROFILE

```text
GET   /users/me
GET   /users/me/profile
PATCH /users/me/profile
PATCH /users/me/availability
```

La disponibilidad se almacena en `profiles.available` y se adapta al rol en la presentación web.

## BLOOD REQUESTS

```text
POST  /blood-requests
GET   /blood-requests
GET   /blood-requests/:id
GET   /users/me/blood-requests
PATCH /blood-requests/:id
PATCH /blood-requests/:id/status
```

Las operaciones se implementan mediante `BloodRequestStore` y Prisma sobre el modelo `BloodRequest`.

La creación requiere rol `patient`. La edición y resolución requieren ser propietario o administrador. El listado acepta filtros de grupo, localidad y estado mediante query params.

## ADMIN

```text
GET   /admin/users
PATCH /admin/users/:id/status
```

Estas rutas requieren autenticación y rol `admin`.

## HEALTH / DOCS

```text
GET /health
GET /docs
GET /docs/json
```

`/health` informa el estado del proceso. Swagger/OpenAPI está disponible mediante `/docs`.

## Recuperación de contraseña

Están implementados:

- creación de tokens aleatorios;
- almacenamiento del hash del token;
- expiración;
- consumo de único uso;
- actualización del hash de contraseña;
- revocación de refresh tokens existentes.

El notifier de email se recibe como dependencia opcional, pero no está conectado por defecto en `buildApp`. Por eso la lógica de recuperación existe, aunque el envío real de instrucciones no es una integración productiva completa.

## Seguridad de sesión

Para web, access y refresh tokens se entregan en cookies `httpOnly`. Para mobile, el cliente usa Bearer tokens: el access token se conserva en memoria y el refresh token se guarda en `expo-secure-store`.
