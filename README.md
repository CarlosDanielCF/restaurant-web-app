# Restaurant — frontend F0–F10

Candidato final en `codex/phase-10`, sobre `f6388754b40e48c7e85cca5d53f962949d75f440`. Sin merge a main. Backend compatible: F9 más correcciones F10 documentadas en su ESTADO.md.

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

No se registran rutas de proveedores, compras, facturas legacy ni caja/reportes antiguos. Se mantienen finanzas, documentos y reportes canónicos F6–F9; archivos legacy aún no alcanzables pueden permanecer por trazabilidad.

## Pruebas

```sh
pnpm typecheck
pnpm build
node --test tests/idempotency.test.cjs tests/display-money.test.cjs
```

Pruebas de navegador `tests/*.browser.cjs` requieren backend real, MySQL, Chromium y Playwright. `PLAYWRIGHT_MODULE`/`CHROMIUM_PATH` permiten indicar instalación externa; no se agrega una dependencia pesada a producción. Ejecutarlas secuencialmente con las suites HTTP. Datos de prueba en tenants propios, nunca en una base distinta. Evidencia y comandos en [PHASE10.md](PHASE10.md), estado en [ESTADO.md](ESTADO.md).

Demo: ejecutar `npm run seed:demo` en backend siguiendo su README. No inventar credenciales; DEMO_PASSWORD lo elige el operador. SMTP CONFIGURADO: NO; pendiente proveedor/credenciales. No bloquea login ni operación habitual. Backup/restore en documentación backend.
