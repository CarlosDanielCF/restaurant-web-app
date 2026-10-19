# Restaurant — frontend F0–F10

Ampliación de compras, bebidas y centro de reportes en `codex/phase-10`, sobre `698b1d3aad6747cfcf5ddc8a1ea2662dadeea359`. Requiere backend coordinado `codex/operational-ux` y su migración aditiva 21. Sin push ni merge. Operación, permisos, pruebas y límites en [SUPPLIES-REPORTS.md](SUPPLIES-REPORTS.md).

Los únicos egresos de esta ampliación son **compras de mercado** registradas manualmente y **compras de bebidas** generadas una sola vez por ingreso de stock. Resultado operativo sobre cobranzas = cobranzas netas − compras de mercado − compras de bebidas.

## Arranque

Node LTS compatible; pnpm **8.15.0** (packageManager/lockfile). No mezclar npm install con pnpm.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Configurar `.env` con `VITE_API_URL=http://127.0.0.1:5000/api` y `VITE_WS_URL=http://127.0.0.1:5000`. Backend iniciado, migraciones aplicadas, MySQL restaurante_app. Vite usa **3030 estricto**: cerrar/revisar el proceso que lo ocupa; no abrir 3030 si otra terminal anunció 3031. Login ligero y estado de arranque visible. [Guía Windows y diagnóstico](WINDOWS.md).

## Funcionalidad

Atención/mesas/reservas, carta y menú compuesto, cocina/salidas, cobros/deudas/abonos/devoluciones/propinas, delivery/courier, rendiciones, configuración/trabajadores, documentos internos y reportes. Roles y permisos los impone el backend. Resumen operativo de administración en `/operational-overview`, únicamente con datos reales; no confunde ventas y cobros. Interfaz responsive compacta, impresión A4/80mm; sin datos ficticios en pantallas vacías.

Compras y bebidas usa `/supplies` con el nuevo contrato autorizado; no se registran rutas de proveedores, compras legacy, facturas legacy ni caja/reportes antiguos. Se mantienen finanzas, documentos y reportes canónicos F6–F9; archivos legacy aún no alcanzables pueden permanecer por trazabilidad.

## Pruebas

```sh
pnpm typecheck
pnpm build
node --test tests/*.test.cjs
```

El nuevo runner `tests/supplies.browser.cjs` exige backend aislado en 5019, Vite en 3039 y fixture temporal creada por la integración backend; no ejecuta seeds ni migraciones. No apuntarlo a datos del usuario. Las pruebas históricas de navegador `tests/*.browser.cjs` requieren backend real, MySQL, Chromium y Playwright. `PLAYWRIGHT_MODULE`/`CHROMIUM_PATH` permiten indicar instalación externa; no se agrega una dependencia pesada a producción. Ejecutarlas secuencialmente con las suites HTTP. Datos de prueba en tenants propios, nunca en una base distinta. Evidencia y comandos en [PHASE10.md](PHASE10.md), estado en [ESTADO.md](ESTADO.md).

Demo: ejecutar `npm run seed:demo` en backend siguiendo su README. No inventar credenciales; DEMO_PASSWORD lo elige el operador. SMTP CONFIGURADO: NO; pendiente proveedor/credenciales. No bloquea login ni operación habitual. Backup/restore en documentación backend.

Revisión operativa F10/Punto Mar: [flujos, validación y requisitos coordinados del backend](F10-OPERATIVE-REVIEW.md).
