# Revisión global UX operativa — 18 de octubre de 2026

## Base y límites

Frontend `codex/phase-10`, base `ca6ea6ea967cac24a06c1579bcb4c951fa0977a7`.
Backend `codex/operational-ux`, `ea620499d51c438fe13ff906a8616a88a9df2a8e`, sin modificaciones.
Main frontend `b6fc55edb2a7cecc4c5180b56377c1b3316c8b71` y backend `23c69e818235f2ad33c7fd1f5a891e58b306adbb` intactos.
Sin push, merge, nuevas dependencias, assets externos, migraciones ni seeds. No se accede a `tienda`.
Point Restaurant sigue siendo el software; nombre, imágenes y configuración del restaurante siguen siendo datos independientes.

## Auditoría por módulo

| Módulo / flujo | Problema o comprobación | Solución / capacidad conservada |
|---|---|---|
| Login y sesiones | Inicio existente con contraseña visible/oculta, recuperación y errores; no necesita otro paso | Conservado; login real de administrador, mozo y cocinero. Dueño con sesión auténtica emitida por API. No cambios de autenticación ni expiración |
| Header/sidebar | Dueño recibía dos etiquetas para el mismo destino; header del cocinero decía Atención | Un destino por rol, nombre operativo correspondiente; navegación móvil respeta también restricciones individuales; marca y restaurante separados |
| Inicio/resumen | Cuenta reciente exigía volver a buscarla; actualizar borraba el resumen | Enlace a esa cuenta, acceso directo a rendiciones, conserva datos durante actualización; indicador de carga/fecha/error permanece |
| Atención/mesas | Contexto de reserva/resumen se perdía al entrar | `accountId` en navegación de frontend; no es un contrato nuevo de API. Mapa, agrupación, verde antes de envío/rojo después y cierre independiente se conservan |
| Unión/traslado/responsable | Ya diferenciados en revisión anterior | Preservados, con motivo, versiones, cuenta única e historial. No se cambiaron handlers ni se repitieron todas las operaciones en navegador |
| Carta/Pedido | Ya tiene buscador, cantidad, notas, personalización, dos paneles y alternancia móvil | Conservados. Consulta `accountId` reutiliza la cuenta conocida. No se agrupan instrucciones distintas ni se cambia routing |
| Borradores/enviados/entregados | Acciones dependen del estado | Conservadas eliminación de borrador, sustitución/cancelación de pendientes y protección de entregados; correcciones excepcionales siguen secundarias |
| Cocina | TV con hasta tres envíos, audio desbloqueado y relojes independientes | Sin cambios de código; recorrido real con llegada de envío y retirada tras salida total; unitarias de audio preservadas |
| Salidas | Acción junto a la línea ya es rápida | Se conserva entregar cantidad/todo, corrección y recuperación auditadas; probado 1 de 2 y después restante |
| Para llevar | Selección parcial ya contextual | Se conserva; probado 1 de 2 unidades y badge en cocina |
| Delivery | Datos editables y correcciones ocupaban siempre la vista | Contacto como resumen, editor secundario, nuevo repartidor anidado, corrección solo cuando aplica. Estado/razón visibles, enlace directo a cobro, custodia separada |
| Reservas | Llegada del mozo limpiaba responsable oculto y bloqueaba confirmación; acciones lejanas | Responsable autenticado, diálogo contextual, navegación directa a cuenta resultante. Notas opcionales y cancelación con motivo en su diálogo. Búsqueda/estado; sin preasignar mesa |
| Cobros | Funciones excepcionales compiten con cobro ordinario | Cobro contextual conservado; accesos a cuenta/turno, métodos táctiles con icono/texto; opciones financieras secundarias etiquetadas |
| Efectivo/Yape/POS | Flujo y QR existentes | Sin cambios monetarios: efectivo completo por defecto; QR original/verificación manual; POS externo. Sin logo Yape no autorizado |
| Parcial/mixto/división | No reducir capacidad | Se mantienen filas por medio, aplicado/recibido/vuelto, división por importes/personas/productos y validación de suma existente |
| Descuentos/precio especial/cortesías | Deben continuar diferenciados | Descuento bajo opciones financieras, precio especial/cortesía en personalización y configuración. Sin transferir ni recalcular descuentos en frontend |
| Propinas | Nunca son venta | Directas/digitales y entrega posterior conservadas bajo opciones financieras, con beneficiario y auditoría existentes |
| Fiados/abonos | Debe conservar contexto de cliente/cuenta | Listado y abono contextual existentes conservados; registro de deuda en opciones financieras. No es una nueva venta |
| Reembolso/devolución | Operación excepcional sensible | Conservados pago original, máximo, motivo, confirmación y autorización; acceso secundario explícito, sin reversión externa automática |
| Rendición | Encontrar turno requería desplazarse toda la cuenta | Botón a Mi turno/Revisar rendiciones y enlace contextual desde resumen. Fondos, cobros/cuotas, devoluciones, propinas, diferencias, motivo y cierre conservados |
| Clientes | Iconografía emoji y acciones pequeñas en móvil | Iconos MUI consistentes, acción de edición con target mayor; campos y formularios existentes conservados |
| Documentos | Historial desplazaba vista/impresión | Documento primero, historial desplegable, A4/80mm en un toque. Emisión/reimpresión con mismos endpoints y snapshots |
| Historial | Registro histórico debe permanecer consultable | Ruta conservada y smoke responsive; no borrados ni cambio de semántica |
| Reportes | Filtros extensos y tablas comprimidas en móvil | Hoy/mes, filtros adicionales; desktop tabla y móvil cards con todos los campos accesibles. Paginación/consulta/límites y semántica financiera conservados |
| Carta administrativa | Configuración avanzada larga, guardar quedaba lejos | Configuración de extras/acompañamientos/combos/cortesía en disclosure; guardar en pie de diálogo. Producto/presentaciones/precios/imágenes siguen administrables |
| Menú del día | Confirmación debajo de todos los componentes | Guardar/crear en pie del diálogo; componentes/opciones/precio/disponibilidad conservados |
| Disponibilidad/porciones | Agotar requería abrir editor y guardar | Botón directo con versión; stock cero abre porciones para no fingir disponibilidad. Cocinero no edita routing; PRODUCTION/DIRECT conservado |
| Trabajadores/accesos | Edición poco directa y permisos de otros roles parecían concedibles | Editar y Permisos junto al trabajador; lista solo del rol base. Dueño no restrictible. Debounce real de búsqueda y sin refetch duplicado; teléfono opcional secundario |
| Restaurante/QR/configuración | Secciones alejadas | Atajos a identidad y QR/zona horaria; áreas de producción secundarias. Upload/preview y validación existentes intactos |
| Gestión de mesas | CRUD, mapa, capacidad y acciones ya responsive | Conservados y smoke en tres tamaños; no sustituye la atención operativa |

## Roles y permisos

- **Mozo:** atención por defecto, llegada sin reingresar responsable, cuenta conocida, entrega junto al producto, cobro contextual, turno accesible y operaciones excepcionales conservadas.
- **Cocinero:** título Menú y disponibilidad, acción Ver comandas, agotar en tarjeta, porciones y menú. No recibe acciones financieras/administrativas en su formulario de restricciones. Reporte solo de tiempos autorizado por backend.
- **Administrador:** operación completa de su rol, edición/accesos de trabajador contextual, configuración, carta, filtros, documentos y rendiciones.
- **Dueño:** lo anterior, resumen con enlaces directos y sin duplicar destinos especializados del cocinero. No se altera su protección jerárquica.

`roleCapabilities.ts` es presentación de los scopes del rol, no un motor de autorización. El servidor continúa imponiendo roles y restricciones; no hay grants entre roles. Se mantienen claves denegadas existentes al guardar para no ampliar permisos inadvertidamente.

## Interacciones antes/después

Conteos aproximados desde el módulo indicado: pulsaciones de controles, no caracteres escritos, latencia ni scroll. No son mediciones de productividad. Las operaciones ya rápidas se conservan; no se inventa una mejora numérica.

| Recorrido | Antes | Ahora | Observación |
|---|---:|---:|---|
| Mesa libre → añadir dos platos simples distintos → confirmar envío | 4 | 4 | Sin personalizaciones; conserva contexto y apertura rápida |
| Entregar una línea de qty1 | 1 | 1 | Sin confirmación adicional |
| Cuenta → efectivo (turno abierto) | 2 + recibido | 2 + recibido | Cobrar y confirmar; saldo completo preseleccionado |
| Cuenta → Yape | 4 | 4 | Cobrar, método, verificación manual, confirmar; no se quita verificación |
| Pago mixto desde cuenta | ~6 + importes | ~6 + importes | Se conservan selección de medios y validaciones |
| Para llevar parcial antes de envío | 2 + cantidad | 2 + cantidad | Abrir selector/aplicar |
| Crear delivery desde mapa | ~2 + datos requeridos | ~2 + datos requeridos | Sin eliminar datos ni variantes internas |
| Crear reserva con campos mínimos | 1 + datos | 1 + datos | Nota opcional agrega una apertura solo si se necesita |
| Llegada de reserva como mozo | Bloqueada | 3 | Llegada, mesa, confirmar; abre automáticamente cuenta |
| Cuenta reciente del resumen → tomar pedido | 2 o más | 1 | No volver a elegir cuenta |
| Agotar desde tarjeta disponible | ~4 | 1 | Guardado versionado directo; porciones cero conserva editor |
| Registrar abono desde deuda listada | 2 + datos | 2 + datos | Conserva cobrador, método, saldo y turno |
| Alcanzar turno desde cabecera de Cobros | Scroll variable | 1 | No reduce la confirmación del cierre ni su motivo |
| Rendición/cierre desde tarjeta de turno | 2 + importe/motivo | 2 + importe/motivo | Revisión de administrador sigue separada |
| Crear trabajador y restringir accesos desde listado | ~5 + campos/toggles | ~5 + campos/toggles | Menos ruido: solo capacidades válidas y teléfono opcional |
| Fecha de reporte = hoy | 2 fechas + aplicar | 1 | Preset usa timezone del restaurante |
| Cambiar formato de impresión | 2 | 1 | Selector A4/80mm directo |

Opciones secundarias añaden deliberadamente una pulsación para funciones excepcionales (descuentos/reembolso/fiado/propinas, detalles de delivery, notas de reserva, configuración de combos, filtros avanzados). No se ocultan acciones primarias. No se desmontan formularios al cerrar disclosures: datos introducidos permanecen.

## Responsive, accesibilidad y recursos

Controles principales de diálogo/métodos con mínimo 44px, texto junto a icono, estados por texto, `aria-pressed` en métodos, `summary` nativo operable por teclado y foco visible. Guardar en DialogActions permite desplazar contenido sin perder la acción. Reportes móviles no comprimen la tabla; todos los campos adicionales siguen disponibles.

Iconos de `@mui/icons-material` ya instalado (Material Icons, Apache-2.0; wrapper MUI MIT). No nuevas dependencias ni descargas. Yape conserva icono QR neutral; no se incorporó marca externa no autorizada. Fotos por producto, placeholder neutro, logos Point Restaurant/restaurante y QR almacenado sin alteraciones.

## Pruebas y reproducción

Backend real en 5000, frontend Vite en 3030; Chromium del entorno. El runner `tests/global-ux.browser.cjs` requiere:

- `restaurante_app` existente con esquema compatible; verifica migraciones **solo por lectura**, falla si falta la base requerida.
- Credenciales development de dueño existentes mediante variables `DEV_USER_USERNAME`/`DEV_USER_PASSWORD` del backend. No se imprimen ni se versionan.
- Playwright disponible (`PLAYWRIGHT_MODULE` opcional para ubicación instalada) y Chromium `/usr/bin/chromium`.
- Crea restaurante/usuarios/catálogo de prueba mediante APIs existentes; elimina exclusivamente su fixture identificado al terminar. No carga datos de presentación ni modifica Punto Mar.

Ejecución: `node tests/global-ux.browser.cjs`. No invoca `fixture.ts`, `runMigrations`, development seed ni seed Punto Mar.

Los runners históricos HTTP/browser importan un bootstrap que ejecuta migraciones y seed automáticamente. Se conservaron pero **no se ejecutaron en esta pasada** por la prohibición expresa del usuario. La integración se comprobó con el nuevo runner real HTTP/MySQL/navegador; esto no equivale a repetir todas las suites históricas ni todos los casos de concurrencia.

Resultados finales de esta pasada se registran al finalizar la validación, junto con sus límites.

## Contratos y límites

Sin endpoints, payloads, sockets, claves de idempotencia ni reglas financieras nuevos. Solo navegación frontend contextual (`accountId`, `tab`, `view=shifts`) y operaciones existentes. Sin cambios de backend/esquema ni archivos eliminados.

No se valida físicamente sonido, transferencia Yape, POS o impresora. SMTP, despliegue y backups externos continúan dependiendo de infraestructura externa. La existencia de 20 migraciones en Cloud no afirma que estén aplicadas en Windows. No se aplicó ninguna en esta tarea.

## Evidencia final de esta pasada

- Backend: `npm run build`, `npx tsc --noEmit`, `npm run lint`: salida 0. `npm test`: **13 suites, 105 pruebas aprobadas**, sin fallos.
- Frontend: `pnpm typecheck`, `pnpm build`: aprobados. Lint focalizado de todos los TS/TSX/CJS modificados/nuevos: 0 errores (aviso de configuración de versión React del plugin). `node --test tests/*.test.cjs`: **18 aprobadas**: 6 idempotencia, 5 dinero, 4 sonido y 3 presentación de permisos por rol.
- `node tests/global-ux.browser.cjs`: **PASS**, backend/MySQL reales, cuatro sesiones/roles. Autenticación; formulario de permisos solo del rol; disponibilidad directa persistida; reserva y nota persistida tras plegar; llegada del mozo a cuenta conocida; cantidad 2 y para llevar 1; envío, actualización KDS y salidas parcial/total; cobro contextual y turno rápido; S/58 aplicado, S/60 recibido, S/2 vuelto; saldo cero conserva atención abierta; opciones financieras accesibles; emisión de documento y formato80mm; enlace del resumen a cuenta; edición de dirección/referencia delivery persistida; navegación financiera contextual sin abrir pago si saldo cero; reporte Hoy y cards móviles.
- Negativas HTTP reales: cocinero no consulta cuentas ni turnos financieros (403); mozo no consulta cuentas de otro restaurante (403).
- Responsive: 390×844, 900×1100 y 1440×900 en llegada, pago, documento, delivery, resumen, reportes, configuración, usuarios, clientes, mesas, carta, menú, disponibilidad, reservas, rendiciones e historial. Cocina1920×1080 y390×844 (vacía al terminar salidas; no se repobló artificialmente para captura).
- Sin overflow global/documento ni del contenedor principal en las capturas comprobadas. **0 excepciones JS** y **0 full reloads durante operaciones**; las aperturas intencionales de ruta del runner se excluyen de ese conteo. Revisión visual de móvil/cobro/reportes, delivery y dashboard/usuarios; se corrigieron estiramiento de filtros y duplicación de destinos del dueño.
- Registro de migraciones antes/después idéntico: **20 ya existentes en Cloud**. **0 migraciones creadas/ejecutadas; 0 seeds ejecutados**. No se consultó ni alteró `tienda`.
- Capturas y logs de ejecución quedaron en `/tmp/point-global-ux` y `/tmp/point-global-*.log` del entorno de revisión; no se incluyen datos temporales de test en assets del producto.

### Límites de la evidencia

Los casos anteriores no prueban nuevamente todas las combinaciones de pagos mixtos, Yape/POS, descuentos/reembolsos, fiados/abonos, diferencias de rendición, cierre, unión/traslado, concurrencia y reconexión. Se conservaron implementaciones y pruebas históricas, se revisó el diff y se ejecutaron las unitarias disponibles; las suites históricas con bootstrap de seed/migración quedan pendientes de ejecución autorizada. Tampoco se afirma validar altavoces, impresión física, SMS/SMTP, bancos ni el entorno Windows.

Build conserva advertencias de dependencias `use client` y chunks grandes, incluido el módulo histórico de PDF/listado. No se hizo refactor de dependencias ni barrido del lint global ajeno a esta tarea. Las pruebas nuevas trabajan solo en development y fallan si falta el esquema requerido; no lo actualizan.

## Inventario de archivos de este commit

- `ESTADO.md`
- `F10-GLOBAL-UX.md`
- `F10-OPERATIVE-REVIEW.md`
- `src/components/operational/MoreOptions.tsx`
- `src/hooks/roleCapabilities.ts`
- `src/pages/Private/Clients/components/ClientsList/ClientsTable.component.tsx`
- `src/pages/Private/Finance/FinancePage.tsx`
- `src/pages/Private/Insights/DocumentsPage.tsx`
- `src/pages/Private/Insights/OverviewPage.tsx`
- `src/pages/Private/Insights/ReportsPage.tsx`
- `src/pages/Private/Operations/AttentionWorkspace.tsx`
- `src/pages/Private/Operations/CatalogWorkspace.tsx`
- `src/pages/Private/Operations/DailyMenuWorkspace.tsx`
- `src/pages/Private/Operations/OffsitePanel.tsx`
- `src/pages/Private/Operations/Operations.page.tsx`
- `src/pages/Private/Operations/ReservationsWorkspace.tsx`
- `src/pages/Private/Operations/ServiceCatalog.tsx`
- `src/pages/Private/Restaurant/Restaurant.page.tsx`
- `src/pages/Private/Users/components/FormUser.component.tsx`
- `src/pages/Private/Users/components/UsersTable/UsersTable.component.tsx`
- `src/pages/Private/Users/components/WorkerPermissions.tsx`
- `src/pages/Private/Users/hooks/useUsers.ts`
- `src/pages/Private/layouts/SidebarLayout/Sidebar/Sidebar.component.tsx`
- `src/pages/Private/layouts/SidebarLayout/Sidebar/SidebarMenu/SidebarMenu.component.tsx`
- `src/pages/Private/layouts/SidebarLayout/SidebarLayout.component.tsx`
- `src/pages/Private/layouts/SidebarLayout/data/MenuData.tsx`
- `src/styles/operational-ux.css`
- `tests/global-ux.browser.cjs`
- `tests/role-capabilities.test.cjs`

Archivos eliminados: ninguno. Archivos backend modificados: ninguno. No hubo una necesidad contractual que justificase cambiarlos.
