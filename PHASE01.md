# Compatibilidad con Fases 0 y 1

Los requisitos definitivos prevalecen sobre contratos históricos. Backend requerido: migraciones SecurityFoundation, DomainContracts, PrivateProductImages y DomainIntegrity. Esta entrega adapta interfaces existentes, sin rediseño general ni habilitar pagos/caja/rendiciones/delivery/reportes.

- Roles API DUENO / ADMINISTRADOR / MOZO / COCINERO. Autorización visual real y autorización definitiva en servidor. Dueño hereda rutas administrativas. Cocina consulta pendientes y edita disponibilidad; no marca listo ni salida.
- Usuarios → Crear trabajador utiliza alta administrativa; ya no enlaza la invitación antigua deshabilitada. En edición, generar enlace privado de recuperación/activación. El trabajador define contraseña de 12–72 caracteres con mayúscula/minúscula/número. Nadie inicia con su documento como contraseña.
- Configuración: nombre/logo existentes más zona IANA y QR Yape persistente. QR no registra pagos. Archivos permitidos PNG/JPEG/WebP estáticos, 5MiB y 4096×4096; backend valida contenido.
- Imágenes se cargan mediante axios autenticado y URL Blob revocable. También se resuelven uploads históricos a ruta privada. No debe utilizarse un img directo a imagen privada sin Authorization/x-restaurant-id.
- Cliente HTTP propaga contexto, Idempotency-Key, expectedVersion e If-Match. Socket de pedidos incluye versión y clave; hook evita doble toque y conserva clave para reintentar después de timeout. Clave válida debe mantenerse para el mismo comando; conflicto 409 requiere recargar/revisar.
- Cambio de restaurante reconecta socket; logout revoca JWT en backend además de limpiar sesión local. Actualizar ambos repositorios y volver a iniciar sesión para reflejar códigos de rol.

## Verificación

`pnpm build` (tsc + Vite) exitoso. Lint focalizado de nuevos componentes/hooks/API sin errores. Lint global sigue con deuda histórica: más de 1200 errores (1250 en el commit base); no se hizo limpieza masiva. Smoke Chromium: login, productos, mesas, clientes, pedidos, configuración y usuarios sin errores de ejecución de página. También se verificó alta de trabajador, enlace privado, activación y login como mozo desde navegador.

Backend tiene 55 pruebas unitarias y 39 de integración HTTP/Socket.IO MySQL, incluyendo roles, dueño, aislamiento, claves/versiones, recuperación, imágenes y regresiones. Ver su ESTADO.md y docs/SECURITY.md para contratos completos.

## Límites visibles

Pantallas históricas de caja, suscripción, cuentas y métodos de pago no tienen backend de esta fase y pueden consultar rutas 404. No se desarrollaron. Order histórico sigue siendo consumo básico, no la cuenta definitiva ni despacho con reloj por envío. Esos flujos se sustituirán en sus fases operativas según el modelo preparado. SMTP de recuperación requiere configuración del despliegue; el enlace privado administrativo funciona sin correo externo.

Repositorio frontend tenía origin/master; esta entrega se publica en origin/main según instrucción explícita, conservando master. Configurar el despliegue para seguir main; no se cambia automáticamente la rama por defecto de GitHub.
