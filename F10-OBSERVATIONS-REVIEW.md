# Point Restaurant — observaciones operativas, 19/10/2026

Base frontend `51f0a1f8b9b179a1f5baa9192604a486645c9464`, rama `codex/phase-10`. Backend coordinado desde `c965f15248647b9ce4659c5b22740c172e67ac28`; requiere migración 22 antes de desplegar ambos candidatos. No se publica ni se migra la base del usuario durante esta revisión.

| Flujo | Causa / corrección | Conservado |
|---|---|---|
| Confirmar pedido | Respuestas antiguas podían sustituir una versión reciente; 409 no reconciliaba y feedback quedaba lejos del botón. Ahora bloqueo inmediato, Enviando…, resultado junto al botón, versión monotónica y revalidación explícita tras 409. | Misma clave para reintento, servidor autoritativo, sin replay automático de conflictos. |
| DIRECT | Etiqueta Confirmar pedido; solo PRODUCTION avisa por ausencia de pantallas de Cocina. | DIRECT se cobra, consume stock y se audita; no se crea ticket vacío. |
| Captura producto | La observación/cantidad temporal permanecía tras éxito. Ahora se limpia solo cuando el servidor acepta. | La línea agregada conserva la observación; un error conserva captura para reintentar. |
| Responsable | Dueño/admin parten con su propia identidad y pueden asignar otro responsable; mozo se asigna automáticamente. | Roles, restricciones, transferencia y atribución de cobros. |
| Cortesía | Más opciones de la línea ofrece cantidad/motivo; evita llenar catálogo de controles. | Precio original, stock físico, producción, pagos y auditoría; sin descuento 100%. |
| Cocina | Skeleton, límite de espera, error/reintento; recuperación autoritativa desde HTTP y Socket.IO. | Hasta tres comandas antiguas en TV, relojes independientes, salida por mozo, alertas 12/15, deduplicación de audio. |
| Comanda N | Número global diario suministrado por servidor con fecha/zona; fallback explícito para históricos anteriores a migración22. | IDs y secuencias históricas no se reescriben. |
| Compras/bebidas | Estado local de carga, error/reintento; configuración muestra SKU/ruteo/control existente; stock inicial deshabilitado si hubo movimientos, aunque saldo sea cero. | Apertura no genera gasto, compras cantidad×costo una vez, conteo y recuperación auditados. |
| Fechas/unidades | Fecha operativa mostrada como calendario dd/mm/yyyy sin conversión UTC; cantidades eliminan ceros de almacenamiento sin redondear. | Precisión monetaria y datos autoritativos. |

## Carga, sonido y limpieza

Ver [PERFORMANCE-OBSERVATIONS.md](PERFORMANCE-OBSERVATIONS.md): diagnóstico reproducido del bloqueo global por cuatro APIs legacy, separación del bootstrap según rutas consumidoras, conservación del layout durante carga, medidas antes/después e inventario de eliminación.

El único asset eliminado es `public/static/sounds/bell-ding.wav`; su consumidor usa tono generado localmente tras interacción. No se incorporan audios externos ni licencias nuevas. Cocina conserva su timbre/voz y aviso visual; el sonido físico depende del navegador, voz instalada y altavoces.

No se eliminan funciones de pedidos históricos ni administración. Se conservan descuentos, correcciones, devolución, pagos mixtos, fiados, propinas, traslado, unión, reportes y documentos.

## Verificación y límites

Pruebas nuevas: `tests/observations.browser.cjs`, `tests/route-loading.browser.cjs`, `tests/operation-feedback.test.cjs`, `tests/runtime-subscriptions.test.cjs`; ampliadas Supplies y formatos de reportes. Se ejecutan contra backend/MySQL desechables autorizados, nunca contra datos de Punto Mar.

Los incidentes concretos de Windows (requests409, movimiento15→14 y error de caché del WAV) no pueden atribuirse individualmente sin sus identificadores/trazas. La corrección y reproducción cubren causas verificables; no se afirma haber inspeccionado ese MySQL.

Decisión confirmada: al convertir unidades con descuento a cortesía, se conserva únicamente el descuento proporcional de las unidades cobrables; la parte de cortesía se anula sin transferirla. El backend registra el reparto, y los nuevos documentos distinguen descuentos activos/inactivos sin reconstruir snapshots anteriores. No se modifica la regla proporcional de cancelaciones.

Las fotografías autorizadas, nombres comerciales de presentaciones y datos reales de trabajadores siguen dependiendo del cliente; no se inventaron ni ejecutaron seeds.


## Resultados ejecutados

| Validación | Resultado |
|---|---|
| `pnpm typecheck` / `pnpm build` | Aprobados |
| ESLint de todos los TS/TSX/CJS modificados o nuevos | Aprobado; aviso heredado de versión React no configurada |
| `node --test tests/*.test.cjs` | 36/36 aprobadas, incluidas idempotencia, audio, dinero y formatos |
| `tests/observations.browser.cjs` | 9 grupos aprobados con backend real aislado |
| `tests/supplies.browser.cjs` | 7 grupos aprobados con backend real aislado |
| `tests/route-loading.browser.cjs` | 6 grupos aprobados, login real y fallo de red recuperable incluidos |
| `tests/startup.browser.cjs` | Aprobado: login83 módulos, bootstrap demorado recuperable y puerto estricto |

Los nueve grupos operativos comprobaron: mozo implícito/dos contextos; captura3 unidades+observación y limpieza posterior; DIRECT sin Cocina/stock único; confirmación con respuesta perdida y misma clave en reintento; dueño atendiendo; cortesía parcial y mezcla de ruteos; recuperación de Cocina sin F5; descuento proporcional60−10→30−5=25 con documento nuevo y snapshot anterior intacto; efectivo58/60/vuelto2 sin liberar atención.

Responsive comprobado en390×844,900×1100,1440×900 y Cocina1920×1080, máximo3 tickets visibles, sin overflow global. Las capturas están en `/tmp/point-observations-browser`. En los recorridos operativos: **0 excepcionesJS y0 HTTP404/409/500 inesperados**. Los fallos de conexión inducidos deliberadamente no se cuentan como incidencias inesperadas. Las pruebas negativas de API sí esperan conflictos/permisos rechazados.

Build conserva advertencias heredadas de directivas `use client` de dependencias y chunks grandes (PDF/pedidos históricos): no se removió funcionalidad para eliminarlas. No se incorporaron dependencias. El test de sonido comprueba mecanismo/desbloqueo/deduplicación; no certifica audición física.

Migración coordinada requerida:22, exclusivamente probada en MySQL desechable1→22 y segunda ejecución0 pendientes. Las1–21 permanecen idénticas. Backend196 unitarias,37 gruposHTTP/MySQL,156 pruebas históricas y repetición final dirigida55 (subconjunto, no suma de pruebas únicas). No se ejecutó migración ni seed en bases del usuario.

Logs de esta revisión: `/tmp/point-final-fe-types.log`, `/tmp/point-final-fe-build.log`, `/tmp/point-final-fe-lint.log`, `/tmp/point-final-fe-unit.log`, `/tmp/point-observations-browser-final.log`, `/tmp/point-supplies-observations-browser.log`. Los servicios y credenciales temporales de prueba fueron retirados al finalizar; las evidencias sin secretos se conservan en `/tmp`.

## Archivos de esta ronda

42 archivos afectados (incluidos nuevos y eliminados):

- `ESTADO.md`
- `F10-OBSERVATIONS-REVIEW.md`
- `PERFORMANCE-OBSERVATIONS.md`
- `README.md`
- `public/static/sounds/bell-ding.wav` — eliminado; evidencia en inventario de limpieza
- `src/components/ui/RouteLoading.tsx`
- `src/components/ui/SessionCheckStatus.tsx`
- `src/hooks/useMenu.ts`
- `src/hooks/useNotificationSound.ts`
- `src/hooks/useOnWebSocketsEvent.ts`
- `src/pages/Private/Insights/DocumentView.tsx`
- `src/pages/Private/Insights/ReportsPage.tsx`
- `src/pages/Private/Insights/labels.ts`
- `src/pages/Private/Insights/reportColumns.ts`
- `src/pages/Private/Insights/reportView.ts`
- `src/pages/Private/Operations/AttentionWorkspace.tsx`
- `src/pages/Private/Operations/FulfillmentPanel.tsx`
- `src/pages/Private/Operations/KitchenPage.tsx`
- `src/pages/Private/Operations/Operations.page.tsx`
- `src/pages/Private/Operations/ServiceCatalog.tsx`
- `src/pages/Private/Operations/fulfillment.types.ts`
- `src/pages/Private/Operations/operationFeedback.ts`
- `src/pages/Private/Operations/types.ts`
- `src/pages/Private/Orders/context/Order.context.tsx`
- `src/pages/Private/Orders/hooks/useOrders.ts`
- `src/pages/Private/Private.tsx`
- `src/pages/Private/Supplies/Supplies.css`
- `src/pages/Private/Supplies/SuppliesPage.tsx`
- `src/pages/Private/Supplies/types.ts`
- `src/pages/Private/components/LegacyWorkspaceData.tsx`
- `src/pages/Private/layouts/SidebarLayout/SidebarLayout.component.tsx`
- `src/pages/Public/Auth/hooks/useAuth.ts`
- `src/pages/Public/Auth/services/auth.service.ts`
- `src/routers/AppRouter.tsx`
- `tests/observations.browser.cjs`
- `tests/operation-feedback.test.cjs`
- `tests/phase8.browser.cjs`
- `tests/reports-view.test.cjs`
- `tests/route-loading.browser.cjs`
- `tests/runtime-subscriptions.test.cjs`
- `tests/startup.browser.cjs`
- `tests/supplies.browser.cjs`
