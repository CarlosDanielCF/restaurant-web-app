# Handoff funcional Fases 6–7

Rama `codex/phase-6-7`, desde main frontend `da471058f43a564ef16b3c510a791c9cd0a95946`. No se integró ni consultó la rama de Gemini. Barrera A sigue pendiente; esta implementación requiere revisión del Arquitecto antes de integrar.

## Superficie modificada

- Nueva página aislada `src/pages/Private/Finance/FinancePage.tsx` en `/finance`.
- Una ruta con roles DUENO/ADMINISTRADOR/MOZO y un acceso lateral en `MenuData.tsx`.
- Sin rediseño de componentes, carta, atención o cocina.

Permite pagos parciales/mixtos CASH/YAPE/CARD, selección de productos, división orientativa exacta del saldo por personas, descuentos por monto de producto/cuenta, fiado (identifica cliente si faltaba), abonos, devoluciones manuales, propinas y entrega posterior, apertura de turno, movimientos de fondos, envío de rendición y confirmación administrativa.

Dinero siempre strings. Usa QR original mediante `useRestaurantImage`; muestra importe separado y ausencia de QR. La confirmación visual es obligatoria para registrar Yape. No se ejecutan transferencias/reversos externos. No se solicita información sensible de tarjeta.

Cuenta: muestra bruto, descuentos, consumo neto, saldo, deuda, pagos/vuelto/reembolsos y propinas. `lineBalances` del servidor muestra pendiente por producto después de créditos de cuenta. El cobro no cierra atención ni libera mesas. Para fiado, se registra deuda y luego se cierra con deuda desde Atención.

Turnos: cada cobrador abre el propio. Administración registra fondos/entregas/devolución de fondo, revisa y confirma. Diferencia requiere motivo. Corrección de turno CLOSED crea movimiento histórico; conserva snapshot de rendición. Propina digital entregada por el restaurante no se descuenta del efectivo custodiado por el mozo.

## Integración

Depende de migración/backend Fases 6–7. Contratos canónicos: `restaurant-backend/docs/PHASES-6-7.md`. Prefijo `/api/finance`, JWT, `x-restaurant-id`, `Idempotency-Key`; `expectedVersion` de cuenta/turno en cada mutación salvo apertura de turno.

`GET accounts/:id`, `GET accounts/:id/split?people=N`, POST de `payments`, `installments`, `discounts`, `refunds`, `debt`, `tips`, `tip-payouts`. GET/POST `shifts`; POST `shifts/:id/cash|submit|confirm`.

Para responsable en cuenta abierta usa `payments`, que también identifica cuotas dentro del cobro. Otros trabajadores pueden cobrar deuda por `installments`. Administración puede cobrar ordinariamente con `administrativeReason`; ese motivo activa el cobro administrativo en el formulario. Atención cerrada admite abonos de deuda, nunca cobros ordinarios nuevos.

La versión inicial del formulario se conserva mientras llegan actualizaciones; no se cambia silenciosamente para saltarse conflictos. Idempotencia por intención persistida en sessionStorage por usuario/restaurante. No hay reenvío automático offline. `finance.changed` y `attention.changed` invalidan consultas; reconexión consulta servidor; polling de respaldo 15s. Sin conexión se advierte falta de sincronización, y un error de consulta impide operar con datos no verificados.

## Decisiones PO

1. Descuento atado al consumo original; cancelación/sustitución no lo transfiere.
2. Cobro administrativo excepcional con motivo.
3. Propina para quien cobra, incluido dueño/administrador.

## Verificación y límites

Build incluye TypeScript; lint focalizado sobre la nueva pantalla. El lint global conserva deuda histórica (1.239 errores); no se corrige masivamente. No hay runner unitario propio frontend. Smoke con Chromium y MySQL: login de mozo, apertura de turno, efectivo/vuelto, Yape manual/ausencia de QR, saldo y mesa conservada, envío de rendición, móvil y persistencia tras recarga. Pruebas financieras y de seguridad detalladas están en backend.

No se pide ningún cambio bloqueante a Friend+Gemini. Al retomar diseño, mantener contratos, separación de dinero, aviso de conflicto, claves de reintento y confirmación manual. Los únicos puntos compartidos de integración visual son la ruta y el acceso lateral; evitar sobrescribirlos accidentalmente. Esta pantalla es funcional mínima, no una aprobación del diseño final.

### Repetir smoke

Con backend/frontend iniciados y MySQL disponible, ejecutar `node tests/phase67.browser.cjs`. Requiere Playwright accesible (`PLAYWRIGHT_MODULE` permite su ruta instalada) y Chromium (`CHROMIUM_PATH`). `RESTAURANT_BACKEND_PATH` por defecto es el repositorio hermano; `BACKEND_URL`/`FRONTEND_URL` permiten puertos alternativos locales. El script usa fixtures sintéticas aisladas en restaurante_app y las limpia al finalizar; no usa credenciales reales. Usa ts-node del backend, sin instalar nuevas dependencias de producto.
