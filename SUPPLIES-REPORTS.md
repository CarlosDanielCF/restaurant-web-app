# Compras, bebidas y centro de reportes

Ampliación descriptiva sobre las ramas de revisión existentes. No cambia la marca Point Restaurant ni incorpora datos de Punto Mar en componentes genéricos.

## Operación y permisos

- `/supplies` aparece en **Gestión → Compras y bebidas** para Dueño/Administrador. Reutiliza la restricción individual `configuration`; la API también autoriza cada operación. Mozo/Cocinero no reciben acceso a costos ni compras.
- **Bebidas** permite buscar configuraciones paginadas, ingresar compras, consultar Kardex y abrir conteo/ajuste/recuperación en acciones secundarias.
- **Configurar bebida** toma productos reales de la carta y exige confirmar que son bebidas embotelladas/envasadas de fábrica. No se infiere control desde una categoría ni desde el ruteo de producción.
- Cada SKU se configura exactamente: producto sin variante (`optionId=0`) o una presentación. La configuración base no se hereda automáticamente a todas las variantes. Los nombres comerciales pendientes conservan el fallback neutral existente.
- Activar control no inventa existencias ni costos históricos. El administrador registra el conteo inicial real o una compra. El stock inicial está protegido por el servidor cuando existen movimientos previos.
- El costo total de compra se previsualiza con enteros de centavos (`BigInt`); el servidor vuelve a calcularlo. La compra genera un egreso de bebidas una sola vez.
- **Compras del día** admite múltiples gastos de mercado u otros egresos. No ofrece una categoría manual de compra de bebidas para evitar duplicar el ingreso automático. Fecha operativa y observación quedan en detalle opcional.
- Conteo/ajuste requieren motivo. Si el conteo coincide, la pantalla informa que no hay diferencia y evita un ajuste vacío. Recuperación selecciona un consumo cancelado permitido por el servidor; no solicita UUID al trabajador.
- Las peticiones usan la identidad de operación existente de `restauranteApi`: un reintento con los mismos datos conserva la clave; la respuesta confirmada la libera. Un bloqueo síncrono evita doble pulsación. La reconexión revalida; no reproduce mutaciones.
- `catalog.changed`, `finance.changed` y `attention.changed` invalidan la vista usando la infraestructura de Socket.IO existente. Los formularios abiertos se conservan durante la actualización.

## Resumen y reportes

- `/operational-overview` consulta un resumen acotado y calculado en servidor. Presenta ventas, cobranzas netas, métodos, egresos y resultado operativo por moneda, además de incidencias y actividad; no vuelve a cargar todas las cuentas/turnos para calcular totales en React.
- **Resultado operativo sobre cobranzas** = cobranzas netas del período − compras mercado − compras bebidas − otros egresos. No se presenta como ganancia neta. Las ventas aparecen separadas.
- `/operational-reports` obtiene del backend el catálogo autorizado de reportes y filtros aplicables. Agrupa reportes por área y conserva los existentes. Las restricciones individuales continúan restándose del rol.
- Atajos **Hoy, Ayer, Esta semana, Este mes, Personalizado** calculan días en la zona horaria del restaurante; el servidor valida el rango y sus límites.
- Filtros de usuario/cobrador, responsable, método, modalidad, producto/categoría/mesa/estado aparecen únicamente donde el contrato los admite. El importe se muestra con precisión decimal, sin sumar cobros como ventas.
- **Ver historial** abre la cronología paginada de cuenta construida desde registros del servidor. Antes/después, motivo y fuente pueden expandirse sin saturar la lista.
- **Exportar CSV completo** llama al endpoint de exportación con los filtros aplicados, no solo con la página visible. Si el servidor rechaza un volumen excesivo, la UI pide acotar; no descarga silenciosamente una muestra incompleta.
- Compras/Kardex enlazan al historial de la cuenta cuando existe referencia; no muestran IDs como etiqueta operativa.

## Datos y límites

No se cargaron stock, costos, nombres de trabajadores, fotos ni presentaciones ficticias. Continúan pendientes los datos reales que debe proporcionar el cliente. No se ejecutan seeds ni migraciones desde frontend. La validación del nuevo esquema se realiza en un servicio MySQL desechable separado; no se modifica la base del usuario.

La captura de cantidades comerciales es entera. La recuperación permite hasta tres decimales del consumo cancelado cuando se trata de un combo; el servidor convierte la referencia de ese consumo y exige unidades comerciales enteras de la bebida seleccionada. La UI envía `stockId` explícito para que recuperar un componente no recupere otras bebidas del mismo combo. No hay ingredientes, recetas, conversión de almacenes, proveedores complejos ni costo de receta. Las compras son egresos simples, no contabilidad completa. El conteo físico necesita verificación humana.

## Verificación de este ciclo

Resultados de este ciclo:

- Typecheck y build aprobados. Persisten las advertencias históricas de chunks grandes; la nueva pantalla se carga mediante `lazy`.
- Lint focalizado aprobado, con el aviso heredado de versión React de ESLint.
- 29 pruebas unitarias aprobadas: se mantienen idempotencia/pagos/sonido/permisos y se agregan previsualización de compras y utilidades de reportes.
- Browser con backend real aislado: configuración explícita, saldo inicial, ingreso 24 × 2.50 = 60.00, pérdida simulada de respuesta y reintento con la misma clave (stock final 34, no 58), conteo a 32 con motivo, dos gastos de mercado en el mismo día, Kardex, historial de cuenta y descarga CSV completa.
- OWNER accede; navegación directa de WAITER/COOK a compras rechazada. Las pruebas HTTP de backend cubren adicionalmente autorización y aislamiento.
- Capturas y comprobación de ancho global en 390×844, 900×1100 y 1440×900. Cocina 1920×1080 conservó un máximo de tres tarjetas (la fixture contenía una pendiente).
- Cero excepciones JS y cero API404 en el recorrido completado. La pérdida de respuesta se inyectó deliberadamente y se recuperó sin duplicar ingreso ni egreso.
- Las dos primeras ejecuciones del runner descubrieron selectores de encabezados inexactos: se añadieron encabezados semánticos explícitos a las pantallas nuevas y se ajustó el selector al título ya existente de Cocina; la ejecución final pasó.
- No equivale a una nueva validación física de audio/impresora ni a la repetición de todas las combinaciones financieras históricas. Las capturas contienen únicamente datos de fixture aislada, no inventados dentro de componentes.
 El runner `tests/supplies.browser.cjs` exige puertos de prueba 5019/3039 y un archivo de fixture temporal; no importa conexiones de BD, seeds ni migraciones. `tests/supplies-preview.test.cjs` prueba costo exacto y rechazo de cantidades/formats inválidos; `tests/reports-view.test.cjs` prueba rangos de fechas y representación exacta de importes. Se conservan los tests de idempotencia y pagos existentes.

## Inventario de archivos de esta ampliación

Modificados:

- `ESTADO.md`
- `README.md`
- `src/hooks/useWorkerAccess.ts`
- `src/pages/Private/Insights/OverviewPage.tsx`
- `src/pages/Private/Insights/ReportsPage.tsx`
- `src/pages/Private/Insights/labels.ts`
- `src/pages/Private/layouts/SidebarLayout/data/MenuData.tsx`
- `src/pages/Private/router/private.router.tsx`

Creados:

- `SUPPLIES-REPORTS.md`
- `src/pages/Private/Insights/AccountHistoryDialog.tsx`
- `src/pages/Private/Insights/ReportPeriodControls.tsx`
- `src/pages/Private/Insights/insights.css`
- `src/pages/Private/Insights/reportColumns.ts`
- `src/pages/Private/Insights/reportView.ts`
- `src/pages/Private/Supplies/Supplies.css`
- `src/pages/Private/Supplies/SuppliesPage.tsx`
- `src/pages/Private/Supplies/previews.ts`
- `src/pages/Private/Supplies/types.ts`
- `tests/reports-view.test.cjs`
- `tests/supplies-preview.test.cjs`
- `tests/supplies.browser.cjs`

Eliminados: ninguno.
