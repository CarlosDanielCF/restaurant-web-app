# F10 — revisión operativa Punto Mar

Bases verificadas limpias: frontend 914b2f1ea2d43bce48b556aee7c4ad7dba6f3970, backend 98a01a71ed00330d777a6ee81d8e714aeac06b3a. Main no se modifica; no push/merge.

## Inventario previo

| Flujo | Problema comprobado en código | Cambio | Riesgo y validación |
|---|---|---|---|
| Mesa | Estilo verde también ocupada | Rojo/texto y cuenta pulsable | Pago/salida no liberar; comprobar cierre |
| Borrador | Cancelación igual que enviado, adiciones separadas | Edición/eliminación de borrador y agrupación opt-in segura | Versiones, descuentos, snapshot, stock, idempotencia |
| Carta | Logo como imagen, controles lejos | Placeholder neutro, cantidad/nota próximas, scroll por zona | Preservar personalización, móvil, estado |
| Salida | Selector técnico y controles avanzados primero | Entregar por producto; excepciones secundarias | No duplicar, parcial/corrección |
| Sonido | Solo vigila notices, no dispatches; no prueba al habilitar | Audio desbloqueado + prueba, IDs vistos y baseline de reconexión | Probar mecanismo y deduplicación, no afirmar audición física |
| Cobro | Navegar y reseleccionar; formulario amplio | Enlace contextual y pago completo simple; avanzado desplegable | Dinero exacto, versión, turno, QR y confirmación manual |
| Archivos | Múltiples rutas históricas | No eliminar sin prueba objetiva | Build/imports/tests, cero borrado por intuición |

Se conserva ruteo PRODUCTION/DIRECT, permisos solo restrictivos y todos los flujos avanzados.

## Flujos implementados

- Mesa disponible verde / ocupada roja, con texto. La ocupación se obtiene de cuentas abiertas y asignaciones, nunca del pago ni de la salida. Una mesa ocupada abre su cuenta. El responsable automático al entrar sigue siendo el usuario MOZO autenticado; la transferencia existente se conserva.
- Carta: placeholder de plato de MUI (sin assets externos), cantidad y observación en la propia tarjeta. Presentaciones/configuraciones conservan el selector/modal. Las mutaciones nuevas optan por agrupación de borradores equivalentes.
- Borrador: cantidad +/- y eliminación completa antes de confirmar. Confirmado: sustitución/cancelación con motivo y avisos existentes. La eliminación de borrador no aparece como cancelación de cocina. Las notas en edición no se sobrescriben durante revalidación.
- Desktop/tablet >=900px: dos áreas con desplazamiento independiente. Móvil: alternancia Productos/Pedido actual; sin dos columnas estrechas. Los formularios se mantienen montados para conservar edición.
- Salidas: botón Entregar junto al producto, cantidad parcial o todas las pendientes. Sin pendientes no se ofrece otra entrega normal. Corrección, recuperación y notas auditadas permanecen en Más opciones.
- Cobrar desde cuenta enlaza a la cuenta exacta y abre el pago. Cobro completo usa saldo del servidor como aplicado; efectivo pide recibido y muestra vuelto con los helpers decimales existentes. Pago parcial/mixto revela importes y otros medios. División, descuentos, propinas, fiado, reembolso y rendición siguen disponibles en la cuenta financiera.
- Turno: si existe, se utiliza; si falta, puede abrirse desde el diálogo. La apertura no confirma dinero. Pago no libera mesas; Finalizar atención es una operación posterior explícita y vuelve al mapa.
- Yape: QR original del restaurante vía carga autenticada existente, tamaño contenido sin recorte. Confirmación visual obligatoria y cobrador visible. Ausencia de QR explícita. Tarjeta es POS externo manual. No se incorporaron servicios de cobro.

## Sonido

El defecto era que se observaban únicamente avisos de cambio/cancelación, no nuevos envíos; además activar no reproducía prueba. Ahora la interacción explícita crea/resume AudioContext y reproduce un tono breve. El estado depende de que el contexto esté funcionando. Se observan IDs persistentes de envíos y avisos: un lote de novedades produce un tono; revalidación/rerender no repite IDs. La primera carga y la primera instantánea tras reconexión son silenciosas. No se reproduce sonido continuo ni se reenvían operaciones.

Limitación física: automatización puede observar el AudioContext real y osciladores, pero no demuestra volumen/altavoz audible de cada teléfono/TV. Navegadores pueden suspender audio en segundo plano; puede requerirse reactivarlo con interacción. Chrome es el navegador ejecutado en Cloud; otros dispositivos requieren comprobación local.

## Archivos aparentemente antiguos

No se eliminó ningún archivo. Se conservaron rutas de pedidos históricos (runtime), componentes financieros avanzados (división, propina, fiado, reembolso), utilidades de idempotencia/sockets (runtime/tests), migraciones históricas (persistencia) y assets de marcas/restaurantes (configuración/snapshots). No existe evidencia suficiente para borrar archivos solo por antigüedad. Se retiró únicamente el uso del logo como placeholder de producto; el logo oficial del software permanece.

## Contrato coordinado

Ver `restaurant-backend/docs/F10-OPERATIVE-REVIEW.md`. El frontend nuevo requiere la migración/endpoint de borradores del backend de esta revisión. Los contratos financieros, permisos individuales restrictivos, sesiones multidispositivo, routing PRODUCTION/DIRECT y sockets existentes se conservan.

Edición simultánea: al empezar a escribir una nota se conserva la versión de la cuenta. Si cambia mientras se escribe, el texto permanece, se muestra advertencia y el servidor rechaza la escritura obsoleta. Descartar edición permite recuperar explícitamente el dato actual. No hay sobrescritura automática de texto local por sockets.

## Validación reproducible (2026-10-18)

- `pnpm typecheck`, `pnpm build`: aprobados. Lint focalizado de TSX/TS/tests modificados aprobado; aviso heredado de versión React del plugin.
- `node --test tests/*.test.cjs`: 12/12 (6 idempotencia, 3 dinero y 3 sonido).
- `tests/operative-review.browser.cjs`: fixture aislado real MySQL/backend; verde/rojo, cantidad 2 y nota en una línea, quitar/eliminar borrador, AudioContext real + prueba + deduplicación + reconexión, salida parcial/total, cobro contextual 58/60/2, turno rápido y pago separado de cierre. Capturas 390/900/1440 y cocina 1920/móvil.
- `tests/operational-ux.browser.cjs`: cuatro contextos, dos mozos/dos cocinas; PRODUCTION/DIRECT, adicionales, cambios/cancelación, disponibilidad, reconexión, permisos dinámicos. 0 recargas de documento durante operación y 0 excepciones JS.
- `tests/phase10-finance.browser.cjs`: respuesta de pago perdida + reintento/doble clic con misma clave, efectivo parcial/vuelto, Yape manual y ausencia/presencia de imagen QR configurada, propina, descuento, devolución, fiado/abono, documentos; responsive financiero. La imagen de fixture solo comprueba carga/respeto del asset, no es un QR bancario real ni prueba de transferencia.
- Backend coordinado: 98 unitarias y 147 HTTP/MySQL aprobadas; incluye aislamiento, roles/restricciones, stock simultáneo, reintentos, relojes y regresión financiera/documentos/reportes.
- Migración repetida: 18 aplicadas, 0 pendientes. Sin seed Punto Mar ni manipulación de su catálogo. Los tests usan restaurantes efímeros propios y limpieza de sus filas.

Los runners de navegador usan `PLAYWRIGHT_MODULE` cuando Playwright está fuera del repo y Chromium del entorno. Ejecutar HTTP/MySQL y browser secuencialmente (suite histórica observa usuarios globales). Las activaciones repetidas pueden alcanzar el rate limit de recuperación; esperar su ventana de 15 minutos, nunca desactivarlo/borrar registros para obtener un aprobado.

## Alcance de evidencia y pendientes

No se certificó audición por altavoz físico, Safari, dispositivos físicos ni redes móviles diferentes. La prueba responsive utiliza Chromium y viewports. No se incorporaron fotografías externas: continúan pendientes imágenes autorizadas del restaurante. SMTP/infraestructura productiva/impresora física no se modificaron. Persisten avisos de bundle grande y dependencias; no se hizo refactor masivo.

No se amplían restricciones existentes sobre unión de cuentas que ya tienen movimientos. No se inventa una nueva regla financiera. Las propinas continúan vinculadas al cobro registrado y se gestionan separadamente, como antes.

### Evidencia para conservar archivos

- `src/pages/Private/Balance/components/ModalCreateCashRegister.component.tsx`: importado y montado en `Private.tsx`; no borrar por parecer legacy.
- `layouts/SidebarLayout/Header/Buttons/CashRegister/*`: referencia histórica comentada en Buttons y dependencias internas; sin análisis completo de rutas dinámicas/build no se elimina.
- `src/pages/Private/router/private.router.tsx`: conserva rutas reales a Finanzas/Cocina y pedidos históricos; no se suprimen capacidades.
- `src/api/pendingOperation.ts`, tests de idempotencia y financieros: referenciados por runtime/tests y necesarios para regresión.
- Assets Point Restaurant y restaurante: no se sustituyen entre sí; solo se cambió el fallback de fotografías.

Eliminados: **ninguno**. Sin push, merge, modificación de main o acceso a `tienda`.

## Archivos de este ciclo

- `ESTADO.md`
- `F10-OPERATIVE-REVIEW.md`
- `README.md`
- `src/pages/Private/Finance/FinancePage.tsx`
- `src/pages/Private/Operations/AttentionWorkspace.tsx`
- `src/pages/Private/Operations/DraftLineEditor.tsx`
- `src/pages/Private/Operations/FulfillmentPanel.tsx`
- `src/pages/Private/Operations/KitchenPage.tsx`
- `src/pages/Private/Operations/ServiceCatalog.tsx`
- `src/pages/Private/Operations/kitchenSound.ts`
- `src/pages/Private/Operations/operations.css`
- `tests/kitchen-sound.test.cjs`
- `tests/operational-ux.browser.cjs`
- `tests/operative-review.browser.cjs`
- `tests/phase10-finance.browser.cjs`
## Ronda operativa final — 18 de octubre de 2026

Bases recuperadas: frontend `3dba41436f5592319e3173ba3bb9b6e8f7dd88b0`, backend `0005a20e2a15ed81c6848424147a5cf123455537`. La interrupción conservó cambios válidos; no se utilizó reset ni se descartó trabajo. La decisión errónea sobre conservar todo el descuento queda reemplazada por **reparto proporcional; la parte cancelada se anula**.

### Semántica y contratos coordinados

- Cuenta abierta sin consumos confirmados: verde y texto «Atención abierta». Confirmación: rojo y «Ocupada». Todas las mesas asociadas leen la misma cuenta. Cierre explícito libera; pago, salidas y cancelaciones no liberan. `hasConfirmedConsumption` es un dato de lectura del servidor, no una nueva forma de reservar mesas. Incluye confirmación de consumos DIRECT, aunque no generen ticket de producción.
- `changeableQuantity` y `hasDeliveredUnits` permiten mostrar acciones solo sobre unidades pendientes. La cancelación/sustitución normal nunca altera unidades entregadas. En una línea parcialmente entregada se separa el consumo pendiente; la comanda mantiene su cantidad, snapshot y reloj originales y acumula `cancelledQuantity`. Los eventos de entrega no se borran ni reescriben. Los componentes de menú/combos protegen la fracción del consumo cuyo componente ya salió.
- La sustitución conserva el envío original cuando corresponde y no transfiere descuentos al nuevo producto. No hay recuperación automática de stock. La recuperación manual usa cantidades originales de envío y recibos de stock conservados; una unidad entregada no se recupera, tampoco después de cancelar parcialmente y registrar devolución excepcional.
- `POST /attention-accounts/:id/lines/:lineId/return`: excepción explícita con `{expectedVersion,reason}` e Idempotency-Key. Anula el consumo activo completo de esa línea conservando salidas y pagos. **No entrega dinero**: el reembolso es la operación financiera existente, validada contra crédito/pago original. UI en Más opciones, no en la acción normal Cancelar.
- `POST /attention-accounts/:id/lines/:lineId/draft-configuration`: reutiliza `AddConsumptionDto`, cotización, permiso de atención, tenant, lock, versión e idempotencia. Cambia configuración/cantidad/observación/porción permitida/cortesía permitida sobre el mismo borrador; rechaza líneas confirmadas y descuentos superiores al nuevo consumo. No envía a cocina ni consume disponibilidad. No convierte cualquier producto en cortesía: se conserva la validación del catálogo.
- `POST /attention-accounts/:id/confirm` acepta opcionalmente `takeaway: [{lineId,quantity}]`. Solo IDs de borradores de esa cuenta, no repetidos, cantidades de 0 hasta la cantidad de la línea con hasta tres decimales. Asignación y confirmación son una única transacción idempotente. Se persiste `takeawayQuantity` en consumo y snapshot del ticket; en componentes se multiplica por su cantidad incluida. DIRECT conserva la marca en la cuenta sin generar ticket. La selección local se guarda únicamente al confirmar, no pretende estar enviada antes de respuesta.
- Nuevos contratos reutilizan `attention.changed`, `kitchen.changed` y eventos de disponibilidad existentes. Sin nuevo canal ni cambio en autenticación de sockets. `PRODUCTION/DIRECT` permanece autoritativo; no se vuelve a inferir ruteo de bebidas por categoría.

### Descuentos: decisión definitiva y redondeo

Se conserva la proporción del descuento de las unidades retenidas, anulando el resto con el segmento cancelado. Cálculo en centavos y cantidades en milésimas mediante BigInt; se redondea la parte cancelada al centavo más cercano (medio centavo hacia arriba), y la conservada es el complemento exacto. Con varios descuentos sobre la misma línea se redondea el total una sola vez y se distribuye entre asignaciones por mayores restos, con orden estable. Así no se pierde ni se duplica un centavo por redondear cada asignación independientemente.

La auditoría `attention.pending-split` conserva actor y fecha, motivo, ID de línea/segmento, cantidad original, importe original, descuento original y sus asignaciones, unidades conservadas/canceladas y descuentos conservado/anulado. Las asignaciones anuladas quedan vinculadas al segmento cancelado y no al producto nuevo. Auditorías y documentos emitidos previamente permanecen inmutables.

Ejemplos comprobados: 2×S/30 con descuento S/10 y una unidad cancelada => consumo S/30, descuento S/5, total S/25. 3×S/30 con descuento S/10 y dos canceladas => S/3.33 conservado y S/6.67 anulado. Los pagos originales permanecen; un pago de S/50 en el primer ejemplo genera S/25 a favor, reembolsable mediante el motor existente.

### UX por flujo

- Pedido actual ampliado (~38% desktop), catálogo y pedido con scroll independiente; móvil conserva Productos/Pedido. Cantidad/observación rápidas y personalización de borrador con versión capturada; no sobrescribir edición por sockets.
- Estados legibles: borrador, confirmado, salida parcial, entregado y cancelado. Entregar junto al producto continúa; correcciones y devolución excepcional son secundarias y requieren motivo. Un segmento cancelado no se presenta como entregado.
- «Todo para llevar» y selector de cantidades en diálogo compacto antes de confirmar; no crea otra atención. Se conserva el modo histórico de recogida independiente como opción secundaria, no como modalidad principal.
- Acceso principal Mesa/Delivery. Reparto propio/courier externo en opciones de reparto; modalidades internas, custodia de efectivo y reportes se conservan. Unión/agregar mesas, traslado y cambio de responsable tienen textos/acciones separados y reutilizan contratos transaccionales existentes.
- Cobro contextual conservado. Pago completo aplica saldo; parcial/mixto muestra medios independientes eliminables, Distribuido/Restante y bloquea exceso, recibido insuficiente y valores inválidos. El servidor vuelve a validar. Iconos MUI para efectivo, tarjeta y QR neutral; no se inventa logo oficial de Yape.
- QR original limitado a 300px, object-fit contain, sin recortar/modificar archivo. Si falta, no se invita a mostrarlo. Confirmación Yape siempre manual. Administración tiene selección estilizada, preview, reemplazo y validación preliminar; la validación segura del backend permanece.
- Nombre de persona configurado antes del username en cabecera/usuario y nombre completo en cobro/responsable. No se inventaron nombres reales ni se ejecutó seed para sustituir trabajadores de presentación.
- Cocina: menú/disponibilidad y reporte de tiempos son los accesos relevantes. API ya rechazaba cuentas, finanzas y reportes financieros para COCINERO; el reporte `slow` continúa permitido. Navegación ahora lo expresa sin sugerir acceso a Atención completa. Restricciones individuales siguen restringiendo, nunca ampliando rol.
- Reservas, disponibilidad, propinas, fiados, abonos, rendición, documentos y reportes conservan operaciones existentes. Se revisaron sus dependencias y regresión disponible; no se eliminaron capacidades avanzadas ni se afirma haber repetido manualmente todas sus combinaciones.

### Audio

Activar sonido desbloquea AudioContext mediante gesto y reproduce prueba audible breve. Las nuevas IDs de comanda generan «Pedido entrante» por SpeechSynthesis en español, preferentemente una voz masculina conocida si el SO la proporciona. La API no estandariza género; no se garantiza una voz masculina en todos los equipos. Sin voz española/API disponible se conserva tono de respaldo y aviso visual. Cambios/cancelaciones conservan tono diferenciado. Carga inicial y primera instantánea tras reconexión son silenciosas; revalidación no repite IDs.

Pruebas automatizadas verifican llamada, texto, voz elegida, deduplicación y mecanismo AudioContext. No certifican audición física, volumen del dispositivo, voces instaladas, Safari ni comportamiento de segundo plano en todos los móviles/TV.

### Migraciones y seguridad

19. `TakeawayQuantities1760358800000`: añade `consumption_lines.takeawayQuantity`, decimal con valor inicial 0.
20. `PendingCancellation1760358900000`: añade `kitchen_dispatch_items.cancelledQuantity`, decimal con valor inicial 0.

Son aditivas; no se editó ninguna de las 18 migraciones anteriores. Aplicación/repetición exclusivamente en `restaurante_app`. No seeds de Punto Mar, sin cambio manual de catálogo ni acceso a `tienda`. Los fixtures usan restaurantes aislados y limpian sus propias filas. Main, ramas históricas, credenciales y configuración productiva no se cambian.

### Limitaciones explícitas

- No hay fotografías nuevas ni asset oficial de Yape verificado; se conservan placeholders y símbolos MUI existentes.
- No se conocen los nombres reales que deben reemplazar los trabajadores demo; la UI muestra los configurados. Cambiarlos corresponde a Administración sin inventar identidad de personas.
- Preparación/empacado físicos, altavoces, POS, transferencia Yape, impresora, SMTP, infraestructura y backups externos no se validan por estas pruebas.
- La selección parcial para llevar expresa instrucciones de empaque por consumo. Las salidas siguen contando unidades según contrato existente, sin certificar físicamente cuál paquete se entregó.
- Se conservan advertencias heredadas de dependencias/bundle y la advertencia de versión React del plugin ESLint. No refactor masivo.
- Archivos eliminados: ninguno. No push, merge ni force-push.

### Validación final de esta ronda

- Backend: build, `tsc --noEmit` y lint completos aprobados; **105 pruebas unitarias / 13 suites** y **156 HTTP/MySQL / 8 suites** aprobadas. Las suites incluyen permisos de roles/restricciones, aislamiento, concurrencia, reintentos, finanzas, reportes, documentos y operaciones. No equivalen a una certificación manual de cada combinación posible.
- Migraciones: **20 aplicadas, 0 pendientes**; segunda ejecución sin cambios pendientes. No seed.
- Frontend: pnpm oficial, typecheck, build y ESLint focalizado de TS/TSX/CJS modificados aprobados; **15 pruebas** (6 idempotencia, 5 monetarias, 4 audio) aprobadas.
- `operative-review.browser.cjs`: backend real, mesas verde/rojo, cantidad 2 con observación, eliminar/reducir borrador, para llevar parcial visible en cocina, audio desbloqueado/tono/deduplicación/reconexión, salidas parciales/totales, turno contextual, efectivo 58/60/2, pago sin liberar mesa y cierre explícito; mixto tarjeta30 + efectivo28/recibido30, exceso bloqueado; sin QR no invita a mostrarlo; subida real por UI administrativa de imagen de prueba, persistencia y visualización por mozo, límite responsive y confirmación manual. La imagen de prueba es un fixture no bancario, no se presenta como QR comercial escaneable.
- `phase10-finance.browser.cjs`: respuesta perdida/reintento de pago y doble clic, parcial, vuelto, Yape manual/QR ausente-presente, propina, descuento, devolución conservando pago, deuda/abono y documentos.
- `operational-ux.browser.cjs`: **4 contextos, 0 recargas completas y 0 excepciones JS**; dos mozos/dos cocinas, producción/directo, adición, cancelación, salida parcial, disponibilidad y reconexión. Se actualizó la expectativa histórica «Ocupada al abrir» por «Atención abierta»; su repetición pasó.
- Responsive real: 390×844, 900×1100, 1440×900; cocina 1920×1080 y móvil. Capturas revisadas; sin overflow global en los recorridos probados. Las pruebas de voz usan mecanismo/control de eventos; la audición física y la disponibilidad de voz masculina requieren revisión local.
- Advertencias: chunks heredados mayores de 500 KiB y configuración de versión React del plugin ESLint. No se corrigió deuda masivamente. Sin nuevas dependencias.
- Revisión `git diff --check` y búsqueda de patrones de secretos en añadidos: sin hallazgos. No archivos .env/credenciales modificados.

### Inventario de archivos de esta ronda

- `ESTADO.md`
- `F10-OPERATIVE-REVIEW.md`
- `src/pages/Private/Finance/FinancePage.tsx`
- `src/pages/Private/Finance/displayMoney.ts`
- `src/pages/Private/Insights/ReportsPage.tsx`
- `src/pages/Private/Operations/AttentionWorkspace.tsx`
- `src/pages/Private/Operations/FulfillmentPanel.tsx`
- `src/pages/Private/Operations/KitchenPage.tsx`
- `src/pages/Private/Operations/Operations.page.tsx`
- `src/pages/Private/Operations/cycle2.css`
- `src/pages/Private/Operations/fulfillment.types.ts`
- `src/pages/Private/Operations/kitchenSound.ts`
- `src/pages/Private/Operations/operations.css`
- `src/pages/Private/Operations/types.ts`
- `src/pages/Private/Restaurant/components/SecuritySettings.component.tsx`
- `src/pages/Private/layouts/SidebarLayout/Header/components/Userbox.component.tsx`
- `src/pages/Private/layouts/SidebarLayout/data/MenuData.tsx`
- `tests/display-money.test.cjs`
- `tests/kitchen-sound.test.cjs`
- `tests/operational-ux.browser.cjs`
- `tests/operative-review.browser.cjs`

Eliminados: ninguno. Se conservaron contratos históricos, migraciones previas, assets y módulos sin evidencia de eliminación segura.
