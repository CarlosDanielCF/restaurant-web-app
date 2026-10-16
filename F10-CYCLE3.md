# F10 · Ciclo 3 · Clean POS

Base: `b6fc55edb2a7cecc4c5180b56377c1b3316c8b71`. Rama local `codex/phase-10`.
Este ciclo es exclusivamente de presentación del frontend. No cambia endpoints,
payloads, permisos, sockets, claves de idempotencia, estados ni cálculos monetarios.
No modifica backend, no ejecuta seeds y no publica cambios remotos.

## Cambios por pantalla

- **Sistema visual:** tokens Clean POS (teal #0D9488, teal oscuro #0F766E,
  navy #19384B, fondo #F8FAFC), cards de 12 px, botones de 8 px,
  bordes suaves, tablas compactas, controles principales de 44 px y modales coherentes.
  Las reglas nuevas se limitan a pantalla; los snapshots y estilos de impresión no cambian.
- **Header/sidebar:** cabecera de 56 px, restaurante, usuario/rol, fecha en la zona
  configurada y estado de la conexión existente. Selección lateral con indicador teal.
  Se conserva navegación, permisos y colapsado.
- **Login:** card central, sin imagen externa, credenciales y recuperación existentes,
  mostrar/ocultar contraseña y estados de carga/error. Sin enlace de registro público.
- **Atención/mesas/reservas:** más densidad, tarjetas táctiles, pestaña activa inequívoca,
  mapa dominante con apertura lateral 68/32 en escritorio. Estados reales y selección
  múltiple existentes intactos. Reservas conservan lista/formulario responsive.
- **Pedido/catálogo/menú/disponibilidad:** reparto 65/35, pedido lateral fijo en escritorio,
  tarjetas con imagen o icono, presentación y disponibilidad existentes; selección y
  personalización conservadas. Menú del día con nombre, precio conjunto y disponibilidad
  jerarquizados, sin repetir cobros de componentes. Se unifican envíos y detalle de salida con superficies compactas.
- **Cocina:** tres columnas principales en TV, tiempos legibles, alerta/demora con texto
  y color. Avisos del envío visible dentro de su ticket; avisos de otros envíos permanecen
  visibles fuera de los tickets. No cambia reconocimiento, persistencia ni relojes.
  Estado vacío sin paginación; se recuerda que cocina avisa y el mozo marca salida.
- **Cobros/fiados/abonos/devoluciones/propinas:** saldo navy protagonista, historial y
  devoluciones diferenciados, formularios y controles consistentes. Métodos, QR original,
  confirmación manual y propinas separadas mantienen su comportamiento anterior.
  Estados vacíos de cuentas y turnos solo cuando la consulta terminó correctamente.
- **Delivery:** stepper de los estados existentes, identifica exclusivamente el estado
  actual, sin inferir que los anteriores se completaron. Entrega y pago explícitamente
  independientes. No cambia acciones ni custodia courier.
- **Rendiciones:** bloques de custodia/abonos y cobros por medio, importes originales del
  servidor, esperado/entregado/diferencias legibles; faltante y sobrante diferenciados.
  Las propinas siguen en su historial separado.
- **Administración:** tarjetas de métricas reales existentes. No se inventan indicadores.
- **Reportes:** navegación lateral en escritorio, selector compacto en móvil/tablet,
  título del reporte activo, filtros/tablas coherentes. Mismo conjunto por rol y mismos
  filtros, consultas y paginación; el manejador anterior se reutiliza en ambas vistas.
- **Documentos:** superficie de papel distinguible del sistema; A4/80 mm y snapshots
  conservados. No se reconstruyen documentos históricos.
- **Configuración/carta/clientes/historial:** tema común de formularios/cards/tablas y
  jerarquía consistente, conservando las pantallas y acciones actuales. Zona horaria
  y QR quedan en un panel de ancho contenido.
- **Trabajadores:** iniciales de nombres reales y roles/estados/acciones existentes.

## Validación reproducible

Con frontend pnpm en 3030 y backend existente en 5000:

```sh
pnpm typecheck
pnpm build
node --test tests/idempotency.test.cjs tests/display-money.test.cjs
node tests/startup.browser.cjs
node tests/idempotency-hook.browser.cjs
# Playwright instalado externamente puede indicarse mediante PLAYWRIGHT_MODULE.
# DEMO_PASSWORD se proporciona por entorno privado; nunca se guarda en el repositorio.
DEMO_USERNAME=demo_f10_owner node tests/phase10-cycle3.browser.cjs
```

El smoke nuevo usa únicamente el demo existente, bloquea escrituras de negocio HTTP,
no crea fixtures y genera capturas/resultados en `VISUAL_OUTPUT` (por defecto `/tmp/restaurant-cycle3`).
Los POST de autenticación están permitidos. No invoca acciones financieras, avisos ni seeds.

Resultados: typecheck/build/lint focalizado correctos; 6 pruebas de idempotencia y 3 de
importes correctas. Startup: 88 módulos fuente, login sin router privado, recuperación
ante carga demorada y puerto 3030 estricto. Hook: doble clic, timeout, remount,
reconexión, A/retry A/B y add-order-detail correctos con socket simulado.
Smoke: 48 comprobaciones de login y 12 rutas, pestañas de Atención, tamaños 390×844,
900×1100, 1440×900 y Cocina 1920×1080. Sin overflow global ni excepciones JS.

## Límites de evidencia y diferencias respecto del objetivo

- El demo existente contiene 24 mesas y carta/menú, pero no atenciones, envíos,
  pagos, turnos ni documentos para demostrar los paneles poblados. Se comprobaron
  estados vacíos reales. No se atribuye a este ciclo un E2E transaccional, prueba de
  tres tickets poblados, pagos mixtos, impresión de documentos emitidos o salida parcial.
  No se ejecutaron suites que crean fixtures porque este ciclo exige datos existentes.
- Se conservó la impresión real A4/80 mm. No se emitieron documentos nuevos para
  validarla ni se comprobó una impresora física.
- Antes de autenticar no existe contrato público de identidad del restaurante;
  login conserva la marca configurada con `VITE_APP_NAME`. No se añadió una API.
- Ventas por método no se simulan con cobros: el resumen conserva exclusivamente
  indicadores actuales y los reportes separan ventas/cobros. No se agregan métricas
  sin un contrato real.
- La auditoría externa completa no está adjunta; se aplicaron las directrices Clean POS
  especificadas por el usuario.

## OBSERVACIÓN FUNCIONAL — NO MODIFICADA

- `GET /api/cash-register/actives` sigue devolviendo 404 desde el flujo legacy.
  No se modificó su solicitud ni backend por ser ajeno al rediseño.
- La renovación inicial sin sesión devuelve 401 antes del login, sin impedir acceso.
- No se garantiza una demostración poblada de operaciones con el demo vacío actual;
  requiere operaciones reales realizadas por el equipo, no información inventada.

## Advertencias técnicas

Build mantiene avisos heredados de directivas `use client`, dependencias y chunks
mayores de 500 KiB (el toolbar histórico de pedidos es particularmente grande).
ESLint informa configuración de versión React no especificada, sin infracciones
focalizadas. No se hizo una refactorización de dependencias ni del bundle.

## Archivos del ciclo

- `F10-CYCLE3.md`
- `src/pages/Private/Finance/FinancePage.tsx`
- `src/pages/Private/Insights/DocumentsPage.tsx`
- `src/pages/Private/Insights/OverviewPage.tsx`
- `src/pages/Private/Insights/ReportsPage.tsx`
- `src/pages/Private/Operations/DailyMenuWorkspace.tsx`
- `src/pages/Private/Operations/DeliveryProgress.tsx`
- `src/pages/Private/Operations/KitchenPage.tsx`
- `src/pages/Private/Operations/OffsiteCards.tsx`
- `src/pages/Private/Restaurant/Restaurant.page.tsx`
- `src/pages/Private/Users/components/UsersTable/UsersTable.component.tsx`
- `src/pages/Private/layouts/SidebarLayout/Header/OperationalHeaderMeta.tsx`
- `src/pages/Private/layouts/SidebarLayout/SidebarLayout.component.tsx`
- `src/pages/Public/Auth/Login/Login.page.tsx`
- `src/styles/clean-pos.css`
- `src/theme/schemes/PureLightTheme.ts`
- `tests/phase10-cycle3.browser.cjs`
