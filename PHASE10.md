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
