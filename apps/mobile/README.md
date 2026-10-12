# RedVital Mobile

Aplicación Expo/React Native con TypeScript conectada a la API de RedVital.

## Estado

La app está implementada en código, pero todavía no está completamente validada mediante pruebas visuales end-to-end.

Existen pantallas reales para:

- autenticación: `Login`, `Register`, `ForgotPassword`, `ResetPassword`;
- navegación principal: `Home`;
- perfil: `Profile`, `EditProfile`;
- solicitudes: `Requests`, `RequestDetail`, `NewRequest`, `MyRequests`, `EditRequest`.

## Desarrollo

```powershell
npm run dev:mobile
```

También puede utilizarse:

```powershell
npm run start --workspace=@redvital/mobile
npm run check --workspace=@redvital/mobile
```

## API

La URL puede configurarse con:

```text
EXPO_PUBLIC_API_BASE_URL
```

Si no se configura, el cliente usa:

- `http://127.0.0.1:3001` en iOS/web;
- `http://10.0.2.2:3001` en Android Emulator.

La integración se realiza mediante `packages/api-client` y `apps/mobile/src/api.ts`.

## Sesión y tokens

- El access token se mantiene en memoria.
- El refresh token se guarda en `expo-secure-store`.
- Las requests autenticadas envían `Authorization: Bearer <token>`.
- El cliente implementa refresh y rotación de tokens cuando recibe una respuesta 401.

## Alcance actual

La app contiene flujos de registro, login, logout, recuperación, perfil, disponibilidad, creación y edición de solicitudes, listado, detalle, filtros y resolución.

El estado visual E2E es **NO VERIFICADO COMPLETAMENTE**. Existen smoke scripts para autenticación y solicitudes, pero una ejecución de esos scripts no implica validación visual de todas las pantallas.
