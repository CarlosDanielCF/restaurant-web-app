# Ciclo D — handoff de documentos internos y reportes

Rama `codex/phase-9` desde F8 aprobado `9f2c7d0a30976f4a40ad9b245ad4537da7dc055e`. Backend pareado desde `40701afa6b02c3bd127961485330a1aae8ace39b`; requiere migración `InternalDocuments1760358400000` (15 acumuladas), exclusivamente restaurante_app. Sin main/Gemini, Barrera A abierta; no F10/release.

## Accesos funcionales

- Menú **Documentos internos**, `/internal-documents`: seleccionar atención, emitir cuenta previa o ticket tras un pago registrado, consultar historial propio/global autorizado, reimprimir e imprimir. El historial general permite recuperar documentos del mozo aunque cambie el responsable de la cuenta.
- Menú **Reportes operativos**, `/operational-reports`: selección de reporte, fechas, usuario/responsable mediante directorio del restaurante, método/modalidad/estado/tipo cuando aplican, totales separados y paginación. Muestra carga, errores y estados vacíos.
- Los controles visuales son mínimos y siguen MUI existente; no hubo rediseño general ni modificación de Gemini.

## Documentos

Siempre DOCUMENTO INTERNO, nunca boleta/factura. UUID, SHA256 y snapshot persistido de restaurante/logo, zona horaria, moneda, nombres y consumos/configuración/precios, descuentos, pagos, vuelto y propinas. Ticket parcial muestra PENDIENTE DE PAGO. Yape/tarjeta son métodos registrados manualmente, no confirmación bancaria externa.

El frontend imprime **el snapshot del servidor**, no consulta catálogo/nombres actuales para reconstruirlo. Logo histórico data URI de bytes persistidos. ACCOUNT/TICKET no cambian estados de atención, cocina o pago. La reimpresión usa POST auditado. No aceptar importes calculados por navegador para emisión.

Impresión aislada mediante portal React y CSS que se activa solo dentro de Documentos. Oculta navegación/botones; layout común190mm (A4/Letter) y preparación térmica72mm sobre página80mm, sin integración física. Se neutraliza únicamente al imprimir el flex global heredado, que de otro modo comprime texto. Preservar los estilos de html/body al imprimir y su limpieza al salir de la página.

## Contratos

Todos bajo `/api`, JWT + `x-restaurant-id`. POST emite/reimprime con Idempotency-Key; emisión exige expectedVersion. Reintentos inciertos mantienen clave/intención. Conflictos409 requieren revisar cuenta actual; no emitir silenciosamente con otro estado.

- POST `/internal-documents/accounts/:id`: `{kind:ACCOUNT|TICKET,expectedVersion}`.
- GET `/internal-documents`: historial accesible; `page`, `limit`≤100.
- GET `/internal-documents/accounts/:id`: metadatos paginados de esa cuenta autorizada.
- GET `/internal-documents/:id`: `{id,kind,createdAt,issuedBy,sha256,snapshot,...}`.
- POST `/internal-documents/:id/reprint`: misma identidad/contenido; registra solicitud, no prueba impresión física.
- GET `/operational-reports/directory`: nombres/IDs/roles mínimos para filtros, por tenant; mozo solo él mismo.
- GET `/operational-reports/:kind`: `{from,to,page,limit,userId?,responsibleUserId?,method?,modality?,status?,movementType?}`. `from/to`: días locales inclusivos YYYY-MM-DD, máximo366 días. Backend devuelve timeZone/capturedAt, descripción semántica, rows, totals por movimiento/moneda, total/page/limit. Filtros no aplicables devuelven400.

Kinds: sales, collections, settlements, top-products, slow, discounts, portions, cancellations, refunds, courtesies, tips, staff, debts, installments, audit, delivery, custody. Contratos detallados y reglas: backend `docs/PHASE-9.md`.

Sin eventos Socket.IO nuevos; reportes se consultan explícitamente y muestran momento de captura.

## Semántica que debe preservarse

Decisión PO: venta por **confirmación de consumo**, incluidas bebidas; borradores/prepagos no crean venta. User filtra actor/cobrador, o beneficiario en personal/propinas, trabajador en rendiciones; responsable es filtro separado de la atención actual.

Cuotas ya incluidas en cobros no se suman otra vez. Deuda no es efectivo. Propinas, cortesías y personal no son ventas. Custodia courier no es segundo cobro. Reembolso no borra el pago ni equivale a cancelación. El reporte sales es consumo confirmado vigente del período, no cierre contable inmutable; documentos sí son inmutables. Métodos pertenecen a collections, no se reparte ficticiamente la venta entre todos sus métodos.

## Permisos

DUENO/ADMINISTRADOR: reportes administrativos del restaurante. MOZO: solo propias rendiciones/propinas/auditoría y documentos autorizados. COCINERO: solo comandas lentas; sin documentos financieros. Backend impone estos límites independientemente del selector frontend.

## Validación

`pnpm build` (incluye typecheck), ESLint de Insights y router, smoke `tests/phase9.browser.cjs` con Chromium/Playwright externos como pruebas F8. Escritorio1440×900, tablet900×1100, móvil390×844. Genera PDFs de prueba fuera de Git, extrae texto mediante pdftotext y verifica que incluya documento/producto sin navegación. Verificación visual adicional del PDF.

No ejecutar browser en paralelo con HTTP/MySQL: la regresión antigua de Pedidos compara datos globales previos, y los fixtures de navegador crean usuarios propios. Fixtures se limpian de forma acotada.

Lint de MenuData conserva4 errores históricos de símbolos no utilizados (mismos en commit F8); no se corrige deuda masiva. Build mantiene avisos anteriores de tamaño de bundle/directivas use client. Recursos externos inaccesibles y llamadas heredadas auth-renew401 previo al login/cash-register404 se distinguen de errores nuevos.

## Límites

Sin SUNAT/facturación, impresora física, Excel/PDF complejo/CSV ni contabilidad empresarial. Sin hardening/F10. No se solicitó cambio bloqueante a Friend+Gemini; revisión visual posterior debe preservar snapshots/contratos y estilos de impresión aislados.
