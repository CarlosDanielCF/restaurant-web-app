# F10 — Corrección consolidada post-revisión manual

Fecha: 19 octubre 2026. Frontend base `772bcd040adad29f15d24a8b2fdeeb07fc665166`, rama `codex/phase-10`. Backend sin cambios: `ea620499d51c438fe13ff906a8616a88a9df2a8e`, `codex/operational-ux`. No push ni merge. No cambios de contratos, esquema, permisos base, dinero, idempotencia ni sockets.

## Auditoría por observación

| OBS | Causa / intervención | Archivos principales | Estado / evidencia |
|---|---|---|---|
| 1 | Router privado importaba anticipadamente vistas de gestión e históricos, incluyendo dependencias PDF pesadas. Carga diferida por ruta, imports directos de iconos/loader del acceso. | App, Login, routers, main | CORREGIDO el grafo eager; LIMITACIÓN DE ENTORNO para el minuto en Windows. Mediciones abajo. |
| 2 | Private ejecutaba useAllActiveCashRegisters al entrar, aunque BalanceRouter ya no está montado. Se retira ese consumidor global y su modal antiguo; FinancePage conserva el contrato vigente de turnos. No se convierte un Shift en CashRegister. | Private.tsx, prueba global | VALIDADO: cero llamadas legacy/cero404 API; apertura, consulta, cobro, fondo, envío y confirmación de turno. |
| 3–4 | Listado offsite global duplicaba Mesa/Delivery; apertura mostraba campos opcionales siempre. Activos solo en Delivery; referencia/cliente/nota en Más detalles, reparto en opciones. | AttentionWorkspace, OffsiteCards | VALIDADO: edición de delivery y cobro contextual. Recogidas históricas y apertura excepcional sin mesa siguen secundarias, no como modalidad principal. |
| 5 | Verde sin distinción suficiente. Badge ABIERTA y borde discontinuo verde para atención sin confirmación. | AttentionWorkspace, operational-ux.css | VALIDADO: apertura contextual y badge; regla de rojo tras envío intacta. |
| 6–7 | Cascada CSS reducía panel de pedido; capas de overflow. Grid aproximadamente61/39, mínimo340px para pedido desde900px, un scroll por panel. Finalizar atención bajo Más opciones. | operational-ux.css, AttentionWorkspace | VALIDADO: ratio35–42% a1440; móvil alterna Productos/Pedido; pagar no libera mesa. |
| 8–9 | Nombres técnicos del seed visibles. Fallback exclusivamente de presentación Opción1/2; editor explica configuración. Variante sencilla se agrega al elegir, personalización continúa secundaria. | presentationLabel, AttentionWorkspace, ServiceCatalog, KitchenPage, ModalUpdateProductOption | VALIDADO: nombre neutral, precio35 y cantidad1; sin modificar registros ni snapshots históricos. |
| 10 | Altura máxima de cuentas creaba scrollbar pequeño. Grid fluido sin max-height. | operational-ux.css | CORREGIDO; responsive sin overflow global. |
| 11 | Nombres artificiales provienen de registros del seed, no de nombres reales disponibles. No se sustituyen por personas inventadas. | Documentación | PENDIENTE DE DATOS DEL CLIENTE. |
| 12 | Aviso genérico mencionaba capacidades ajenas al rol. Aviso explica únicamente restricciones dentro del rol base. | WorkerPermissions | VALIDADO: modal de cocina solo capacidades de su rol; lógica intacta. |
| 13 | Pestaña Reservas aparecía al cocinar aunque API ya la denegaba. Excluirla, no consultar reservas y denegar query directa de esa pestaña. | Operations.page | VALIDADO: sin pestaña, URL denegada, API403; finanzas/atención y cross-restaurant403. |
| 14–15 | Nueva comanda emitía voz sin timbre previo. Oscilador local corto, voz al finalizar; control con icono/estado. Se elimina texto duplicado. | kitchenSound, KitchenPage | VALIDADO: AudioContext real → voz instrumentada una vez; tracker cubre carga/reconexión. Sin audio externo. |
| 16 | Formulario del dueño permanente. Tocar mesa abre diálogo de responsable; detalles opcionales. Apertura manual y selección/unión siguen disponibles. | AttentionWorkspace | VALIDADO: dueño asigna mozo y abre cuenta, variante con un toque. |
| 17–20 | Branding, QR configurado, iconos existentes y operaciones aprobadas deben preservarse. | Sin cambios a assets/QR | Conservados; no fotografías ni datos de Punto Mar inventados. |

## Carga: evidencia y límites

Medición Chromium local, contextos nuevos, Vite3030/backend5000 existentes, sin throttling. `readyMs` hasta campo de usuario o texto del mapa de mesas; captura de solicitudes durante1,5s adicionales. La caché/transformación de Vite no equivale a una prueba controlada de Windows.

| Ruta | Antes: ms / solicitudes / módulos src | Después estable: ms / solicitudes / módulos src |
|---|---|---|
| Login | 780 /150 /90 | 518 /147 /83 |
| Atención | 1576 /565 /404 | 1168 /316 /194 |

La primera repetición después de cambiar imports tuvo Login3596ms y166 módulos mientras Vite reoptimizaba; otra Atención1978ms. No se promete una mejora temporal fija. Sí se redujo el grafo inicial privado de404 a194 módulos fuente. El barrel de iconos preoptimizado medía6,3MB; login ahora importa sus iconos directamente. El PDF legacy aún genera un chunk grande (~3950KiB) al acceder a históricos: diferido, no eliminado porque hay funciones que lo usan.

No reprodujimos los60s ni determinamos una causa única de `/@vite/client` pendiente en Windows. Ese recurso depende del servidor de desarrollo antes de ejecutar React. Mantener pnpm y puerto3030 estricto según WINDOWS.md; verificar instancia/URL correcta y caché Vite si vuelve a ocurrir. No se oculta loader para aparentar mejora.

## Contratos y funciones conservadas

FinancePage continúa usando `/finance/shifts`, POST de apertura, `/:id/cash`, `/:id/submit`, `/:id/confirm`. Cobros/rendición no dependen del antiguo modal global. Los archivos Balance/cash-register se conservan por referencias entre módulos históricos; no se borran basándose solo en su antigüedad. El recorrido normal prueba que nunca los solicita.

Se mantienen pago parcial/mixto, QR manual sin alteración, POS externo, propina/deuda/reembolso, correcciones, cancelaciones proporcionales, estados históricos y cierre explícito. Este ciclo no vuelve a certificar todas sus combinaciones: regresión monetaria unitaria y recorrido de efectivo/rendición son la evidencia ejecutada. Los componentes y contratos financieros no se modifican.

Para llevar parcial sigue dentro del pedido de mesa. TAKE_AWAY histórico no se elimina del modelo ni se altera en reportes; su acceso excepcional se conserva en opciones secundarias para no borrar capacidades.

## Datos pendientes del cliente

Nombres de trabajadores: el seed de Punto Mar contiene Administrador/Mozo/Cocina + Presentación; no se ejecutó ni modificó. Administración debe cargar nombres reales autorizados.

Presentaciones comerciales pendientes (mantienen precios y edición administrativa): Ceviche Punto Mar, Ceviche clásico, Ceviche con crema de rocoto ahumado, Chicharrón de pescado, Chicharrón mixto, Arroz con mariscos, Chaufa de mariscos, Chaufa de langostinos, Arroz a la norteña. Opción1/2 no inventa tamaño. Fotografías pendientes de assets autorizados.

## Pruebas reproducibles

- `COREPACK_HOME=/workspace/.corepack corepack pnpm typecheck`: PASS.
- `COREPACK_HOME=/workspace/.corepack corepack pnpm build`: PASS. Avisos heredados use-client de dependencias/chunks grandes.
- ESLint focalizado sobre TS/TSX y CJS modificados: PASS; aviso de versión React no especificada en configuración.
- `node --test tests/*.test.cjs`:20 PASS,0 FAIL (6 idempotencia,5 monetarias,5 sonido,3 permisos y1 presentaciones).
- `node tests/global-ux.browser.cjs`: PASS; backend HTTP/MySQL real, cuatro roles, sin importar fixture legacy que ejecuta seeds/migraciones. Crea datos temporales aislados vía API y limpia solo su propio restaurante de prueba. No carga datos del cliente.
- Recorrido: disponibilidad, reserva/llegada, qty2/para-llevar1, envío real, cocina live, salidas parcial/total, cobro58 recibido60 vuelto2, mesa sigue abierta, documento, delivery/edit, dueño abre asignando mozo, variante neutral, turno/fondo/envío/confirmación, reportes y restricciones.
- Browser instrumenta SpeechSynthesis para contar texto y orden; AudioContext/oscilador reales. No demuestra audición física ni disponibilidad de voz masculina del SO. Browser comprueba además offline/online sin segundo timbre/voz. Unitarias comprueban snapshots iniciales/reconexión silenciosos y deduplicación. Sin voz española instalada queda timbre/aviso visual; navegador puede exigir nueva interacción.
- Capturas y assertions de overflow a390×844,900×1100,1440×900; cocina1920×1080 y móvil. Cero excepciones JS, cero full reload operativo, cero404 API, cero peticiones cash-register. El runner navega explícitamente entre rutas para smoke.
- No se ejecutó la suite backend completa porque backend no cambió. No se ejecutaron suites antiguas que inicializan seeds/migraciones. No se repitieron todas las combinaciones de cancelaciones, pagos mixtos ni3 tickets simultáneos en TV en este ciclo; su lógica no cambió.

## Seguridad y entrega

20 migraciones antes/después sin cambios; ninguna nueva/ejecutada, ningún seed. Solo restaurante_app. `tienda` no consultada ni modificada. Backend y ambas main intactas. Un commit local frontend; sin push/merge/force-push. Ningún archivo eliminado. SMTP/impresión física/infraestructura externos no intervenidos.

## Inventario de archivos modificados

- `ESTADO.md`
- `F10-OPERATIVE-REVIEW.md`
- `F10-POST-MANUAL.md`
- `src/App.tsx`
- `src/main.tsx`
- `src/pages/Private/Clients/router/Clients.router.tsx`
- `src/pages/Private/EditMenu/router/MenuEdit.router.tsx`
- `src/pages/Private/EditMenu/views/Products/components/ModalUpdateProductOption.component.tsx`
- `src/pages/Private/Operations/AttentionWorkspace.tsx`
- `src/pages/Private/Operations/KitchenPage.tsx`
- `src/pages/Private/Operations/OffsiteCards.tsx`
- `src/pages/Private/Operations/Operations.page.tsx`
- `src/pages/Private/Operations/ServiceCatalog.tsx`
- `src/pages/Private/Operations/kitchenSound.ts`
- `src/pages/Private/Operations/presentationLabel.ts`
- `src/pages/Private/Orders/router/Order.router.tsx`
- `src/pages/Private/Private.tsx`
- `src/pages/Private/Restaurant/router/Restaurant.router.tsx`
- `src/pages/Private/Tables/router/Tables.router.tsx`
- `src/pages/Private/Users/components/WorkerPermissions.tsx`
- `src/pages/Private/Users/router/Users.router.tsx`
- `src/pages/Private/router/private.router.tsx`
- `src/pages/Public/Auth/Login/Login.page.tsx`
- `src/styles/operational-ux.css`
- `tests/global-ux.browser.cjs`
- `tests/kitchen-sound.test.cjs`
- `tests/presentation-label.test.cjs`
