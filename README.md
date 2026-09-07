# 🩸 Red Vital

**Red Vital** es una plataforma digital diseñada para agilizar la donación de sangre, conectando pacientes que necesitan transfusiones urgentes con donantes compatibles y cercanos.

## 👥 Integrantes y roles

| Integrante | Rol |
|---|---|
| Agustín Tomás Portillo | Project Manager |
| Daira Melina Viera Gómez | Analista de Marketing / Diseñadora |
| Rodrigo Ariel Espíndola | Analista de Negocio |
| Alan Bautista Maidana Rodríguez | Analista Funcional |

## 🎯 Objetivo

Reducir los tiempos de búsqueda de donantes durante emergencias mediante solicitudes centralizadas, compatibilidad sanguínea, geolocalización, alertas y confirmación de asistencia.

## ⚙️ Funcionalidades principales

1. **Registro y perfil de donantes:** grupo sanguíneo, factor Rh, ubicación, contacto y disponibilidad.
2. **Registro de paciente/solicitante:** creación rápida de cuenta para publicar pedidos.
3. **Verificación de contacto:** validación de teléfono o correo.
4. **Solicitudes de emergencia:** tipo de sangre, factor Rh, centro médico, cantidad de donantes y fecha límite.
5. **Feed de solicitudes:** búsqueda y filtros por tipo de sangre, ubicación, distancia y urgencia.
6. **Estados:** Activa, En progreso, Cubierta/Completada, Cancelada y Expirada.
7. **Matching:** compatibilidad sanguínea y cercanía geográfica.
8. **Alertas:** notificaciones Push/SMS/Email a donantes compatibles.
9. **Contacto directo:** confirmación de asistencia y coordinación.
10. **Historial:** registro de donaciones realizadas.
11. **Recordatorios:** aviso cuando el donante vuelve a estar disponible.

## 🛠️ Tecnologías utilizadas

El repositorio corresponde a la **Etapa 15 de documentación y control de versiones**. El stack tecnológico definitivo del prototipo todavía no fue proporcionado por el equipo, por lo que se evita inventar tecnologías o comandos de ejecución.

Cuando se incorpore el código fuente, esta sección deberá indicar las tecnologías reales utilizadas.

## ▶️ Instrucciones para ejecutar el proyecto

Actualmente el repositorio contiene la documentación de la Etapa 15 y la estructura de trabajo de GitHub. Las instrucciones de instalación y ejecución se incorporarán junto con el código fuente y el stack tecnológico definitivo.

## 📁 Estructura de carpetas

```text
Red-Vital/
├── README.md
├── frontend/
├── backend/
├── docs/
└── tests/
```

> Esta estructura representa la organización prevista para el proyecto. Las carpetas de código se incorporarán cuando se agregue la implementación.

## 🌿 Ramas

- `main` → versión estable y entregable.
- `develop` → integración del desarrollo.
- `feature/donor-registration` → registro y perfil de donante.
- `feature/emergency-request` → solicitudes de emergencia.
- `feature/matching-geolocation` → matching y geolocalización.
- `feature/notifications` → sistema de alertas.
- `feature/donation-history` → historial de donaciones.

### Flujo de trabajo

```text
feature/* → develop → main
```

1. Crear una rama `feature/nombre-funcionalidad` desde `develop`.
2. Implementar la funcionalidad mediante commits claros.
3. Revisar y probar los cambios.
4. Integrar mediante Pull Request a `develop`.
5. Llevar a `main` únicamente versiones estables.

## 🐛 Issues

El proyecto cuenta con **11 Issues funcionales** para organizar las tareas:

1. Registro y perfil de donante.
2. Registro de paciente/solicitante.
3. Verificación de identidad/contacto.
4. Creación de solicitud urgente.
5. Feed/lista de solicitudes activas.
6. Estado de la solicitud.
7. Sistema de geolocalización y filtro.
8. Envío de alertas Push/SMS/Email.
9. Canal de contacto directo.
10. Registro de donaciones realizadas.
11. Recordatorios de disponibilidad.

## 📝 Convención de commits

Se utilizan mensajes claros siguiendo una convención basada en:

- `feat:` → nueva funcionalidad.
- `fix:` → corrección de errores.
- `docs:` → documentación.
- `refactor:` → reorganización o mejora interna.
- `test:` → pruebas.

Ejemplos:

```text
feat: add donor registration
fix: correct form validation
docs: update README
```

## 📌 Estado de la Etapa 15

- [x] Repositorio GitHub creado.
- [x] README documentado.
- [x] Rama `main`.
- [x] Rama `develop`.
- [x] Ramas `feature/*`.
- [x] Issues funcionales creadas.
- [x] Convención de commits documentada.
- [x] Flujo de trabajo Git definido.

---

**Etapa 15 — GitHub y Control de Versiones**  
**Proyecto: Red Vital**
