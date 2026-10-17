# Optimización operativa — inventario previo a implementación

Base frontend f00a61a4e472184ea0eb57b2793a931525bd8630, codex/phase-10.
Base backend 23c69e818235f2ad33c7fd1f5a891e58b306adbb; rama separada antes de cambios.

## Inventario A–G

Los pasos son estimaciones del camino normal, no mediciones de tiempo. Se excluye escribir texto.

| Flujo actual (A) / pasos | Redundancia (B) | Propuesta (C) / objetivo | Frontend (D) | Backend (E) | Riesgos (F) / pruebas (G) |
|---|---|---|---|---|---|
| Mesa: seleccionar, responsable, abrir, buscar cuenta, abrir producto, agregar: 6 | Actor conocido; reapertura manual | Tocar mesa → catálogo, producto sencillo: 2 | AttentionWorkspace, ServiceCatalog | Apertura/recuperación atómica | Carrera de dos mozos, reintento, cuenta única, actor original |
| Unir mesas libres: selección + responsable + abrir + buscar | Responsable repetido | Modo unir, N selecciones, unir/atender: N+2 | AttentionWorkspace | Mismo endpoint atómico con varias mesas | No fusionar cuentas ocupadas ambiguas; conservar flujo auditado de merge |
| Pedido configurable: producto, opciones, confirmar | Modal para producto sencillo | Directo solo sin opciones; modal para personalización | Catálogo/dialog | Contrato líneas existente | Precio, stock, cantidades, idempotencia |
| Reserva: formulario, llegada, mesa/responsable | Responsable repetido en mozo | Preservar fecha/contacto; autocompletar actor donde seguro | ReservationPanel | Sin cambio de reserva anticipada | Zona horaria y llegada |
| Menú: elegir menú, componentes, agregar | Opciones necesarias | Conservar selecciones incluidas y precio único | DailyMenus/Attention | Ruteo por componente | No duplicar precio; menú con bebida preparada |
| Cocina: consultar/actualizar, avisos | Polling 5s + eventos | Eventos principales + reconciliación controlada | KitchenPage | Eventos existentes | 4 dispositivos; 12/15; reconexión |
| Salidas/correcciones: unidad y confirmar/motivo | Sin paso prescindible seguro | Mantener, actualizar sin refresh manual | FulfillmentPanel | Producción independiente de categoría | Parciales/corrección; reloj original |
| Cobro efectivo/Yape/tarjeta/mixto: cuenta, método, importes, confirmar | Actualizar manual visible | Sincronizar sin borrar formulario; conservar confirmación | FinancePage | Finanzas intactas | Saldo obsoleto; recibido/aplicado/vuelto |
| Propina: tipo, monto, confirmar | Datos monetarios necesarios | Conservar separación y beneficiario | FinancePage | Intacto | No venta ni duplicado |
| Devolución: pago, monto, motivo, confirmar | Confirmación necesaria | Conservar | FinancePage | Intacto | Límite e historial |
| Delivery/para llevar: modalidad, contacto, responsable, estado | Actor repetido; polling periódico | Mozo automático; eventos/reconciliación | OffsitePanels/Attention | Eventos atención/finanzas existentes | Custodia != cobro; estado independiente |
| Fiado/abono: cliente, importe, método, confirmar | Confirmación necesaria | Conservar | DebtCards/Finance | Intacto | Abono no venta |
| Rendición: turno, monto, diferencia, confirmar | Motivo necesario | Conservar | FinancePage | Intacto | Cierre inmutable |
| Documentos: cuenta, emitir, reimprimir | Enlace contextual pierde cuenta al montar | Investigar preselección sin cruzar restaurante | DocumentsPage | Snapshot intacto | Emisión idempotente y cambio de contexto |
| Reportes: tipo, filtros, consultar | Filtros necesarios | Conservar consultas históricas acotadas | ReportsPage | Intacto | Permisos, no datos falsos |
| Usuarios: rol fijo, edición | No permisos individuales | Configuración bajo límites por definir con PO | Workers/navigation | Persistencia + enforcement HTTP/socket | Escalada y revocación inmediata |
| Configuración/carta/disponibilidad | Sin ruteo útil de bebidas | Campo de producción explícito | Product editor | Migración, DTO, quote/snapshot | Bebida preparada/directa; variante/combos |
| Sesión: renovación solo al montar | Expira durante turno; token socket antiguo | Renovación anticipada sin desmontar vista, reconexión con token vigente | useAuth/useSocket | JWT vigente y revocación conservados | Offline no equivale a credencial inválida |

## Duplicados y obsolescencia

749 archivos src. Hay routers legacy y dos caminos de autenticación; que no figuren en la navegación no prueba ausencia de imports/tests. No eliminar por nombre. Se mantendrán mientras no exista evidencia suficiente de inutilización. No habrá limpieza masiva ni cambios a caja legacy ajenos al flujo.

## Plan de seguridad

Implementar en bloques: modelo de producción y apertura atómica; UX rápida; reconciliación/sesión; permisos solo tras delimitar negocio; pruebas HTTP reales y cuatro sesiones de navegador/socket. No tocar tienda, no push/merge. Dinero, cancelaciones, cierres y motivos conservan controles.

## Resultado implementado (2026-10-17)

Decisión del Product Owner: los permisos individuales **solo restringen el rol base**, nunca conceden operaciones de otro rol. Backend trabajado en `codex/operational-ux`; frontend en `codex/phase-10`. Ninguna rama main se modifica y no se publica ninguna rama.

### Recorridos y acciones aproximadas

Se cuentan selecciones/confirmaciones, no pulsaciones al escribir, búsqueda ni espera de red. Son comparación del recorrido del código, no un estudio cronometrado con trabajadores.

| Recorrido | Antes | Ahora | Resultado |
|---|---:|---:|---|
| Mozo, mesa libre → primer producto sencillo | ~6 | 2 | Tocar mesa y Agregar; cuenta/responsable resueltos en servidor |
| Mesa ocupada → catálogo | 1–2 | 1 | Cuenta existente, sin reasignar responsable |
| Unir N mesas libres → catálogo | N+3–4 | N+2 | Unir mesas, seleccionar, Unir y atender |
| Producto configurable | 3+selecciones | 3+selecciones | Se conserva personalización, cantidad +/- y motivo cuando corresponde |
| Menú compuesto | 2+componentes | Igual | No cobrar de nuevo los componentes |
| Reserva/llegada (mozo) | 4–5 | 3–4 | Responsable autenticado; no mesa anticipada |
| Cocina/consultar actualización | 1 manual posible | 0 | Eventos y revalidación automática |
| Salida parcial / corrección | 2 / 3+motivo | Igual | Confirmación y auditoría necesarias |
| Efectivo | ~4 | Igual | Método, aplicado, recibido y confirmación conservados |
| Yape | ~4 | Igual | QR y confirmación visual; no integración bancaria |
| Tarjeta | ~3 | Igual | POS externo/manual |
| Pago parcial/mixto | ~3–4 por método | Igual | No se elimina control monetario para ahorrar clics |
| Propina | ~3 | Igual | Separada de consumo, beneficiario existente |
| Devolución | ~4+motivo | Igual | Pago original/límite/motivo conservados |
| Delivery/para llevar | ~5+datos | ~4+datos | No volver a elegir mozo autenticado |
| Fiado / abono | ~3 / ~4 | Igual | Cliente y dinero requieren confirmación |
| Rendición | ~3+motivo si diferencia | Igual | Cierre y movimientos auditados intactos |
| Documento desde cuenta | ~3 | ~2 | Preservar cuenta del enlace solo si está autorizada |
| Reimpresión | ~2 | Igual | Documento histórico, no reconstrucción |
| Reportes | ~2+filtros | Igual | Consulta paginada histórica, sin refresco agresivo |
| Trabajadores/permisos | No existía | 2+restricciones | Cargar versión, seleccionar restricciones, guardar |
| Configuración | ~2+campos | Igual | No rediseño del contrato ni datos ficticios |
| Disponibilidad | ~2 | Igual; 0 refrescos en mozos | Cambios propagados automáticamente |

### Mesas, catálogo y presentación

Mesas verdes activas con texto de estado, importe y responsable cuando existen. Unión rápida limitada a mesas libres; fusionar cuentas ya ocupadas conserva el flujo explícito/auditado anterior. Administrador/dueño todavía elige un mozo real: no se inventa un responsable. El mozo no ve el formulario lateral ordinario de apertura. Productos sencillos se agregan directamente; una presentación por defecto única puede resolverse automáticamente; extras/presentaciones alternativas/combos conservan el panel de opciones. Carrito accesible en móvil. Cantidades fraccionarias siguen admitidas por el contrato existente.

Se reutiliza imagen real del catálogo y se muestra el logo oficial como placeholder sin imagen. No se incorporaron fotos ficticias, IA, assets externos ni dependencias. Se conservó la biblioteca MUI Icons: iconos Material (Apache-2.0), paquete MUI MIT; no hotlinks nuevos. Imágenes individuales de opciones no se añadieron: el modelo actual usa imagen del producto.

### Tiempo real y sesión

`useLiveRefresh` agrupa invalidaciones Socket.IO (120 ms), evita consultas simultáneas dentro del hook y realiza una reconciliación final si llegan más eventos. Usa GET autoritativos conservando el estado renderizado: **no implementa parches delta del servidor** ni recarga de documento. Revalida al conectar, recuperar red/foco/visibilidad y cada 60 s como respaldo cuando la pestaña está visible. Cocina mantiene presencia cada 15 s y reloj local cada segundo; el reloj no consulta API cada segundo. Formularios financieros no se reinician por cada evento.

JWT se comprueba cada 60 s y se renueva antes de expirar (margen 5 min), además de eventos de actividad/reconexión. Se conserva la política de expiración/revocación del servidor. Un dispositivo dormido o sin conexión hasta después de expirar el token puede necesitar login; no se relaja la autenticación. No se ejecutó una prueba de resistencia de turno de ocho horas. Logout global/revocación existente no se cambió. Inicio simultáneo de la misma cuenta sí fue probado.

### Contratos nuevos y permisos

- `POST /attention-accounts/enter`: `tableIds`, `responsibleUserId` opcional para roles administrativos; Idempotency-Key. Recupera una cuenta o crea una sola dentro de transacción. Varias cuentas ocupadas o mezcla libre/ocupada: conflicto, usar la operación auditada existente.
- `PATCH /users/:id/permissions`: `expectedVersion`, `deniedPermissions`; Idempotency-Key, auditoría y control de jerarquía. 14 ámbitos de restricción, nunca concesiones.
- `access.changed`: invalidación autenticada por restaurante; renovar identidad/permisos sin logout. Se comprueban permisos también en HTTP y mutaciones socket posteriores a conectar.
- Dependencia explícita: restringir Atención requiere restringir Cobros, Delivery, Documentos y Reservas (comparten lectura de cuenta). UI lo aplica y servidor valida.
- Catálogo/mesas/restaurante conservan las lecturas compartidas necesarias para operar; las restricciones de gestión impiden escrituras. Directorio de trabajadores y presencia son lecturas operativas compartidas, no reportes financieros.
- Productos: `productionRouting: PRODUCTION | DIRECT`. Presentaciones: mismo enum o null para heredar. UI de creación/edición y disponibilidad autorizada.

### OBS-01

Implementado en backend y frontend. Bebida preparada va a producción; botella directa no. Variantes pueden sobrescribir producto; combos y menú conservan ruteo en componentes y snapshots. Cambiar catálogo no cambia consumos ya registrados. Para compatibilidad, clientes antiguos que omiten el campo al crear producto conservan el valor inicial derivado de su clasificación; una vez persistido manda el ruteo. Snapshots históricos sin ruteo explícito conservan el comportamiento original, sin reescribir historial. No se inventó selección de variante dentro de combo si el modelo actual no la admite.

### Auditoría de archivos

Grafo estático TypeScript desde `src/main`: 740 archivos tipados, 491 alcanzables, 249 candidatos fuera de ese grafo. Eso NO demuestra que sean eliminables (tests, rutas dinámicas, assets y herramientas requieren revisión adicional). **Cero archivos eliminados.** Se retiró únicamente estado/handlers de cálculo comentado y sin uso de FormProduct, junto con efecto inicial duplicado; typecheck/build y CRUD real de producto pasaron. Se corrigió `currentCategoryId` usando category.id en vez de product.id. No se borraron routers legacy por intuición.

### Validación ejecutada

- Backend: build, typecheck y lint correctos; 13 suites/98 unitarias; 8 suites/143 integración HTTP/MySQL correctas. Incluyen seguridad, restricciones, concurrencia, última disponibilidad, finanzas y regresión acumulada.
- Migración aditiva ejecutada y segunda ejecución sin pendientes: **16 aplicadas / 0 pendientes**. No confundir IDs discontinuos de registros con el total.
- Frontend: 9 pruebas unitarias (6 idempotencia, 3 monetarias); test real del hook con doble clic/timeout/remount/reconexión; Socket.IO create-order/add-order-detail idempotente; arranque ligero/login/puerto estricto.
- `tests/operational-ux.browser.cjs`: cuatro contextos reales (mozo A/B, cocina TV/móvil); mesa atómica, primer producto, bebida preparada/directa, adición, cambio de nota, cancelación, salida parcial, agotado, reconexión, revocación de navegación por permisos; 0 recargas completas y 0 excepciones JS. TV prioriza tres envíos más antiguos de cuatro pendientes.
- `tests/phase10-cycle3.browser.cjs`: 51 verificaciones de rutas/responsive, 0 excepciones y 0 mutaciones; advertencia conocida 404 de caja legacy.
- `tests/integration.browser.cjs`: CRUD real de cliente/mesa/sección/categoría/producto/trabajador/restaurante, logo/timezone, roles, menú compuesto, extras, disponibilidad, reserva/llegada, navegación F9.
- Viewports: 390x844, 900x1100, 1440x900 y cocina 1920x1080. Sin overflow global en las comprobaciones; tickets largos conservan scroll, no se trunca información crítica.

### Límites y seguimiento

Implementado y probado: flujos anteriores expresamente enumerados. Implementado pendiente de prueba prolongada/física: renovación durante turno completo, dispositivos/redes móviles reales y TV física. No se afirma ausencia de parpadeo bajo cualquier red: se comprobó que no hay recarga global y que las vistas conservan datos.

No se revisó manualmente cada combinación posible de importe/permiso/producto en navegador; la cobertura HTTP complementa, no sustituye, esa revisión. Los scripts heredados de ciclo 2/operaciones conservan selectores antiguos de checkbox/actualización manual y no se declaran aprobados en este ciclo. El nuevo test operational-ux cubre el recorrido actual; actualizar esas pruebas históricas queda pendiente, sin eliminarlas por intuición.

Advertencias conservadas: React Router future flags; MUI select fuera de rango temporal (0/3) en formularios legacy durante carga; endpoint caja legacy 404; warnings de dependencias/directivas use client/bundle grande. No se hizo limpieza masiva. SMTP, backups externos, despliegue productivo e impresora física continúan dependiendo de infraestructura. No se accedió a tienda. Cambios backend deben revisarse junto con frontend antes de integrar; no desplegar solo uno.

## Archivos del ciclo

- `ESTADO.md`
- `OPERATIONAL-UX.md`
- `src/hooks/useLiveRefresh.ts`
- `src/hooks/useSocket.ts`
- `src/hooks/useWorkerAccess.ts`
- `src/models/auth.model.ts`
- `src/models/menu.model.ts`
- `src/pages/Private/EditMenu/dto/create-product-option.dto.ts`
- `src/pages/Private/EditMenu/dto/create-product.dto.ts`
- `src/pages/Private/EditMenu/views/Products/CreateProduct.view.tsx`
- `src/pages/Private/EditMenu/views/Products/components/FormProduct.component.tsx`
- `src/pages/Private/EditMenu/views/Products/components/ModalUpdateProductOption.component.tsx`
- `src/pages/Private/Finance/FinancePage.tsx`
- `src/pages/Private/Insights/DocumentsPage.tsx`
- `src/pages/Private/Operations/AttentionWorkspace.tsx`
- `src/pages/Private/Operations/CatalogWorkspace.tsx`
- `src/pages/Private/Operations/FulfillmentPanel.tsx`
- `src/pages/Private/Operations/KitchenPage.tsx`
- `src/pages/Private/Operations/OffsiteCards.tsx`
- `src/pages/Private/Operations/OffsitePanel.tsx`
- `src/pages/Private/Operations/Operations.page.tsx`
- `src/pages/Private/Operations/ReservationsWorkspace.tsx`
- `src/pages/Private/Operations/ServiceCatalog.tsx`
- `src/pages/Private/Operations/types.ts`
- `src/pages/Private/Users/components/UsersTable/UsersTable.component.tsx`
- `src/pages/Private/Users/components/WorkerPermissions.tsx`
- `src/pages/Private/components/Auth.component.tsx`
- `src/pages/Private/components/WorkerAccessBoundary.tsx`
- `src/pages/Private/layouts/SidebarLayout/Sidebar/SidebarMenu/SidebarMenu.component.tsx`
- `src/pages/Private/layouts/SidebarLayout/SidebarLayout.component.tsx`
- `src/pages/Public/Auth/hooks/useAuth.ts`
- `src/styles/point-workspaces.css`
- `tests/operational-ux.browser.cjs`
- `tests/phase10-cycle3.browser.cjs`
- `tests/phase10-finance.browser.cjs`

### Cierre de validaciones

Typecheck y build finales: exit 0. Lint focalizado de archivos TypeScript/TSX/CJS modificados/nuevos: exit 0 (advertencia heredada de versión React de ESLint). `phase10-finance.browser.cjs` pasó tras actualizar dos selectores obsoletos: efectivo parcial/vuelto/turno, Yape manual/QR ausente/saldo liquidado, propina directa, descuento, devolución parcial con pago preservado, fiado, abono y navegación contextual a documentos. Se validó responsive financiero. Los dos intentos iniciales fallaron por selectores antiguos, no se contabilizan como aprobados; la ejecución final completa terminó con exit 0.
