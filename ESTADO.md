# Estado vigente — candidato final F10 (2026-10-16)

Trabajo en `codex/phase-10`, sin merge a main. Barrera A integrada previamente. Este bloque sustituye los estados históricos siguientes (incluidas antiguas restricciones de ciclos).

Interfaz compartida F10, resumen administrativo real, rendiciones legibles, reportes compactos y cocina vacía sin navegación innecesaria. Sin datos inventados. Rutas legacy fuera de alcance retiradas del router. Backend: teléfono de cliente 9–10 dígitos; guard de seed antes de escrituras; auditoría sin anidación recursiva de historiales y lectura paginada de JSON histórico sin errores de memoria de ordenación. Se conservan contratos monetarios, roles, idempotencia, snapshots, estados independientes y datos existentes.

15 migraciones, ninguna nueva, sin cambios de esquema. Seed demo explícito e idempotente solo development/restaurante_app. SMTP CONFIGURADO: NO; pendiente proveedor/credenciales. No se afirma despliegue productivo, automatización externa de backups ni prueba física de impresora.

Evidencia final y limitaciones en [PHASE10.md](PHASE10.md).

---
## Registro histórico (no estado vigente)

# Estado vigente — Fase 10: Ciclo 2

Ciclo 1 aprobado. Ciclo 2: Cocina, salidas del mozo, Cobros, Delivery, Fiados y Devoluciones con presentación compacta. Backend y contratos F0–F9 preservados. Navegación a documentos con cuenta preseleccionada. Pruebas y límites en [PHASE10.md](PHASE10.md), sección Ciclo 2. No avance a Administración/Rendiciones/Reportes.

Rama `codex/phase-10`, desde main frontend `6998c748c59e2b060d52b1f232a22d2ab7389c73` y backend `f312cb5fff101a75983bd1f869b072b434b97469`. Barrera A ya fue aprobada e integrada; su registro previo se conserva abajo como histórico. Sin merge de F10 a main.

Puerto 3030 estricto, carga diferida de módulos no necesarios para login y estado de arranque visible. Diagnóstico Windows y comandos en [WINDOWS.md](WINDOWS.md). Se verificó el cambio de puerto automático reportado y se redujo el grafo inicial de 487 a 87 módulos; no se atribuye una URL pendiente no registrada ni se afirma haber reproducido Windows nativo.

Mejoras limitadas a estructura/header/sidebar y atención: mesas, pedidos/adicionales, reservas, carta, menú del día y disponibilidad. Mismos contratos, payloads, autorizaciones y reglas del servidor. Backend sin cambios; 15 migraciones existentes, ninguna nueva.

Pruebas y alcance en [PHASE10.md](PHASE10.md). Recorrido de atención/pedidos, responsive y regresiones F6–F9 ejecutados con backend real, sin excepciones JavaScript nuevas. No se avanzan otras pantallas. Windows fue validado por el usuario. Pendiente revisión visual de esta rama.

Corrección operativa sobre 0374828: mesas y tarjetas de cuentas como entrada principal; apertura lateral, catálogo con chips/búsqueda y personalización en diálogo, pedido lateral y envíos compactos, reservas lista/formulario, menú y disponibilidad en tarjetas. Sin backend ni reglas nuevas. Detalle y validación en PHASE10.md. No Ciclo 2.

---

## Registro histórico — Barrera A

# Estado vigente — Integración controlada Barrera A

Frontend `integration/f0-f9` desde `2e020095df2b284d13471151ccd51c61691eb0dd`. Backend intacto en `codex/phase-9`, `f312cb5fff101a75983bd1f869b072b434b97469`. Sin merge a main, sin modificar Gemini, sin F10/release. Barrera A pendiente de aprobación.

Integradas mejoras visuales teal/blanco, login, contraseña visible/oculta, sidebar persistente/colapsable, tooltips, responsive, clientes/trabajadores, carta/categorías/secciones/productos/presentaciones, restaurante/logo y mesas. Navegación F0–F9 por roles conservada. Mapa visual adaptado a ocupación por cuenta, sin reactivar Orders como agregado de atención.

Idempotencia: prioridad a claves explícitas F4–F9; HTTP genérico y creación/adición histórica por socket conservan clave de intención pendiente dentro de la pestaña. Sin UUID por intento ni fallback backend. Pruebas de respuesta perdida en pagos, doble clic, reconexión y servidor real.

Detalle de los 59 archivos, excepciones y evidencia: [INTEGRATION-BARRIER-A.md](INTEGRATION-BARRIER-A.md). Sin cambios de base de datos (15 migraciones F9). Backend 92 unitarias/137 HTTP correctas, frontend build/typecheck, regresiones browser F6–F9 y lint sin diagnósticos nuevos. Se conservan 22 diagnósticos históricos focalizados, sin barrido general.

Validación integrada final: F0–F3 con backend real, once rutas en 390×844/900×1100/1440×900 y cocina 1920×1080; sin excepciones JavaScript. Impresión F9 A4/80mm y regresiones F6–F9 correctas.

Limitaciones: recuperación por correo requiere SMTP; interfaz informa la indisponibilidad real y conserva vía administrativa F1. Recursos externos/endpoint cash-register heredado y avisos de bundle documentados. No validación de impresora o dispositivos físicos.

---

## Registro histórico — Fase 9

# Estado vigente — Ciclo D, Fase 9 (2026-10-14)

Rama `codex/phase-9`, directamente desde F8 aprobado `9f2c7d0a30976f4a40ad9b245ad4537da7dc055e`. Sin merge a main/Gemini; Barrera A abierta. Pendiente revisión del Arquitecto. No F10 ni release.

Implementado frontend funcional mínimo de documentos internos y reportes. Rutas `/internal-documents` y `/operational-reports`: cuenta previa, ticket con pagos parciales/mixtos, historial persistente, reimpresión auditada, impresión A4/80mm; 17 consultas operativas con filtros, paginación y permisos del servidor. Snapshot incluye logo y datos históricos; propinas, gratuidades y saldos diferenciados. No rediseño global.

Contratos y handoff: [PHASE9.md](PHASE9.md). Requiere backend F9 y migración aditiva 15 en `restaurante_app`. Fecha de venta aprobada por PO: confirmación del consumo/envío, incluidas bebidas. Métodos corresponden a cobros, sin duplicar ventas por pagos mixtos/cuotas.

Validado: typecheck/build, lint de pantallas nuevas/router/script, Chromium 1440×900, 900×1100 y 390×844; PDF A4 y térmico con extracción de texto y revisión visual; regresión de navegador F8 y F6–7. Backend pareado: 92 unitarias y 137 HTTP/MySQL correctas. Sin errores JavaScript nuevos de F9.

Deuda histórica: MenuData conserva exactamente los cuatro errores de símbolos no utilizados presentes en F8. Avisos de bundle, recursos externos inaccesibles y auth-renew401/cash-register404 heredados. No impresora física, CSV opcional no implementado. HTTP y browser deben ejecutarse secuencialmente por fixtures históricos compartidos. No validación con dispositivos físicos/conexiones independientes.

---

## Registro histórico — Fase 8

# Estado — Ciclo C, Fase 8 (2026-10-14)

Rama `codex/phase-8` desde F6–7 aprobado `71e11459a2d5a698a9fe63b07da3c8644a0aa90c`. Sin integración a main/Gemini; Barrera A abierta y revisión del Arquitecto pendiente. No Fase 9 ni release.

Implementado frontend funcional de para llevar, delivery propio/courier externo, contacto/destino, estados, asignación de courier, custodia de efectivo, consumo de personal y cortesías. Reutiliza Atención, Cocina y Finanzas, sin rediseño general. Decisión PO: nuevos consumos que requieran otro viaje usan otra atención.

Contratos, operación, límites y handoff: [PHASE8.md](PHASE8.md). Backend requiere la migración F8 (14 acumuladas) exclusivamente en restaurante_app.

Verificado: typecheck/build, lint focalizado de archivos modificados; smoke Chromium F8 escritorio/móvil y regresión financiera F6–7 (pago efectivo/vuelto, Yape manual, rendición y persistencia al recargar). Sin excepciones JavaScript nuevas. Diagnósticos heredados: auth-renew401 previo a login, cash-register/actives404, fuentes/imagen externas inaccesibles en Cloud. No se corrigió masivamente lint histórico.

Pruebas HTTP y browser deben ejecutarse en secuencia, por la comprobación histórica global de usuarios en la suite de Pedidos. Pruebas reproducibles en tests/phase8.browser.cjs y tests/phase67.browser.cjs; no validan dispositivos/conexiones móviles físicos distintos.
