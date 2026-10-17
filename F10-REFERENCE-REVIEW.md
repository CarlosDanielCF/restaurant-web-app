# F10 — Referencias finales Point Restaurant

## Base y alcance

HEAD inicial: `ca9aa9ab0a94f6e4463b3ce871db9978b7959028`, rama `codex/phase-10`, árbol inicialmente limpio.
Cambios únicamente frontend; sin push, merge, migraciones, seeds ni consultas manuales de BD.
Main se conserva en `b6fc55edb2a7cecc4c5180b56377c1b3316c8b71`.
Backend permanece limpio en `23c69e818235f2ad33c7fd1f5a891e58b306adbb`.
No se accedió a `tienda`.

## Todas las referencias estudiadas

Se extrajeron y visualizaron completas las tres imágenes del ZIP `imagenes diseño.zip`:

| Imagen | Adaptación |
| --- | --- |
| Atención y pedidos-1.png | Mapa de mesas compacto con número/icono/estado; panel contextual; catálogo con navegación lateral de categorías en escritorio, cards y buscador; secciones de menú y reservas. |
| Cocina, cobros y delivery-2.png | Jerarquía de tickets, identificación independiente del envío, observaciones destacadas, saldo y métodos separados, resúmenes de deuda, progreso delivery y estados vacíos. |
| Administración y control restaurantero-3.png | Indicadores semánticos con iconos, atenciones recientes reales, navegación de reportes, agrupación de rendición y configuración. |

No se incorporaron los nombres, cifras ni operaciones ficticias de las referencias. No se copió la indicación obsoleta «impresión futura» ni la exclusión universal de bebidas de cocina.

## Pantallas

- **Login, header, sidebar y configuración:** se mantiene el trabajo aprobado, el logo oficial y el restaurante configurado como identidades distintas. Revisados en navegador junto a usuarios, clientes, gestión de mesas y carta permanente. No se reescribieron formularios ni permisos.
- **Atención/mesas:** tiles verticales compactos, estados textuales además del color, selección teal, mapa dominante; paneles blancos delimitados y pestaña activa inequívoca. Selección múltiple existente conservada.
- **Catálogo/pedido:** categorías en columna en escritorio y chips en tamaños menores; cards compactas con imagen o placeholder, precio, presentación y disponibilidad. Personalización, pedido actual, motivos, envíos y sus tiempos conservan contratos y handlers.
- **Reservas/menú:** paneles y componentes agrupados, acentos coherentes; no se asignan mesas antes de llegada ni se cobran componentes de nuevo.
- **Cocina:** identificación de envío en badge, mejor separación de productos y observaciones y cabecera de pendientes. No se agregaron acciones de preparación/salida. Se conserva la selección de tres envíos y el reloj existente; validación real en este entorno únicamente con cocina vacía.
- **Cobros/rendición:** jerarquía visual de saldo, historial y bloques de resumen; estado vacío profesional de turnos. No se alteraron importes, medios, propinas, devoluciones ni cierres.
- **Fiados:** deuda, abonado y saldo en tres celdas diferenciadas; estado vacío y paginación innecesaria oculta cuando no hay candidatos.
- **Delivery:** progreso y paneles operativos, estado vacío intencional. Entrega y pago siguen separados.
- **Resumen:** indicadores reales con iconos/colores semánticos y últimas cinco atenciones del resultado existente. Sin endpoints ni métricas inventadas; se conserva la advertencia del límite actual de 500 cuentas.
- **Reportes:** navegación y tabla con mayor contraste y estado vacío explícito. Sin cambios de filtros/endpoints.
- **Documentos:** estado vacío consistente; snapshots y CSS de impresión intactos. Las nuevas reglas de estilo son de pantalla, no de impresión.

## Corrección frontend segura

El catálogo antes consideraba disponible un producto `AVAILABLE` aunque tuviese stock controlado en cero. Ahora lo indica como agotado y deshabilita **Agregar**, conservando **Gestionar**. Refleja la validación existente del servidor; no cambia el consumo de porciones ni calcula disponibilidad por precio.

## Validaciones y límites

- `pnpm typecheck` y `pnpm build`: aprobados; build conserva advertencias de dependencias/chunks grandes.
- `node --test tests/idempotency.test.cjs tests/display-money.test.cjs`: 9/9 (6 idempotencia y 3 presentación monetaria).
- `tests/startup.browser.cjs`: aprobado, login carga 90 módulos de código y no el router privado; arranque demorado recuperable; puerto 3030 ocupado no deriva a 3031.
- `tests/idempotency-hook.browser.cjs`: aprobado; doble clic, timeout, remontaje, reconexión, A/reintento A/B y claves de add-order-detail.
- ESLint focalizado de TS/TSX y prueba modificados: aprobado. ESLint completo: **1.123 errores**, idénticos al resultado del commit inicial extraído en un directorio temporal; no se corrigió deuda masiva ajena al alcance.
- Smoke de navegador contra backend real: **51 comprobaciones aprobadas (48 capturas y 3 comprobaciones de interacción local)**. login; Atención y sus pestañas; Cocina; Finanzas; resumen; reportes; documentos; restaurante; usuarios; clientes; mesas; carta; historial. Viewports 390×844, 900×1100, 1440×900 y Cocina 1920×1080. Comprueba pantalla no vacía, overflow global/de contenido, header y ausencia de excepciones JS. También selección/deselección de dos mesas y búsqueda sin coincidencias/restauración de catálogo, sin guardar operaciones.
- API real: login de Dueño, Administrador, Mozo y Cocinero aprobado. Catálogo/menú/cocina accesibles según rol; reportes globales rechazados a Mozo/Cocinero; cuentas/reservas/turnos rechazados a Cocinero. `x-restaurant-id` ajeno arbitrario devuelve 403 en los cuatro roles. Esto no sustituye una prueba con dos restaurantes reales poblados.
- Demo consultado: 24 mesas en pantalla, 8 productos y 1 menú; cero cuentas, reservas, comandas, turnos y ventas en las consultas. No se inventaron pagos para llenar pantallas. **No se ejecutó el circuito transaccional completo** apertura → pedido → envío → salida → cobro, ni devoluciones, abonos o cierre de rendición en esta revisión.
- Sin nuevas excepciones JS. Se observaron 401 de renovación sin sesión y 404 del endpoint heredado `/api/cash-register/actives`; no se presentan como consola totalmente limpia.
- Búsqueda `Teikien|Teikio` en `src`, `public`, `index.html`: sin coincidencias. Logo oficial preservado; logos históricos de restaurantes no sustituidos.

## OBSERVACIÓN FUNCIONAL — REQUIERE BACKEND

El dominio operativo calcula `requiresKitchen` a partir de `kind === FOOD` (`catalog.service.ts`, cotización de producto/combo/menú). El envío vuelve a filtrar componentes FOOD (`fulfillment.service.ts`). Un campo legacy `productionArea` en pedidos antiguos no resuelve el flujo de cuentas actual.

Se requiere ruteo persistente configurable por producto independiente de FOOD/DRINK, validación/DTO autorizados, snapshot de ruteo al consumir y resolución coherente de componentes/menús/combos; adaptación de envío, disponibilidad y salidas. Deben probarse bebidas preparadas y embotelladas, adicionales, reintentos y aislamiento. **No se modificó backend ni se añadió un control frontend que prometiera un ruteo inexistente.**

## Otras observaciones no modificadas

- **Frontend funcional:** Documentos inicializa selección desde `accountId` pero el efecto de contexto la limpia al montar. El enlace contextual puede perder la preselección; no afecta la selección manual. Requiere prueba específica con cuenta real y cuidado con cambio de restaurante antes de corregirlo.
- **Frontend funcional:** fiados lista candidatos con cliente y consulta la deuda individualmente; si todos carecen de deuda puede quedar sin cards aunque haya candidatos. No se modificó la consulta ni se inventó una deuda.
- **Integración/backend:** endpoint legacy de caja devuelve 404 al navegar el historial; observado, no corregido dentro del rediseño.
- **Visual pendiente de datos:** tickets llenos, pagos mixtos, devoluciones, delivery y rendiciones con movimientos necesitan validación visual con operaciones representativas existentes. No se afirma validación de todos los estados posibles.
- **Infraestructura/externos:** SMTP real, backups externos, despliegue productivo e impresión física no verificados aquí. No se instalaron servicios ni se modificaron.

## Evidencia local

Capturas/resultados en `/workspace/cloud-setup/point-reference-review-final`, logs `point-reference-browser-final.log`, `point-functional-read.log`, `point-final-build.log` (fuera de Git). No contienen contraseñas. Los tests reciben credenciales por variable de entorno y no crean datos demo.
