# Arquitectura real de RedVital

## Diagrama de ejecución

```text
WEB
  ↓
apps/web: servidor estático + proxy /api
  ↓
Fastify API
  ↓
Prisma
  ↓
SQLite local
```

```text
MOBILE
  ↓
packages/api-client / API client mobile
  ↓
Fastify API
  ↓
Prisma
  ↓
SQLite local
```

## Web

La web está compuesta por páginas HTML independientes, estilos en `css/` y controladores JavaScript en `js/`.

El servidor de `apps/web/server.mjs` escucha normalmente en `127.0.0.1:8000`, sirve los archivos de la raíz y proxyea `/api/*` hacia la API local en `127.0.0.1:3001`.

El flujo actual de registro, login, sesión, perfil, solicitudes y administración usa la API. La web usa cookies `httpOnly` para la sesión.

El código de `localStorage` permanece en archivos legacy como `js/storage.js`, `js/users.js` y `js/requests.js`, pero no representa la navegación API principal.

## API

`apps/api` implementa el backend con Fastify y TypeScript. Prisma accede a SQLite mediante el adaptador LibSQL.

La API registra rutas de autenticación, usuarios/perfiles, solicitudes de sangre, administración y health/docs.

PostgreSQL aparece como alternativa futura/productiva. La configuración actual utiliza SQLite.

## Autenticación

### Web

- Login con cookies `redvital_access` y `redvital_refresh`.
- Cookies `httpOnly`, `sameSite=lax` y `secure` en producción.
- La web renueva la sesión mediante `/auth/refresh` cuando recibe un 401.

### Mobile

- El access token se mantiene en memoria.
- El refresh token se guarda en `expo-secure-store`.
- Las llamadas autenticadas envían `Authorization: Bearer <token>`.
- La rotación de refresh tokens se realiza mediante la API.

## App mobile

La app está implementada en código con Expo, React Native y TypeScript. Existen las siguientes pantallas:

- `Login`
- `Register`
- `ForgotPassword`
- `ResetPassword`
- `Home`
- `Profile`
- `EditProfile`
- `Requests`
- `RequestDetail`
- `NewRequest`
- `MyRequests`
- `EditRequest`

Estado: **IMPLEMENTADA EN CÓDIGO / NO COMPLETAMENTE VALIDADA VISUALMENTE**.

## BloodRequest API

```text
POST  /blood-requests
GET   /blood-requests
GET   /blood-requests/:id
GET   /users/me/blood-requests
PATCH /blood-requests/:id
PATCH /blood-requests/:id/status
```

Las solicitudes se almacenan en `blood_requests`. El modelo conserva una instantánea de los datos de contacto de cada publicación.

## Base de datos

Modelos actuales:

- `User` → `users`
- `Profile` → `profiles`
- `BloodRequest` → `blood_requests`
- `RefreshToken` → `refresh_tokens`
- `PasswordResetToken` → `password_reset_tokens`
- `AuditLog` → `audit_logs`

SQLite es el proveedor actual de desarrollo. PostgreSQL queda reservado como alternativa futura.

## Estado de recuperación

La generación, hash, expiración y consumo de tokens de recuperación están implementados. El notifier de email no está conectado por defecto, por lo que el envío de instrucciones no debe considerarse una integración productiva completa.
