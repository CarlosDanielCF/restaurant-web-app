# Estado vigente — observaciones operativas (19/10/2026)

Base `51f0a1f8b9b179a1f5baa9192604a486645c9464`, rama `codex/phase-10`. Confirmación con feedback/reconciliación, DIRECT separado de producción, captura limpia tras éxito, cortesías parciales contextuales, responsable directo, comandas diarias, carga recuperable y compras/stock claras. Backend coordinado requiere migración22; no ejecutada en base local. Detalles y límites: [F10-OBSERVATIONS-REVIEW.md](F10-OBSERVATIONS-REVIEW.md). No push ni cambios en main.

## Registro histórico de revisiones anteriores

# Corrección de alcance — compras de mercado y bebidas (19 octubre 2026)

Base exacta `d97b320638278b9dce3430d55e7110048a23821a`, rama `codex/phase-10`. Se retira el tercer tipo genérico de egreso del formulario manual, tipos, etiquetas, dashboard y fórmula. Registrar compra de mercado envía MARKET; la compra de bebidas sigue generando su egreso BEVERAGE al ingresar stock. Resultado = cobranzas netas − compras de mercado − compras de bebidas.

Se mantienen stock, Kardex, reportes/historial y toda operación previa. No cambian categorías legacy de medios de pago ajenas a este módulo. Backend y migración21 corregidos coordinadamente; pruebas aisladas, sin seeds ni cambios a la base del usuario. Main intacta, sin push/merge/force-push. Evidencia: [SUPPLIES-REPORTS.md](SUPPLIES-REPORTS.md).

Validación de esta corrección: typecheck/build/lint focalizado,29 unitarias y7 grupos navegador aprobados;0 excepciones JS/API404 en390×844,900×1100,1440×900 y cocina1920×1080. Backend:156 unitarias,23 grupos HTTP/MySQL y esquema1→21 aislado con0pendientes al repetir.

---

# Estado vigente — compras, bebidas y reportes (19 octubre 2026)

Rama `codex/phase-10`, base exacta `698b1d3aad6747cfcf5ddc8a1ea2662dadeea359`. Main permanece en `b6fc55edb2a7cecc4c5180b56377c1b3316c8b71`. Sin push/merge/force-push; revisión local pendiente.

Nuevo módulo lazy Compras y bebidas: configuración explícita por SKU, ingresos, apertura/conteo/ajuste/recuperación con motivo, Kardex y gastos. Resumen autoritativo de ventas/cobranzas/egresos/resultado por moneda, reportes agrupados con filtros, CSV completo y cronología de cuenta. Costos/compras reservados a Dueño/Admin y restricciones existentes, también validados por backend. Se conserva Point Restaurant como software, restaurante configurable y operación previa.

Requiere backend coordinado y migración 21. No hay seeds ni migraciones desde frontend ni carga de datos ficticios del cliente. Validación: typecheck/build/lint focalizado, 29 unitarias y 6 grupos de navegador real contra backend MySQL aislado; 390×844, 900×1100, 1440×900 y cocina 1920×1080. Cero excepciones JS/API404 en el recorrido. Evidencia, límites y procedimiento: [SUPPLIES-REPORTS.md](SUPPLIES-REPORTS.md). No se afirma nueva validación física ni repetición de todas las combinaciones históricas.

---
## Registro histórico — estados previos

# Revisión post-manual — 19 octubre 2026

Correcciones frontend de carga por rutas, retirada del consumidor de caja legacy, apertura contextual, Delivery integrado, pedido más ancho, presentaciones neutras y timbre seguido de voz. Backend sin cambios;20 migraciones conservadas, sin seeds. Evidencia y límites: [F10-POST-MANUAL.md](F10-POST-MANUAL.md). Pendiente revisión local; sin push/merge.

# Estado vigente — revisión global UX operativa (2026-10-18)

Frontend sobre `codex/phase-10`, base `ca6ea6ea967cac24a06c1579bcb4c951fa0977a7`. Backend `ea620499d51c438fe13ff906a8616a88a9df2a8e` sin modificaciones. Sin push ni merge. Esta sección prevalece sobre los registros históricos siguientes.

Auditoría transversal de módulos y cuatro roles, navegación contextual, reserva/llegada corregida para mozo, disponibilidad directa, opciones secundarias sin eliminar capacidades, documentos prioritarios, reportes móviles y accesos de trabajador limitados visualmente al rol base. Detalle, conteo aproximado de interacciones, evidencia y límites en [F10-GLOBAL-UX.md](F10-GLOBAL-UX.md).

No se crearon ni ejecutaron migraciones o seeds. El esquema Cloud existente se consulta sin alterar su registro; no se presupone que Windows tenga esas migraciones aplicadas. `tienda` no se utiliza. Las suites históricas que ejecutan seeds/migraciones automáticamente no se invocan; runner nuevo usa APIs reales y fixture aislado sin ese bootstrap.

Validación de esta pasada: backend 105 unitarias; frontend 18 unitarias; build/typecheck/lint focalizado aprobados; integración real HTTP/MySQL/navegador de cuatro roles aprobada, sin excepciones JS ni recargas operativas en el recorrido. Detalles de cobertura y suites no ejecutadas en F10-GLOBAL-UX.md.

---
## Registro histórico de estados anteriores

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

## Optimización operativa — revisión local

Mesa → cuenta atómica → catálogo, responsable mozo automático, ruteo de producción, restricciones por trabajador y reconciliación/sesión. Ver [OPERATIONAL-UX.md](OPERATIONAL-UX.md) para inventario previo, contratos, pruebas y límites. Requiere backend `codex/operational-ux` y su migración aditiva (16 total). Sin push ni merge.

## Punto Mar — presentación local

Cliente independiente de Point Restaurant, catálogo real y selección rápida de presentaciones. Ver [PUNTO-MAR.md](PUNTO-MAR.md). Backend añade tradeName y seed aislado/idempotente; requiere 17 migraciones. Fotografías pendientes por bloqueo de acceso/licencias, sin imágenes inventadas. Sin push/merge.

## F10 — revisión operativa posterior a Punto Mar (2026-10-18)

Mesas semánticas, borradores agrupables/editables, catálogo con cantidad/nota, salidas directas, sonido de cocina desbloqueado/deduplicado y cobro contextual simplificado. Requiere backend coordinado y migración 18. Evidencia, flujos, límites y archivos conservados: [F10-OPERATIVE-REVIEW.md](F10-OPERATIVE-REVIEW.md). Solo ramas de revisión; sin push/merge.

## Ronda operativa — revisión local (18 octubre 2026)

Nueva semántica de mesas verde/rojo por confirmación, edición contextual de borradores, protección de unidades entregadas, cancelación/sustitución parcial, devolución excepcional separada del reembolso y descuentos proporcionales con redondeo seguro. Para llevar por cantidades, cobro mixto validado, QR responsive, voz de cocina con respaldo y navegación específica de cocina. Requiere backend coordinado y migraciones 19–20. Ver `F10-OPERATIVE-REVIEW.md` para contratos, pruebas, decisión definitiva y limitaciones. Sin push/merge; marca del software Point Restaurant separada del restaurante configurado.

Validación de cierre de la ronda: backend 105 unitarias + 156 HTTP/MySQL, frontend 15 pruebas; build/typecheck/lint correspondientes y tres recorridos browser aprobados con backend real. 20 migraciones aplicadas / 0 pendientes. Ver F10-OPERATIVE-REVIEW para cobertura, limitaciones y archivos. Sin push/merge.
