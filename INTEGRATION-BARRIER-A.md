# Integración controlada — Barrera A

Base funcional frontend `2e020095df2b284d13471151ccd51c61691eb0dd`; backend intacto `f312cb5fff101a75983bd1f869b072b434b97469` en codex/phase-9. Rama de integración creada desde codex/phase-9, sin merge/rebase/main.

Origen visual: origin/gemini/frontend-fases-0-3 `9e4318cb5b9cbe5be4e436a63c1c206f7e5fbafc`, base `88f46564ea89de4adaf4c96290d66713c869591f`, commits 33b8eae/dc60303/84c3bc2/9e4318c. Se aplicó un parche visual seleccionado y se adaptaron manualmente los conflictos, no un merge automático. La rama de Gemini permanece intacta.

## Revisión de los 59 archivos

A: UI segura; B: conflicto F4–F9; C: fuera de alcance; D: obsoleto/no reactivado; E: adaptación manual. Clasificación principal por archivo; la explicación indica qué partes se conservan.

| Archivo | Clase | Decisión |
|---|---|---|
| `README.md` | D | No se copian instrucciones históricas de puertos/WS. Documentación actual y esta matriz son la referencia. |
| `src/api/restauranteApi.ts` | E | Descartado UUID por intento de Gemini. Se conserva prioridad explícita F4–F9 y se añade persistencia de intención pendiente; sin fallback backend. |
| `src/components/ui/EmptyState.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/components/ui/index.ts` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/hooks/useEmitWebSocketsEvent.ts` | E | Descartado UUID por intento de Gemini. Se conserva prioridad explícita F4–F9 y se añade persistencia de intención pendiente; sin fallback backend. |
| `src/pages/Private/Clients/components/ClientsList/ClientsTable.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/Clients/components/DeleteClient/DeleteClient.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/Clients/components/FormClient.component.tsx` | E | Presentación integrada sin nueva identificación obligatoria ni teléfono incompatible: conserva contrato real (10 dígitos), nombres permiten edición normal. |
| `src/pages/Private/Common/contexts/SidebarContext.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Categories/components/CategoriesList.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Categories/components/EditCategory.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Categories/components/ModalCreateCategory.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Categories/components/ModalDeleteCategory.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Categories/components/ModalEditCategory.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Products/CreateProduct.view.tsx` | E | Botones visuales sobre DTO F2; FOOD/DRINK, opciones y payload actual conservados. |
| `src/pages/Private/EditMenu/views/Products/EditProduct.view.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Products/components/FormProduct.component.tsx` | E | Botones visuales sobre DTO F2; FOOD/DRINK, opciones y payload actual conservados. |
| `src/pages/Private/EditMenu/views/Products/components/ModalCreateProductOption.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Products/components/ModalDeleteProduct.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Products/components/ModalSelectDefaultVariant.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Products/components/ModalUpdateProductOption.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Products/components/ProductCard.component.tsx` | E | Estética integrada con useRestaurantImage autenticado F1, no URL pública histórica. |
| `src/pages/Private/EditMenu/views/Products/components/ProductsList.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Sections/components/ModalCreateSection.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Sections/components/ModalDeleteSection.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/EditMenu/views/Sections/components/ModalUploadExcel.component.tsx` | C | No se integra UI de cuentas financieras/métodos legacy ni importación Excel ajena al alcance vigente. |
| `src/pages/Private/EditMenu/views/Sections/components/SectionsList.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/Orders/dto/create-order-detail.dto.ts` | D | DTO histórico conservado. La clave de transporte la añade el hook; no se restaura modelo de pedido antiguo. |
| `src/pages/Private/Orders/dto/create-order.dto.ts` | D | DTO histórico conservado. La clave de transporte la añade el hook; no se restaura modelo de pedido antiguo. |
| `src/pages/Private/Orders/views/Tables/components/Table.component.tsx` | D | Mapa antiguo basado en Orders no se reactiva. Apariencia de tarjetas trasladada a TableChoices con ocupación por cuenta F3. |
| `src/pages/Private/Orders/views/Tables/components/TableInfo.component.tsx` | D | Mapa antiguo basado en Orders no se reactiva. Apariencia de tarjetas trasladada a TableChoices con ocupación por cuenta F3. |
| `src/pages/Private/Restaurant/Restaurant.page.tsx` | E | Tarjetas visuales integradas, preservando zona horaria/Yape. Retiradas suscripciones y cuentas/métodos financieros legacy; F6 usa motor canónico. |
| `src/pages/Private/Restaurant/components/FormRestaurantLogo.component.tsx` | E | Estética integrada con useRestaurantImage autenticado F1, no URL pública histórica. |
| `src/pages/Private/Restaurant/components/ModalCreateAccount.component.tsx` | C | No se integra UI de cuentas financieras/métodos legacy ni importación Excel ajena al alcance vigente. |
| `src/pages/Private/Restaurant/components/ModalCreatePaymentMethod.component.tsx` | C | No se integra UI de cuentas financieras/métodos legacy ni importación Excel ajena al alcance vigente. |
| `src/pages/Private/Restaurant/components/ModalCreateProductionArea.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/Restaurant/components/ModalEditAccount.component.tsx` | C | No se integra UI de cuentas financieras/métodos legacy ni importación Excel ajena al alcance vigente. |
| `src/pages/Private/Restaurant/components/ModalEditPaymentMethod.component.tsx` | C | No se integra UI de cuentas financieras/métodos legacy ni importación Excel ajena al alcance vigente. |
| `src/pages/Private/Tables/components/ModalDeleteTable.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/Tables/views/EditTable/EditTable.component.tsx` | E | Responsive y navegación tras guardar; límite de sillas alineado al DTO actual (99), no límite nuevo 50. |
| `src/pages/Private/Tables/views/TablesList/ListTables.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/Users/components/DeleteUser/DeleteUser.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/Users/components/EditUserRole.component.tsx` | E | Responsive integrado conservando expectedVersion y exclusión del dueño; sin permitir elevación de privilegios. |
| `src/pages/Private/Users/components/FormUser.component.tsx` | E | Iconos sobre formulario F1: roles definitivos y activación segura, sin contraseña predecible. |
| `src/pages/Private/Users/components/InviteUserModal.component.tsx` | D | Mejoras visuales inertes conservadas, sin reactivar acceso a invitaciones legacy: trabajadores se crean por F1. |
| `src/pages/Private/Users/components/RemoveUserFromRestaurant/RemoveUserFromRestaurant.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/Users/components/UsersTable/UsersTable.component.tsx` | E | Responsive integrado conservando expectedVersion y exclusión del dueño; sin permitir elevación de privilegios. |
| `src/pages/Private/layouts/SidebarLayout/Header/components/Userbox.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/layouts/SidebarLayout/Sidebar/Sidebar.component.tsx` | E | Drawer 260/72px y tooltips; logo autenticado, roles definitivos y todas las secciones tanto móvil como escritorio. |
| `src/pages/Private/layouts/SidebarLayout/Sidebar/SidebarMenu/MenuSection.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/layouts/SidebarLayout/Sidebar/SidebarMenu/NavItemButton.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/layouts/SidebarLayout/Sidebar/SidebarMenu/SidebarMenu.component.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Private/layouts/SidebarLayout/SidebarLayout.component.tsx` | E | Cabecera móvil Gemini con cierre al cambiar breakpoint y contenedor flexible F9, sin doble barra. |
| `src/pages/Private/layouts/SidebarLayout/data/MenuData.tsx` | B | Rechazada restricción F0–F3. Navegación reconstruida con rutas/roles F9; sin dashboard financiero legacy ni módulos fuera de alcance. |
| `src/pages/Public/Auth/ForgotPassword/ForgotPassword.page.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Public/Auth/Login/Login.page.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/pages/Status/Unauthorized.page.tsx` | E | Diseño integrado, retorno a /attention en lugar de /orders antiguo. |
| `src/routers/AppRouter.tsx` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |
| `src/theme/schemes/PureLightTheme.ts` | A | UI conservada: espaciado, iconos, controles o estados vacíos; contrato F9 preservado. |

## Correcciones de compatibilidad encontradas con backend real

- Edición de restaurante: el hook histórico usaba restaurant/1; ahora usa el UUID del restaurante de la sesión. No cambió el endpoint.
- ProductCard tolera área de producción opcional, válida en el DTO F2; no se exige un dato nuevo.
- El tema heredado imponía overflow visible a las pestañas desplazables; se restaura scroll horizontal contenido para evitar desbordar Atención en móvil.
- Recuperación: SMTP no está configurado en Cloud (503 explícito). La pantalla muestra el mensaje real, no afirma que el correo fue enviado ni que el usuario no existe. La recuperación administrativa por token mantiene F1.
- Categorías recién creadas toleran products ausente hasta recargar; el modal conserva la sección seleccionada y una lista de productos vacía al incorporar la respuesta resumida al catálogo local, hasta la recarga autoritativa; formulario de imagen no anida otro form dentro del producto y ayudas de validación de trabajadores usan span. Se corrigen excepciones/avisos DOM encontrados en la prueba real.
- Selectores de pruebas adaptados al botón de mostrar contraseña y a etiquetas de navegación ahora visibles; no se eliminaron aserciones de negocio.

## Contratos e idempotencia

No cambian endpoints, DTO del servidor ni eventos. No se modifica backend ni esquema.

Atención y finanzas F4–F9 conservan su Idempotency-Key explícita por intención, bloqueo de doble ejecución y recuperación de estado autoritativo. El interceptor nunca reemplaza una clave explícita.

Para mutaciones HTTP sin clave explícita y create-order/add-order-detail, una intención pendiente se identifica por restaurante, sujeto JWT, operación y cuerpo canónico, excluyendo expectedVersion y la clave de transporte. Se guarda UUID en sessionStorage bajo un hash (no guarda token ni datos personales). Reintentos, remontaje y reconexión dentro de la pestaña reutilizan UUID; un resultado confirmado elimina la intención; una operación distinta obtiene UUID nuevo. No hay reenvío automático. Imagen multipart distingue bytes, no solo nombre de archivo. Almacenamiento no disponible impide enviar para no perder la identidad silenciosamente. Cerrar definitivamente la pestaña elimina sessionStorage: consultar estado antes de reconstruir operaciones en otra sesión/dispositivo.

El hook conserva el bloqueo síncrono de doble clic y controla ACK tardío para no desbloquear un intento posterior. Se elimina la generación de UUID de bajo nivel en useSocket. Backend sigue siendo autoridad de deduplicación/versionado; una clave no vuelve idempotente un endpoint que no implemente ese contrato.

## Navegación

Atención/mesas/delivery y sus pestañas Reservas, Menú compuesto, Carta/disponibilidad; Cocina; Cobros/rendición; Documentos internos; Reportes operativos; Pedidos históricos; Restaurante; Carta permanente; Gestión de mesas; Trabajadores; Clientes. Se filtra por rol en escritorio/móvil. Cocinero no obtiene acceso financiero. No se habilita Start/Ready/Deliver, cashier, checkout, proveedores, suscripciones o predicción. El tablero financiero vigente es Reportes operativos F9, no el dashboard legacy.

## Validación y límites

Pruebas reproducibles: tests/idempotency.test.cjs, tests/idempotency-hook.browser.cjs, tests/idempotency-socket.cjs, tests/integration.browser.cjs y regresiones tests/phase67.browser.cjs, tests/phase8.browser.cjs, tests/phase9.browser.cjs. Ejecutar browser después de HTTP/MySQL, no simultáneamente: fixtures históricos verifican usuarios globalmente. Exclusivamente restaurante_app.

No F10/hardening, release ni aprobación automática de Barrera A. Pendiente revisión del Arquitecto/Coordinador.

## Evidencia de validación

- Backend F9 intacto: build/lint, 92 unitarias (10 suites), 137 HTTP/MySQL (8 suites) correctos, incluida regresión F0–F9. No migraciones nuevas: 15 acumuladas.
- Identidad de operación: 6 pruebas unitarias; hook React real con socket controlado para timeout/doble clic/remontaje/reconexión; Socket.IO real con create-order/add-order-detail concurrentes y reintento tras reconectar. Sin duplicados.
- Finanzas en navegador: respuesta de pago descartada después del commit; reconstrucción de la misma intención tras advertencia de versión, misma clave y un solo pago. Nueva operación Yape usa otra clave. Rendición y persistencia al recargar correctas.
- F8/F9 browser: entrega fuera del local, personal/courier, pagos, documentos, reimpresión y PDF A4/80mm correctos.
- Navegador F0–F3 contra backend F9: login/contraseña/sidebar persistente, cliente, mesa, sección/categoría/producto/presentación, trabajador/roles, restaurante/logo/timezone, menú compuesto, extras/disponibilidad, reserva y llegada con cuenta correctos. Recorrido de once rutas en 390×844, 900×1100 y 1440×900 sin desbordamiento del área principal. Cocina 1920×1080: 4 pendientes/3 visibles/1 adicional, navegación y retorno a antiguas correctos; sin acciones heredadas. Cero excepciones JavaScript en el recorrido final.
- Frontend typecheck/build correctos. Lint focalizado: 22 diagnósticos heredados frente a 137 en esos archivos de F9, cero nuevos. Tests CJS se verifican con entorno Node y regla no-var-requires desactivada solo para el formato CommonJS. No cambios masivos fuera del conjunto integrado.
- Persisten advertencias de tamaño de bundle/use-client y recursos externos inaccesibles (fuentes/imagen), auth-renew401 previo a login y cash-register/actives404 heredados. SMTP requiere configuración real; no se simula entrega de correo. También quedan avisos React Router de migración futura y MUI por valores iniciales de selectores fuera de opciones durante la carga; se registran como deuda, sin excepciones ni rechazo de las operaciones probadas.

## Handoff

Usar integration/f0-f9 del frontend con backend codex/phase-9. Mantener contratos PHASE01/23/45/67/8/9. Los puntos de entrada de F4–F9 siguen siendo Operations, Finance e Insights. No copiar sobre ellos versiones históricas de Orders ni restaurar MenuData limitado a F0–F3.

La matriz contabiliza 32 A, 1 B, 5 C, 6 D y 15 E. Son categorías principales; los archivos mixtos conservan solo las partes descritas. Backend y rama Gemini no reciben commits de esta integración. No se declara cerrada Barrera A: la aprobación final corresponde al Arquitecto/Coordinador.
