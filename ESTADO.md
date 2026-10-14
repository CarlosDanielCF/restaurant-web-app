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
