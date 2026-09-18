# RedVital Mobile

Aplicación Expo/React Native con TypeScript para autenticación mobile real.

## Desarrollo

```bash
npm run start --workspace=@redvital/mobile
npm run check --workspace=@redvital/mobile
```

La API se configura con `EXPO_PUBLIC_API_BASE_URL`. Por defecto usa `http://127.0.0.1:3001` en iOS/web y `http://10.0.2.2:3001` en Android Emulator.

La app utiliza access tokens en memoria y guarda únicamente el refresh token en `expo-secure-store`. Las solicitudes mobile usan `Authorization: Bearer` y rotación de refresh tokens.
