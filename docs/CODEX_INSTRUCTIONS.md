# Instrucciones para Codex — Red Vital

## Objetivo

Implementar progresivamente el prototipo de Red Vital respetando el backlog definido en `docs/backlog.md` y el flujo Git `feature/* → develop → main`.

## Regla principal

No inventar tecnologías ni reemplazar código existente sin revisar primero el repositorio. Antes de implementar una historia:

1. Revisar la estructura actual.
2. Identificar el stack real utilizado.
3. Revisar README y documentación.
4. Revisar issues/backlog relacionados.
5. Implementar cambios mínimos y coherentes.
6. Agregar o actualizar pruebas cuando corresponda.
7. Documentar cambios relevantes.

## Orden recomendado de implementación

### Fase 1 — Base de usuarios
- US-01 a US-05
- US-06 a US-10

### Fase 2 — Solicitudes
- US-11 a US-16
- US-36 a US-40

### Fase 3 — Búsqueda y matching
- US-17 a US-27

### Fase 4 — Alertas y contacto
- US-28 a US-35

### Fase 5 — Historial y elegibilidad
- US-41 a US-45

### Fase 6 — Paneles y seguridad
- US-46 a US-50

## Reglas funcionales mínimas

- Una solicitud debe contener grupo sanguíneo, factor Rh, centro médico, cantidad requerida y fecha límite.
- Las solicitudes deben manejar los estados: Activa, En progreso, Cubierta/Completada, Cancelada y Expirada.
- El matching debe considerar compatibilidad sanguínea y disponibilidad.
- La cercanía debe utilizar la ubicación disponible de donante y centro médico.
- Los donantes no disponibles no deben recibir nuevas alertas de emergencia.
- Los datos personales deben validarse y tratarse con medidas de protección adecuadas.
- No exponer credenciales, tokens, claves API ni secretos en el código.

## Convención de commits

- `feat:` nueva funcionalidad
- `fix:` corrección
- `docs:` documentación
- `refactor:` reorganización interna
- `test:` pruebas

## Formato de trabajo de Codex

Para cada tarea, informar brevemente:

- Historia implementada.
- Archivos modificados.
- Cambios principales.
- Pruebas ejecutadas.
- Resultado de las pruebas.
- Pendientes o decisiones que requieran revisión humana.

## Criterio de finalización

Una historia se considera implementada cuando su comportamiento está integrado al proyecto, sus validaciones principales funcionan, las pruebas relevantes pasan y la documentación necesaria queda actualizada.
