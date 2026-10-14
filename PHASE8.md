# Fase 8 — handoff funcional

Rama `codex/phase-8` desde `codex/phase-6-7` (`71e11459a2d5a698a9fe63b07da3c8644a0aa90c`). No integra main ni Gemini; Barrera A continúa abierta. Backend pareado requiere migración `OffsiteOperations1760358300000` (14 total), solo restaurante_app.

## Pantallas

- `/attention`: modalidades Para llevar, Delivery propio, Courier externo; contacto, dirección, referencia, observaciones de atención, responsable y cliente opcional. No asignar mesas a estas modalidades.
- Cuenta seleccionada: panel de logística, registro/asignación de repartidor, estado y corrección con motivo. Reutiliza consumos/comandas/salidas F4–5. READY exige confirmación y salida completa de comida; bebidas no generan cocina.
- Selector Tipo de consumo: venta, cortesía configurada, personal con trabajador beneficiario. STAFF/COURTESY precio aplicado cero, snapshot original y disponibilidad del backend.
- `/kitchen`: modalidades MESA/PARA LLEVAR/DELIVERY PROPIO/COURIER EXTERNO; etiquetas de consumo de personal/cortesía. Sin nuevas acciones para cocina.
- `/finance`: pagos F6–7; checkbox para efectivo recibido físicamente por courier asignado. Los demás métodos y pago directo permanecen disponibles. Ese pago NO suma efectivo al mozo hasta recepción. En Atención se selecciona custodia, importe recibido, motivo y confirma responsable actual con turno OPEN. Resumen de turno separa efectivo registrado en courier/recibido de courier.

## Contratos añadidos

API `/api`, JWT + `x-restaurant-id`, claves de idempotencia y `expectedVersion` existentes. Documentación completa backend `docs/PHASE-8.md`.

- POST `/attention-accounts`: `modality` ampliado; `offsite:{customerName,phone,address,reference,courierId?}`; contacto obligatorio para deliveries, opcional para llevar; `notes` existente.
- POST líneas/sustituciones: `kind?:SALE|STAFF|COURTESY`, `beneficiaryUserId?` para personal. No calcular precio ni inventar cortesías en frontend.
- GET/POST `/offsite/couriers`: `{name,phone,kind:OWN_DELIVERY|EXTERNAL_COURIER}`.
- GET `/offsite/workers`: selector de trabajadores activos del tenant.
- GET `/offsite/accounts/:id`: `account,delivery,cash,receipts,shippingCharge`.
- POST `/offsite/accounts/:id/details`: datos de contacto + `expectedVersion,reason`.
- POST `/offsite/accounts/:id/state`: `status,expectedVersion,reason`.
- POST `/offsite/accounts/:id/correction`: `status:PREPARING,expectedVersion,reason` para error registrado; no es nuevo viaje.
- POST pagos F6: `courierId?` únicamente para efectivo en courier asignado, despacho iniciado y actor responsable. Para mixto con courier, registrar la parte CASH en esa operación y otros métodos por flujo normal.
- POST `/offsite/accounts/:id/cash-receipts`: `custodyId,shiftId,amount,reason,expectedVersion`; recepción parcial/total, no segunda venta/cobro.
- GET turnos añade `courierCashRecorded,courierCashReceived` (históricos). Pendiente actual en `cash[].pendingAmount` de atención.
- Eventos existentes `attention.changed`, `finance.changed`; sin nuevos nombres. Poll/reconsulta autoritativa. Snapshot cocina añade `consumptionKind,beneficiaryUserId`.

## Decisión PO y límites

Adicional que requiere nuevo viaje = nueva atención. Servidor rechaza altas/sustituciones fuera de PREPARING/READY. Pago, entrega, atención y cocina independientes. Corrección logística no cancela consumos/revierte cobros: usar contratos F4/F6. Free delivery, sin APIs de plataformas, cobro automático ni F9.

No hay solicitud bloqueante a Friend+Gemini. Puede revisar después presentación/etiquetas sin cambiar contratos. No se tocó su rama ni se rediseñó el sistema.

## Pruebas

`pnpm build` incluye typecheck. Lint focalizado de Operations/{AttentionWorkspace,OffsitePanel,KitchenPage,types,fulfillment.types} y Finance/FinancePage. Smoke real `tests/phase8.browser.cjs` escritorio 1280×960/móvil 390×844; regresión `tests/phase67.browser.cjs`.

Usar Playwright externo mediante PLAYWRIGHT_MODULE si no está instalado en proyecto, Chromium con CHROMIUM_PATH. Backend en5000/frontend3030 por defecto. Fixtures únicas, borrado solo de sus registros; **no correr en paralelo con suites HTTP** que verifican filas históricas globales.

Diagnósticos heredados en navegador: auth-renew401 antes de login, cash-register/actives404 del shell antiguo, fuentes Google/imagen Unsplash inaccesibles en Cloud. El smoke distingue estos recursos de fallos nuevos y falla ante errores de página o requests inesperados. No se arregla masivamente deuda visual/lint anterior.
