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
