# Carga operativa y limpieza — revisión manual

Base frontend: `51f0a1f8b9b179a1f5baa9192604a486645c9464`.

## Causas y cambios

- `Private.tsx` bloqueaba **todas** las rutas autenticadas esperando menú, áreas de producción y pedidos históricos; también consultaba mesas. Cocina y Compras no consumen esos stores, pero no podían mostrar ni su estructura hasta que terminara el bootstrap. Las cuatro consultas se trasladaron a `LegacyWorkspaceData`, cargado únicamente en rutas que conservan consumidores de esos stores: pedidos históricos, carta administrativa, mesas administrativas, restaurante y perfil. No se eliminaron los contratos ni esas pantallas.
- El `Suspense` global reemplazaba navegación y contenido durante la descarga de un chunk. Hay ahora un límite local en el contenido de la sección, con skeleton, descripción y advertencia tras 12 segundos. El header/sidebar permanecen disponibles. Los fallos de consultas históricas ofrecen reintento sin escribir ni recargar toda la aplicación.
- `useActiveOrders` disparaba una revalidación al montar además de la petición de React Query. El efecto era redundante: las fechas del hook no eran utilizadas por el servicio, que usa su rango histórico. Se conserva la petición inicial, cache e invalidaciones Socket.IO.
- `useOnWebSocketsEvent` ejecutaba `off(event)` al desmontar y podía quitar suscriptores ajenos. Ahora conserva callback actual y retira sólo su propio handler.
- La verificación inicial de sesión también podía quedar pendiente: no tenía timeout y, después de un fallo de red, el temporizador omitía reintentar si el JWT todavía no estaba por vencer. El GET de renovación tiene ahora timeout de 15 segundos y un error recuperable con reintento explícito. No se elimina el token por fallos de red, no se relajan permisos y no se hace reload; el servidor sigue verificando la sesión.
- La descarga de `bell-ding.wav` provenía del hook histórico global y del control de sonido lateral, **no** del aviso operativo actual de Cocina. El archivo sí existía; el error de caché específico de Windows no fue reproducido en Cloud. Se eliminó la dependencia de esa descarga y se sustituyó por tonos breves sintetizados con Web Audio tras interacción del usuario; no requiere red/cache, licencia externa ni dependencias. El aviso actual de Cocina conserva su control explícito, deduplicación, timbre y voz. No se afirma audición física de un altavoz por una prueba automatizada.

## Inventario de limpieza

| Elemento | Acción y evidencia |
|---|---|
| `public/static/sounds/bell-ding.wav` (218,824 bytes) | Eliminado después de sustituir el único uso de runtime, `useNotificationSound`. Búsqueda de ruta/nombre en código, público y tests: ningún consumidor restante; sólo la aserción negativa del test de regresión. Se quitó la excepción histórica de F8 que ignoraba errores de este asset. |
| Segundo estado/capturadores de `OrderProvider` | Eliminados. `details/table/client/people/typeOrder`, sus setters y helpers no se retornaban en `OrderContext.Provider`, no eran consumidos por el reducer vigente ni tenían referencias fuera del propio bloque. Se conserva el reducer, su estado y la API pública del contexto. |
| Bootstrap/listeners históricos globales | Reubicados, no eliminados. Sus consumidores administrativos e históricos siguen cargándolos. |
| Barra de pedidos históricos/PDF, rutas antiguas con consumidores, dependencias y migraciones | Conservadas: hay imports/rutas reales. Su tamaño por sí solo no demuestra código muerto. No se borró documentación ni migración histórica. |

## Medición y validación

Las mediciones se realizan con Chromium headless, viewport 1440×900, caché de navegador nueva por recorrido, mismo servidor Vite calentado y tres rondas por ruta. Backend y datos pertenecen exclusivamente al fixture MySQL desechable, HTTP `127.0.0.1:5019`. La base exacta se extrae con `git archive` a `/tmp`; no se cambia ninguna rama para compararla. Se mide hasta encabezado operativo visible y se cuentan solicitudes durante 700 ms adicionales. Esto mide desarrollo en Cloud, no reproduce tiempos de Windows ni constituye una promesa de latencia productiva.

`tests/route-loading.browser.cjs` verifica además: una consulta histórica retenida no bloquea Compras/Cocina; stores históricos conservados en Carta; ninguna descarga del WAV; navegación visible mientras se demora el chunk de Compras; recuperación real de sesión tras simular fallo de red, sin logout ni recarga. `PERFORMANCE_BASELINE=1` reproduce el bloqueo anterior sobre la copia archivada.

`tests/runtime-subscriptions.test.cjs`: dos pruebas ejecutadas y aprobadas para callback actualizado/limpieza de listener y tono local sin solicitud de asset, desbloqueado por interacción.

Medición pareada final (tres rondas por ruta; mediana, milisegundos):

| Ruta | Antes | Después | Módulos fuente antes → después | Consultas HTTP API antes → después |
|---|---:|---:|---:|---:|
| Login | 509 | 734 | 83 → 83 | 0 → 0 |
| Atención | 1300 | 1250 | 194 → 166 | 16 → 12 |
| Cocina | 1312 | 1225 | 183 → 155 | 9 → 3 |
| Compras y bebidas | 1302 | 1312 | 184 → 156 | 7 → 3 |
| Resumen operativo | 1332 | 1225 | 182 → 153 | 12 → 8 |
| Reportes | 1443 | 1305 | 185 → 156 | 13 → 9 |

Los tiempos muestran variación del entorno Cloud compartido: Login no demostró mejora y Compras mantuvo prácticamente el mismo tiempo, aunque eliminó cuatro lecturas ajenas. La mejora verificable es la independencia de esas consultas y la reducción de módulos/requests; no se afirma que todos los recorridos sean más rápidos. El escenario Windows de un minuto no se reprodujo. React StrictMode conserva dos verificaciones iniciales de sesión en desarrollo; no se cambió la política de sesión por una microoptimización.

La prueba causal retuvo `/orders/actives`: en la base el header y Compras no llegaban a montarse; después Compras carga sin solicitar ese endpoint. La descarga de un chunk retenido deja visible header/navegación. Se registraron **0 excepciones JS y 0 HTTP 4xx/5xx** en los 36 recorridos de medición; el fallo de red inducido en la prueba de recuperación es deliberado y se informa por separado.

Resultados ejecutados:
- Typecheck y lint focalizado: aprobados. Vite build antes/después del aislamiento de bootstrap: aprobados; se conserva advertencia heredada de chunks grandes/PDF histórico. El bundle inicial no bajó significativamente (aprox. 642 KiB); no se declara una reducción de bundle que no existe.
- `runtime-subscriptions.test.cjs`: 2/2.
- `route-loading.browser.cjs`: 6 grupos aprobados, incluida entrada real por usuario/contraseña del fixture, recuperación de sesión contra servidor real y ausencia de reload.
- `startup.browser.cjs`: aprobado en puerto aislado 3043; 83 módulos de login, sin router privado; bootstrap demorado muestra advertencia y recupera; puerto ocupado falla sin saltar a otro. El runner acepta `STARTUP_FRONTEND` para probar una instancia aislada y conserva 3030 por defecto.

Evidencia temporal: `/tmp/point-performance-final-comparison.jsonl`, `/tmp/point-performance-delay-before.log`, `/tmp/point-performance-browser-final.log`, `/tmp/point-performance-startup.log`, `/tmp/point-performance-unit.log`. Estos logs no incluyen credenciales. Las APIs reales de prueba usaron exclusivamente el MySQL desechable del runner de integración; no se consultó ninguna base del usuario.
