# Arquitectura inicial de producción

```text
MVP web existente (transición posterior) ─┐
                                        ├─ HTTPS API Fastify ─ PostgreSQL
App React Native + Expo (futura) ────────┘
```

## Paquetes

- `apps/api`: API TypeScript, OpenAPI y Prisma.
- `apps/web`: servidor de transición para el MVP web de la raíz; no modifica su UI.
- `apps/mobile`: workspace reservado para la futura app Expo, sin pantallas aún.
- `packages/domain`: tipos, validaciones no visuales y compatibilidad orientativa compartibles.
- `packages/api-client`: cliente y contratos HTTP que usarán web y móvil.

## Modelo inicial

- `User`: identidad, rol, estado y futura referencia a contraseña hasheada.
- `Profile`: datos personales y de participación separados de la identidad.
- `BloodRequest`: solicitud y una instantánea explícita de los datos de contacto autorizados.
- `RefreshToken`: solo hashes revocables; nunca tokens en texto plano.
- `AuditLog`: estructura inmutable para acciones administrativas futuras.

No se incluyen datos demo ni endpoints de negocio. Los contactos de una solicitud se conservan separados del perfil porque el MVP ya los trata como datos de coordinación propios de cada publicación; eso evita cambiar retrospectivamente una solicitud si el perfil cambia.
