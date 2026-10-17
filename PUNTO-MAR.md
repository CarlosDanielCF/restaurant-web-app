# Punto Mar — frontend de presentación

Software: **Point Restaurant**. Restaurante configurado: **Punto Mar**, nombre comercial **Punto Mar Restaurante & Cevichería**. No hay nombres de cliente hardcodeados en componentes genéricos.

## Cambios

- Carta muestra el nombre configurado del restaurante.
- Categorías táctiles con scroll horizontal en móvil, sin overflow global.
- Producto con varias presentaciones simples: panel breve con opción/precio; acceso a personalización completa para observaciones/cantidades. Reutiliza endpoint, versión e idempotencia existentes.
- Producto de cortesía se identifica como Cortesía; variantes muestran precio Desde.
- Logo del restaurante en sidebar usa contain, sin recortar ni sustituir el de Point Restaurant.
- Nombre comercial opcional y editable en configuración, separado del nombre breve. Contrato aditivo backend `tradeName` (máximo 160).
- Se conserva catálogo con fotos configuradas. Sin fotografías verificadas, placeholder oficial; no imágenes falsas/IA ni hotlinks.

## Datos y ejecución

Seed backend `npm run seed:punto-mar` con NODE_ENV=development y PUNTO_MAR_PASSWORD privada (mínimo 12). Requiere migraciones backend actuales (17). Documentación completa, precios de 62 productos, 11 categorías, presentaciones, fuentes y pendientes en `restaurant-backend/PUNTO-MAR.md`.

Cuentas: punto_mar_owner, punto_mar_admin, punto_mar_waiter, punto_mar_cook. Cada cuenta tiene Punto Mar seleccionado y roles reales. No se modifican credenciales ni datos del demo F10. No se agregan ventas ficticias ni frecuentes arbitrarios.

## Validación real

`tests/punto-mar.browser.cjs` usa el restaurante de presentación y sus usuarios; crea un consumo de prueba, luego lo cancela con motivo y cierra la atención por API, conservando auditoría (no borra historial). Nunca cobra dinero.

```
# PUNTO_MAR_PASSWORD por variable privada; PLAYWRIGHT_MODULE si el runtime lo requiere.
node tests/punto-mar.browser.cjs
```

Comprueba: 62 productos/precios completos vs manifiesto, 11 categorías, 9 productos con dos presentaciones, 4 cortesías, logo WebP privado y aislamiento respecto al demo F10, búsqueda chau, mesa→catálogo, presentación B, botella directa, maracuyá PRODUCTION, cortesía, total esperado S/77, actualización cocina sin refresh y responsive 390×844 / 900×1100 / 1440×900 / 1920×1080. Cero excepciones JS en ejecución final. La primera ejecución encontró un selector de login incorrecto del test; se corrigió y se ejecutó de nuevo completo.

No se utilizaron fotografías de internet: Wikimedia/Pexels/Unsplash/Flickr bloqueados por proxy HTTP 403, sin posibilidad de verificar licencias. Los 62 productos requieren fotografía propia/autorizada. Los nombres A/B de presentaciones siguen pendientes de confirmación comercial. Los precios/configuraciones son editables desde administración; no se convierten en reglas del frontend.

Frecuentes: evaluado pero no activado por falta de ventas reales suficientes. Documentos históricos, pagos, roles, sockets e idempotencia conservan contratos anteriores. No se afirma validación de infraestructura productiva ni impresora física.

NO PUSH / NO MERGE. Revisar frontend y backend juntos.

## Resultados finales

Backend: build/typecheck/lint correctos; 13 suites, 98 unitarias; 8 suites, 144 HTTP/MySQL (incluye nuevo test nombre comercial, validación, versiones y aislamiento). Primer intento global tuvo interferencia de otra suite concurrente en snapshot de usuarios; se repitió aislado y pasó. El nuevo test de nombre comercial comprueba la lectura persistida por GET, no asume la forma de la respuesta de PATCH.

Frontend: typecheck/build/lint focalizado correctos; 9 tests (6 idempotencia + 3 dinero); navegador Punto Mar completo, 0 excepciones JS. Advertencias heredadas de bundle/dependencias y configuración React ESLint conservadas. Primera ejecución de navegador falló por selector de login del test; corregido y repetido con éxito.

Migración 17 aplicada y segunda ejecución sin pendientes. Seed repetido: cero duplicados. Sin cambios en main, sin push ni merge.

## Archivos del ciclo

- `ESTADO.md`
- `PUNTO-MAR.md`
- `src/pages/Private/Common/models/restaurant.model.ts`
- `src/pages/Private/Operations/AttentionWorkspace.tsx`
- `src/pages/Private/Operations/ServiceCatalog.tsx`
- `src/pages/Private/Reports/dto/update-restaurant.dto.ts`
- `src/pages/Private/Reports/models/restaurant.model.ts`
- `src/pages/Private/Restaurant/Restaurant.page.tsx`
- `src/pages/Private/Restaurant/dto/create-restaurant.dto.ts`
- `src/pages/Private/layouts/SidebarLayout/Sidebar/Sidebar.component.tsx`
- `src/styles/point-workspaces.css`
- `tests/punto-mar.browser.cjs`
