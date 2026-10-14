# Fases 4–5: integración funcional y coordinación

Fuente de verdad: requisitos definitivos. Esta entrega modifica únicamente el flujo funcional en `main`. No integra ramas visuales ni auditorías. Conservar los contratos siguientes al trabajar sobre el diseño.

## Superficie frontend

- `/attention`: confirma consumos nuevos, modifica instrucciones, sustituye/cancela líneas con motivo, registra salidas parciales/correcciones y recupera manualmente porciones canceladas no preparadas. La sustitución usa el formulario de consumo existente, seleccionando explícitamente la línea a sustituir; no equivale a agregar adicionales.
- `/kitchen`: cola autoritativa de comida. `/orders/actives` redirige a ella. Cocina no registra inicio/listo/entrega; reconoce lectura de avisos y accede a menú/disponibilidad. Se conserva el estilo existente y navegación responsive.
- Componentes nuevos aislados: `Operations/KitchenPage.tsx`, `FulfillmentPanel.tsx`, `fulfillment.types.ts`. Integraciones puntuales en AttentionWorkspace, Operations.page, rutas y acceso de cocina. No modificar contratos desde una rama visual sin coordinar.

## Contratos que debe preservar la interfaz

Documentación exhaustiva en backend `docs/PHASES-4-5.md`.

- `POST /attention-accounts/:id/confirm`, `{expectedVersion}` → `{account,dispatchId,kitchenScreens,warning}`. Puede confirmar bebidas sin dispatchId. Solo mostrar enviado tras respuesta del servidor.
- `PATCH /attention-accounts/:id/lines/:lineId/notes`; POST `replace`, `cancel`, `restore`: motivo y versión; restore exige quantity y notPrepared=true. Replace usa AddConsumption completo + reason y cancela integralmente la línea anterior sin borrar historial.
- `GET /attention-accounts/:id/dispatches`, POST `dispatch-items/:itemId/exits` y `/corrections`: quantity/version; corrección añade eventId y reason. No cerrar atención ni registrar pago como efecto de una salida.
- `GET /kitchen/board` devuelve serverNow,totalPending,dispatches,notices,presence; `GET /kitchen/presence` devuelve screens/checkedAt. Cola ordenada por confirmación original, navegación solo local.
- `POST /kitchen/notices/:id/acknowledge`: lectura persistida compartida entre pantallas, no estado de preparación. Aviso permanece hasta lectura explícita; historial queda guardado.
- Idempotency-Key obligatorio en comandos. Operations conserva claves de intentos pendientes en sessionStorage por usuario/restaurante, excluyendo expectedVersion de la identidad del intento. Nunca repetir escrituras automáticamente al reconectar; el usuario reintenta la misma operación.
- Eventos `kitchen.changed`, `attention.changed`, `catalog.changed` invalidan consultas. `kitchen.presence` informa screens. Cocina emite `kitchen.watch` true al montar/reconectar/cada15s y false al salir; sesión y rol se revalidan en servidor. Presencia caduca a45s.
- Consulta cocina cada5s como recuperación de eventos perdidos; aviso de desconexión/error/datos con más15s sin refrescar. serverNow compensa reloj local. Alerta desde12min; atraso estrictamente después15min. Confirmaciones adicionales no reinician otros relojes.
- TV/escritorio ancho: tres inicialmente, flechas y retorno a más antiguas. Móvil/tablet: tres inicialmente, más por scroll. Sonido requiere botón de activación por restricciones del navegador; alerta visual siempre permanece.

## Validación y despliegue

Backend primero con migración `KitchenOperations1760357900000` en `restaurante_app`, luego frontend compatible. Sin paquetes ni variables nuevas. Build TypeScript/Vite y lint Operations aprobados. Chromium con sesiones independientes mozo/cocinero: TV, adicional, sincronización, salidas/corrección, avisos, sustitución/cancelación/recuperación manual, móvil y desconexión/reconexión, sin errores JavaScript. Pruebas unitarias/HTTP/MySQL/concurrencia se conservan en backend. Deuda global de lint y advertencias de bundle heredadas fuera de alcance.

No se implementan módulos financieros, delivery completo ni reportes. Presencia/eventos actuales de una instancia; no anunciar despliegue distribuido sin adapter compartido. Preparación física no verificable: restitución manual bajo declaración y motivo, nunca automática.
