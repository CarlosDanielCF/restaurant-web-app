# Point Restaurant — identidad del software

Base aprobada: a9786666b264d0df1cf32bfe519efbf93c59cc9c.
Rama: codex/phase-10. Cambio exclusivamente de identidad visual.

## Activo oficial

`public/branding/point-restaurant-logo.png` procede del ZIP proporcionado por el
propietario del producto. SHA-256 del PNG extraído y del PNG incorporado:
`0a0a3b374ce7ee8d2b88c878929321dfe3dc863b3cf578ae9690e0dc8b5d21ae`.

Se conserva el archivo original, sin recorte, recoloreado ni compresión adicional.
La interfaz usa ancho adaptable, altura proporcional y `object-fit: contain`.
El favicon y Apple touch icon apuntan al mismo PNG oficial: no se inventó un
isotipo. El logo completo tendrá menor legibilidad a 16 px que un isotipo diseñado
específicamente; no se modificó la identidad para resolverlo.

## Separación de identidades

SoftwareBrand centraliza la marca fija Point Restaurant. El login no utiliza el
nombre del restaurante ni VITE_APP_NAME como identidad de plataforma. El sidebar
presenta una franja de marca separada del selector existente de restaurante.
El header, selector, logo configurable y documentos históricos siguen utilizando
los datos de cada restaurante. No cambian sus contratos ni su persistencia.

También se actualizaron el título y metadata del navegador, textos de bienvenida,
el nombre del AppBar público y los componentes gráficos de marca anteriores.
No se habilitaron rutas legacy ni registro público. Los enlaces de los componentes
Logo conservan sus destinos anteriores.

Se eliminaron los antiguos favicons, iconos de instalación y gráficos de plataforma
sin referencias. Los archivos `src/assets/logo*.png` pertenecen a un restaurante
histórico y son referenciados por reportes legacy no expuestos en la navegación
F0–F10. No se sustituyeron por la marca del software: hacerlo confundiría la identidad
del restaurante con la plataforma y alteraría presentación de documentos fuera
del alcance. Los documentos internos vigentes mantienen sus snapshots intactos.

## Validación

- pnpm typecheck: correcto.
- pnpm build: correcto; advertencias heredadas de dependencias/chunks grandes.
- ESLint sobre TS/TSX modificados: los únicos errores son tres variables sin uso
  preexistentes en `src/pages/Public/components/AppBar.component.tsx`:
  anchorElUser, handleOpenUserMenu y handleCloseUserMenu. Confirmados ejecutando
  ESLint sobre el archivo del commit base. Sin errores nuevos en el resto.
- Búsqueda insensible a mayúsculas de las dos marcas antiguas solicitadas: cero
  coincidencias en fuentes, activos públicos y metadata.
- Chromium con backend real y usuario demo existente: 10 comprobaciones visuales
  de login/header/sidebar en 390×844, 900×1100, 1440×900 y 1920×1080. Sin excepciones
  JavaScript ni overflow global. Proporciones del PNG y carga del favicon HTTP 200
  comprobadas. Título Point Restaurant y nombre Restaurante Demostración F10
  coexistiendo correctamente.
- No se cambió backend, API, autenticación, permisos, sockets, idempotencia,
  cálculos financieros ni datos operativos.

## Archivos modificados, añadidos o retirados

- `.env.example`
- `BRANDING.md`
- `index.html`
- `logo2.png`
- `public/android-chrome-192x192.png`
- `public/android-chrome-512x512.png`
- `public/apple-touch-icon.png`
- `public/branding/point-restaurant-logo.png`
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/favicon.ico`
- `public/logo-icon.png`
- `public/static/images/logo/logo.png`
- `public/static/images/overview/tokyo-logo.png`
- `src/components/branding/SoftwareBrand.tsx`
- `src/components/branding/software-brand.css`
- `src/pages/Private/Restaurant/views/NewRestaurant/NewRestaurant.view.tsx`
- `src/pages/Private/components/Logo.component.tsx`
- `src/pages/Private/components/LogoSign.tsx`
- `src/pages/Private/layouts/SidebarLayout/Sidebar/Sidebar.component.tsx`
- `src/pages/Public/Auth/Login/Login.page.tsx`
- `src/pages/Public/Auth/Signup/Signup.page.tsx`
- `src/pages/Public/components/AppBar.component.tsx`
