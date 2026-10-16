# F10 — cierre total: candidato para revisión

2026-10-16. Rama `codex/phase-10`, desde frontend `f6388754b40e48c7e85cca5d53f962949d75f440`; backend F9 más correcciones F10. Sin merge a main. Este bloque es el estado vigente; los ciclos anteriores se conservan abajo como historial.

## Frontend final

- Lenguaje compartido blanco/gris, teal y títulos navy, radios/bordes/sombras discretos, tarjetas y tablas compactas, controles táctiles. Estilos comunes limitados a pantalla; no contaminan documentos impresos. Conserva interfaces F10 aprobadas de atención, mesas, reservas, pedido, catálogo, cocina, cobros y offsite.
- Cocina: estado vacío real “Cocina al día”, sin paginación vacía. Mantiene avisos pendientes, conexión, tres envíos más antiguos, relojes independientes y salida exclusiva del mozo. TV y navegación comprobadas.
- Administración: `/operational-overview` con ventas confirmadas del día (zona del restaurante), cuentas abiertas, envíos pendientes >15min, rendiciones enviadas pendientes de revisión y accesos al detalle. Datos reales de endpoints existentes, loading/error/actualizar y protección contra respuesta tardía tras cambio de restaurante. Límite de 500 cuentas recientes visible; no se inventa un total global de deudas ni se suman cobros a ventas.
- Rendiciones: tarjetas de esperado/entregado/faltante/sobrante, motivo de diferencia, desglose de fondos/entregas/devoluciones/propinas. Nombre real del trabajador desde directorio autorizado, con ID como fallback explícito. Abonos incluidos en cobros, sin sumarlos otra vez. Contratos y handlers financieros intactos.
- Reportes: filtros en grid adaptable, totales separados, traducción de códigos operativos solo en presentación; filtros siguen enviando valores del contrato (por ejemplo Efectivo → CASH). Auditoría conserva detalle antes/después.
- Clientes: teléfono de 9–10 dígitos coherente con backend; identificación no cambia.
- Eliminadas del router activo entradas legacy de proveedores/compras/facturas/caja/reportes antiguos, sin reactivar SaaS/checkout/predicciones. Finanzas, documentos y reportes F6–F9 siguen disponibles según rol. Archivos legacy no alcanzables no se borran masivamente.
- Login ligero, 3030 estricto, pnpm oficial, error de arranque visible, sidebar/header y configuración ya aprobados se mantienen. Windows validado previamente por el usuario; esta automatización corre en Linux.

## Contratos

Sin endpoints/eventos nuevos para UI. GET `/operational-reports/directory` se reutiliza para nombres; GET attention-accounts, kitchen/board, finance/shifts y operational-reports/sales para resumen. Única corrección DTO: teléfono cliente 9–10 dígitos. Sin cambios a permisos, importes, idempotencia, estados, timers o disponibilidad.

Backend corrigió crecimiento recursivo de auditoría y ordenación de snapshots grandes, guard de seed y añadió demo segura/escenario integral. Detalle en `restaurant-backend/docs/PHASE10.md`. 15 migraciones, ninguna nueva.

## Validación ejecutada

| Verificación | Resultado |
|---|---|
| pnpm typecheck / pnpm build | Correctos |
| ESLint focalizado TS/TSX nuevos/modificados | Sin errores; aviso heredado de versión React |
| Unitarias frontend | 9/9: 6 idempotencia + 3 dinero mostrado |
| startup.browser | Login 87 módulos, router privado no anticipado; arranque demorado visible, 3030 ocupado falla sin cambiar puerto |
| integration.browser | Login, recuperación sin SMTP explícita, sidebar, cliente con teléfono de 9 dígitos, mesas, categorías/productos/variantes, trabajadores/roles, restaurante/logo/timezone, extras, menú, disponibilidad, reserva/llegada |
| phase10-operations.browser | Cuenta real, búsqueda, instrucciones independientes, confirmación/adicionales, totales/estados |
| phase10-cycle2.browser | Cocina, salida parcial, corrección, completar, responsive |
| phase10-finance.browser + phase67.browser | Efectivo/vuelto, parcial, Yape manual, saldo, propina, descuento, devolución, deuda/abono, turno |
| phase8.browser | Takeaway/delivery/courier, gratuidades y efectivo en backend real |
| phase9.browser | Documento previo/ticket mixto, reimpresión auditada, filtros, impresión A4/80mm |
| idempotency-hook.browser | A/retry A/B, doble clic, timeout, remount y reconexión |
| idempotency-socket | create-order/add-order-detail concurrentes, pérdida de respuesta/reconexión, operación nueva |
| Responsive | 390×844, 900×1100, 1440×900 sin overflow global; Cocina 1920×1080 |
| Backend | Build/lint/typecheck, 95 unitarias, 139 HTTP/MySQL, escenario integral con reinicio y 11 lecturas persistidas |

Las ejecuciones finales listadas pasaron; no se cuentan como éxitos los ensayos fallidos. Se actualizó el selector de la prueba de reportes de “CASH” a “Efectivo”, verificando que la petición aún envía `method=CASH`. Un intento previo de F9 expiró esperando navegación tras login; el test ahora comprueba explícitamente su respuesta HTTP y las repeticiones completas pasaron. No se atribuye una causa funcional no demostrada.

PDFs reales de Chromium revisados: A4 (595.92×842.88pt), térmico aproximado 80mm (227.04pt de ancho), contenido DOCUMENTO INTERNO, sin navegación/botones ni pérdida de datos. No representa una prueba de impresora física. Snapshots no reconstruidos con datos actuales.

## Advertencias y límites

Sin nuevas excepciones JS ni pantalla blanca en recorridos aprobados. Siguen avisos React Router v7, selects MUI transitorios heredados, bundle grande y recursos remotos/endpoint legacy `cash-register/actives` (404), además del 401 esperado de auth-renew sin sesión. No hubo refactor masivo de deuda histórica. La capa visual no introduce lógica monetaria del cliente.

SMTP CONFIGURADO: NO. ESTADO: pendiente proveedor/credenciales. No se inventa integración bancaria/POS/Yape, backup externo automático, TLS productivo ni credenciales. La demo se configura explícitamente en backend con DEMO_PASSWORD; no hay contraseña almacenada en Git.

Evidencias Cloud (logs, capturas, PDFs y respaldo sensible) fuera de repositorios, en `/workspace/cloud-setup`; instrucciones reproducibles en README, WINDOWS y documentación backend. Candidato pendiente de revisión del Arquitecto/Coordinador; no merge automático ni release.

---
## Historial de ciclos anteriores (no estado vigente)

# Fase 10 — arranque y experiencia de atención

Base frontend main 6998c748c59e2b060d52b1f232a22d2ab7389c73; backend main f312cb5fff101a75983bd1f869b072b434b97469. Trabajo en codex/phase-10 en ambos repositorios, sin merge a main. El backend no tiene cambios: se publica la rama de referencia con el mismo commit.

## Alcance implementado

- Arranque Vite en puerto estricto; carga diferida de SetupRestaurant y pantallas públicas secundarias; estado HTML visible antes de React. Guía Windows en WINDOWS.md con gestores, puertos, instancias únicas, variables y recuperación de caché sin borrar datos.
- Header compartido móvil/escritorio, contexto de sección, altura dinámica de viewport, nombre de usuario contenido en sidebar; se mantienen roles, navegación y persistencia del sidebar.
- Atención con resumen de cuentas abiertas, mesas ocupadas y reservas pendientes a partir de los datos existentes. Indicador de actualización y conexión, pestañas y formularios con distribución adaptable.
- Mesas como tarjetas seleccionables con ocupación y selección diferenciadas, conservando restricciones de cuenta activa y accesibilidad de los controles.
- Toma de pedidos con búsqueda local de productos/menús, mismas opciones/presentaciones/extras/porciones y payloads. Cuenta vacía explícita, cantidad confirmada visible; una línea activa ya no se etiqueta incorrectamente como borrador después de confirmar.
- Reservas, carta/disponibilidad y menú del día con encabezados, estados vacíos y formularios legibles. Carta permanente y menú compuesto siguen siendo entidades diferentes.
- Texto obsoleto sobre finanzas futuras actualizado a la funcionalidad ya existente; no se alteran cobros ni cierres.

## Invariantes

Sin cambios en endpoints, DTO, eventos, roles, idempotencia, versiones, cálculos monetarios, stock, estados de atención/envío/salida/pago o base de datos. Sin migraciones nuevas: 15 acumuladas. No se han modificado pantallas de cocina, finanzas, delivery ni documentos/reportes; se ejecutan sus regresiones por compartir el layout.

## Diagnóstico sustentado

Windows anunció 3031 porque 3030 estaba ocupado, pero se abrió 3030. No se identificó el proceso propietario ni una URL exacta pendiente. No afirmar un bloqueo particular del servidor viejo. El grafo anticipado de módulos sí se reprodujo y redujo: 487 módulos fuente (383 privados) → 87 (1 privado) en login. Cloud no reprodujo espera indefinida; no equivale a prueba nativa de Windows. Npm reportaba opciones pnpm desconocidas; se establece pnpm 8.15.0 como gestor frontend sin cambiar dependencias ni lockfile.

## Pruebas reproducibles

- `pnpm typecheck`, `pnpm build`.
- ESLint focalizado de TS/TSX modificados y tests CommonJS (regla no-var-requires desactivada solo al comprobar scripts CJS).
- `node --test tests/idempotency.test.cjs`.
- `tests/startup.browser.cjs`: login sin router privado, módulo de bootstrap retenido, mensaje de espera visible, recuperación y puerto ocupado rechazado.
- `tests/phase10-operations.browser.cjs`: cuenta de mesa, búsqueda, mismo producto con observaciones distintas, envío inicial y adicional independientes, importes/atención/mesa preservados; 390×844, 900×1100, 1440×900.
- `tests/integration.browser.cjs`: recorrido F0–F3 y navegación F9, reservas/llegada, menú, extras, disponibilidad, responsive y cocina/TV.
- Regresiones `tests/phase67.browser.cjs`, `tests/phase8.browser.cjs`, `tests/phase9.browser.cjs`: dinero, delivery, documentos y PDF.

Scripts browser usan PLAYWRIGHT_MODULE y CHROMIUM_PATH cuando Playwright/Chromium no están instalados en el proyecto. Backend real en 5000, frontend en 3030. Fixtures crean únicamente datos de prueba propios en restaurante_app y los limpian; no seed destructivo ni recreación de BD. No ejecutar en paralelo con la suite HTTP histórica que hace aserciones globales de usuarios.

## Límites

No prueba en Windows nativo ni dispositivos físicos; confirmar en el equipo del usuario con los pasos documentados. Persisten SMTP sin configurar, advertencias heredadas de build/React Router/selectores y endpoint legacy de caja. No se amplía el alcance para resolverlos. No se eliminan ramas ni se modifica Gemini/main. Finaliza esta intervención y espera revisión.

## Resultados

Typecheck y build finales aprobados; lint focalizado de archivos modificados y scripts nuevos sin errores (permanece el aviso de configuración de versión React). Pruebas de arranque y flujo de cuenta F10 aprobadas; 6 unitarias de idempotencia aprobadas. Integración F0–F3, responsive 390/900/1440 y cocina 1920 aprobados. Regresiones de navegador F6–7, F8 y F9 aprobadas, incluidos impresión A4/80mm, documentos y reportes. Sin excepciones JavaScript nuevas. Los avisos heredados se registran por separado. No se modificaron pruebas existentes para ocultar fallos; los ensayos F10 nuevos usan el contrato real de trabajadores/mesas.

## Revisión visual — Ciclo 1

Windows validado por el Product Owner: backend/frontend arrancan e ingreso correcto. Corrección limitada a Atención: indicadores de baja altura, pestaña activa reforzada, márgenes compactos, selector de cuentas acotado y apertura con mesas a la izquierda/formulario corto a la derecha (apilados en móvil). Mesas con icono, nombre, texto libre/ocupada/no disponible, checkbox y texto de selección; no se inventa estado reservada porque las reservas vigentes no preasignan mesas. Empty states existentes conservados, sin datos ficticios en la interfaz.

Prueba de navegador con datos propios de test: selección de mesa libre, mesa ocupada deshabilitada, selección explícita, sin overflow a 390×844/900×1100/1440×900; continúa pasando la creación de consumos, confirmación y adicionales sin duplicados. Capturas revisadas. Sin cambios de contratos/backend, finanzas, cocina ni otras pantallas. No avance al Ciclo 2.

## Corrección operativa de Atención — base 0374828

Mesas dominantes y apertura lateral; cuentas abiertas como tarjetas con importes y responsables reales. Selector histórico secundario. Estados de mesa con texto/icono y selección múltiple; no se inventan reservas anticipadas de mesas.

Catálogo compartido con búsqueda, categorías reales, imagen autenticada cuando existe, precio y disponibilidad. Personalización en diálogo con las opciones y payloads existentes. Pedido lateral con líneas, observaciones, importes del servidor y acciones; cancelación con motivo en diálogo. Envíos compactos con hora original persistida, sin reiniciar relojes. Gestión de mesas/responsable e historial desplegables. Reservas en lista y formulario lateral; carta/disponibilidad y edición de menú en diálogos. Componentes de menú muestran disponibilidad, sin cobro adicional.

Sin cambios backend, contratos, permisos, idempotencia ni cálculo monetario. Los campos opcionales de lectura category/images/createdAt/grossTotal/discountTotal ya existen en respuestas del backend. Sidebar conservado. CSS responsive 390×844, 900×1100 y 1440×900, sin overflow global. No Ciclo 2.

Validación: typecheck, build, lint focalizado; tests de idempotencia y arranque; navegador con backend real para Atención, integración, F6–7, F8 y F9. El fixture de Atención utiliza identificación única para evitar colisión con otro test; datos propios eliminados al finalizar. El recorrido espera el layout visible tras navegación diferida. Persisten avisos históricos de bundles/dependencias, recursos externos, auth-renew previo a sesión y endpoint legacy de caja; no son excepciones nuevas de esta corrección.

## Ciclo 2 — Cocina, cobros, delivery y fiados/devoluciones

Base aprobada frontend `c2808355211b78dcb4353cd0e6615d3ed5a11912`; backend `f312cb5fff101a75983bd1f869b072b434b97469`, sin cambios. Misma rama `codex/phase-10`, sin merge a main. No se rediseñan administración, rendiciones ni reportes.

- Cocina: tarjetas legibles, cantidades pendientes y observaciones destacadas; conexión, reloj y alerta/demora con texto. Se conservan orden, tres envíos en TV, navegación, avisos persistentes, timbre/sonido y autoridad del servidor. No se incorporan acciones de preparación/salida para cocina.
- Mozo: enviado/entregado/pendiente por plato, selector de unidades con controles táctiles y formulario existente para salidas parciales/correcciones. Motivo obligatorio y reloj original intactos.
- Cobros: resumen y acciones en dos columnas, saldo destacado; pagos originales, devoluciones y propinas separados. Métodos seleccionables, QR original, verificación manual Yape, explicación POS externo, vuelto y saldo estimados usando aritmética entera BigInt de céntimos. No se envían estimaciones ni se sustituyen validaciones del backend. Reglas de pagos mixtos, división, responsables, turnos y retry sin cambios.
- Devoluciones: pago original, devuelto y máximo mostrados según pago y saldo a favor actuales; confirmación destructiva con motivo. El servidor vuelve a validar versiones y límites. Propina identifica al beneficiario del pago, separada de ventas.
- Fiados: consulta paginada de seis cuentas identificadas por página usando endpoints existentes; deuda original, abonos y saldo del servidor; acceso al historial/cobro. Carga bajo demanda al desplegar. No se infiere el último abono individual: el resumen actual no expone los vínculos cuota/pago ni su fecha por deuda. Se conserva el historial de pagos con fecha y cobrador. Esto queda como límite de presentación, sin extender contratos por una mejora visual.
- Delivery/para llevar: tarjetas filtrables con contacto, cocina pendiente, entrega y pago separados; detalle/dirección, operaciones existentes y custodia courier organizados. Recepción física no se presenta como venta nueva. Las consultas de tarjetas se limitan a seis cuentas visibles por página.
- Documentos desde Cobros: enlaces `Ver cuenta` / `Ticket interno` a `/internal-documents?accountId=<id>`. Único cambio de navegación: preselección de cuenta; no emisión automática, ni modificación de snapshot/impresión. Identificación DOCUMENTO INTERNO conservada.

### Validación Ciclo 2

- Typecheck, build y ESLint focalizado. Sin cambios de dependencias/migraciones.
- Seis tests de idempotencia existentes y tres tests nuevos de precisión de importes presentados.
- 51 pruebas HTTP/MySQL existentes: fulfillment, finance y offsite, sobre fixtures propios en restaurante_app. Incluyen concurrencia, permisos, aislamiento, parcial/mixto, devoluciones, deuda, propinas y custodia del courier.
- `phase10-cycle2.browser.cjs`: cuenta real, envíos adicionales, cuatro comandas/tres visibles y navegación TV, salida parcial, corrección con motivo y reloj preservado, reemplazo al completar, cancelación/historial, responsive.
- `phase10-finance.browser.cjs`: efectivo/vuelto, parcial, retry tras respuesta perdida/doble clic, Yape manual, propina, descuento, devolución, fiado y abono sin venta nueva; tres tamaños de pantalla.
- Regresiones browser F6–7, F8 y F9 (incluye pago mixto/tarjeta y documentos). F8 amplía comprobación de overflow y capturas 390×844, 900×1100 y 1440×900. Cocina 1920×1080.

Limitaciones heredadas: advertencias de bundle/dependencias/React Router/MUI, imagen externa inaccesible, auth-renew antes del login y endpoint legacy de caja. No se amplió alcance para corregirlas. Validación con Chromium en Cloud, no dispositivos físicos/TV real. El Ciclo 2 se detiene para revisión; no avance a administración/rendiciones/reportes.

## Evidencia adicional de cierre

Ensayo de respaldo/restauración F10 aprobado en MySQL aislado: 48 tablas, 15 migraciones y 2 archivos uploads verificados. Procedimiento y hashes en `restaurant-backend/docs/BACKUP-RECOVERY.md`. No se restauró sobre el origen ni se tocó ninguna otra base.
