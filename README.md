# RedVital — MVP

RedVital es una aplicación web demostrativa que conecta a personas que publican solicitudes de donación de sangre con posibles donantes de su comunidad. El objetivo principal del MVP es que una solicitud pueda publicarse, encontrarse mediante filtros o compatibilidad orientativa y derivar en un contacto directo con el responsable.

## Ejecutar

No requiere instalación ni dependencias. Puede abrirse `index.html` directamente en un navegador moderno. Para evitar restricciones de módulos ES al usar `file://`, se recomienda servir la carpeta:

```powershell
python -m http.server 8000
```

Luego abrir `http://localhost:8000`.

## Usuarios demo

- Donante: `donante@demo.redvital` / `Demo1234`
- Paciente / Responsable: `paciente@demo.redvital` / `Demo1234`
- Administradora: `admin@demo.redvital` / `Demo1234`

Los ejemplos están identificados como “Demo”. Desde la landing se pueden restablecer los datos demostrativos. La acción elimina únicamente los datos de RedVital guardados por este navegador.

## Flujos

- Paciente / Responsable: registro, login, perfil, crear solicitud, listar las propias, editar, marcar solicitud como resuelta y logout.
- Donante: registro, login, perfil con grupo sanguíneo, disponibilidad, solicitudes, filtros, detalle, WhatsApp, email y logout.
- Administrador: panel propio para consultar usuarios y gestionar el estado de las solicitudes.
- Acceso: páginas privadas protegidas y permisos de propietario antes de editar o resolver.

## Estructura

- HTML: páginas independientes y semánticas para landing, acceso, panel, perfil y solicitudes.
- `css/`: variables, base, componentes, páginas y responsive.
- `js/storage.js`: persistencia y datos demo.
- `js/auth.js` y `js/users.js`: sesión, acceso y usuarios.
- `js/requests.js`: ciclo de vida y propiedad de solicitudes.
- `js/compatibility.js`: única fuente de reglas de compatibilidad orientativa.
- `js/validation.js`, `js/ui.js` y `js/app.js`: validación, componentes y controladores de vistas.

## Privacidad y limitaciones

`localStorage` se utiliza exclusivamente como almacenamiento demostrativo. La sesión guarda únicamente el identificador del usuario y el acceso se resuelve por rol en JavaScript; esta capa debe sustituirse por sesiones y autorización del lado servidor al migrar a PHP. No es apropiado para producción: cualquier persona con acceso al navegador puede inspeccionar o modificar los datos y no existe autenticación segura del lado servidor. Aunque la interfaz nunca muestra contraseñas y evita insertar inputs como HTML sin escapar, este MVP conserva credenciales localmente para simular el login.

Una versión productiva necesita backend, base de datos, contraseñas con hash, sesiones seguras, autorización del lado servidor, auditoría y políticas formales de privacidad. RedVital no almacena diagnósticos, historias clínicas ni coordenadas personales exactas.

La compatibilidad se presenta como orientación para transfusión de glóbulos rojos y nunca como aptitud médica. La validación definitiva corresponde al centro de salud. El panel administrativo incluido es demostrativo y sus permisos deben trasladarse al servidor en una implementación productiva.

## Identidad institucional

El repositorio recibido no contenía el logo oficial. La interfaz usa temporalmente una marca tipográfica generada con CSS para mantener navegación accesible. Cuando se proporcione `assets/logo-redvital.png`, debe sustituirse esa marca sin recolorear, recortar ni deformar el archivo.

## Implementación reemplazada

El directorio de trabajo estaba vacío al iniciar, por lo que no se reemplazó ni eliminó una implementación anterior, documentación o assets. Git no estaba disponible en el entorno y no pudo crearse un checkpoint ni commit.
