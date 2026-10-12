# RedVital

RedVital es una aplicación para coordinar solicitudes de donación de sangre con posibles donantes. La versión actual utiliza una web HTML/CSS/JavaScript conectada a una API Fastify, Prisma y una base SQLite local.

## Arquitectura actual

- Web: HTML, CSS y JavaScript en la raíz del repositorio.
- Servidor web: `apps/web`, que sirve los archivos y hace proxy de `/api` hacia la API.
- Backend: Fastify + TypeScript.
- Persistencia: Prisma con SQLite en desarrollo local.
- Mobile: Expo + React Native + TypeScript, conectada a la misma API.
- PostgreSQL: alternativa futura para producción; no es la base activa del entorno local.

La web actual usa la API y cookies de sesión. El código basado en `localStorage` todavía existe en `js/`, pero corresponde al prototipo legacy y no es el flujo principal de la navegación actual. La app mobile usa la API con `Authorization: Bearer`.

## Estructura

```text
apps/web/              Servidor web y proxy /api
apps/api/              API Fastify, autenticación, solicitudes y Prisma
apps/mobile/           App Expo/React Native
packages/domain/       Tipos y validaciones compartibles
packages/api-client/   Cliente HTTP usado por mobile
js/                    Controladores y componentes de la web
css/                   Estilos de la web
*.html                 Pantallas web del MVP
```

## Instalación

Desde la raíz:

```powershell
npm install
```

Configuración local de la API:

```text
apps/api/.env.example → apps/api/.env
```

El archivo `.env` local no debe publicarse ni incluirse en documentación. Los secretos deben ser valores propios del entorno y nunca deben copiarse al repositorio.

## Web

```powershell
npm run dev:web
```

Acceso:

```text
http://127.0.0.1:8000
```

El servidor de `apps/web/server.mjs` sirve la web y convierte las llamadas `/api/*` en requests hacia `http://127.0.0.1:3001`.

## API

Compilar:

```powershell
npm run build --workspace=@redvital/api
```

Iniciar la versión compilada:

```powershell
npm run start --workspace=@redvital/api
```

Desarrollo con observación de cambios:

```powershell
npm run dev:api
```

API local:

```text
http://127.0.0.1:3001
```

Health check:

```text
GET /health
```

Documentación OpenAPI:

```text
GET /docs
GET /docs/json
```

## Base de datos

La base actual de desarrollo es SQLite, configurada mediante `DATABASE_URL` y almacenada localmente en `apps/api/prisma/dev.db`.

Comandos relacionados:

```powershell
npm run db:init:sqlite --workspace=@redvital/api
npm run db:generate --workspace=@redvital/api
```

PostgreSQL está contemplado como alternativa futura/productiva, pero no es el proveedor activo de esta configuración local.

## Mobile

```powershell
npm run dev:mobile
```

La URL de la API puede configurarse con `EXPO_PUBLIC_API_BASE_URL`. Si no se define, el cliente usa `127.0.0.1:3001` en iOS/web y `10.0.2.2:3001` en Android Emulator.

La app mobile tiene pantallas de autenticación, perfil y solicitudes implementadas en código. Su validación visual completa todavía no está verificada.

## Diferencias entre implementaciones

- `localStorage`: mecanismo legacy del prototipo inicial; no es la persistencia principal actual.
- Web actual: API Fastify mediante `/api` y cookies `httpOnly`.
- Mobile: API Fastify mediante Bearer tokens; el access token vive en memoria y el refresh token se guarda en `expo-secure-store`.
- SQLite: base activa para desarrollo local.
- PostgreSQL: opción futura para producción.

## Estado funcional

La API incluye autenticación, perfiles, disponibilidad, solicitudes de sangre, filtros por query, administración y recuperación mediante tokens. El notifier de email de recuperación no está conectado por defecto, por lo que esa parte no debe considerarse una integración productiva completa.

La compatibilidad sanguínea es orientativa. La validación definitiva corresponde al centro de salud.
