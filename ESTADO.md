# Estado — Ciclo C, Fase 8 (2026-10-14)

Rama `codex/phase-8` desde F6–7 aprobado `71e11459a2d5a698a9fe63b07da3c8644a0aa90c`. Sin integración a main/Gemini; Barrera A abierta y revisión del Arquitecto pendiente. No Fase 9 ni release.

Implementado frontend funcional de para llevar, delivery propio/courier externo, contacto/destino, estados, asignación de courier, custodia de efectivo, consumo de personal y cortesías. Reutiliza Atención, Cocina y Finanzas, sin rediseño general. Decisión PO: nuevos consumos que requieran otro viaje usan otra atención.

Contratos, operación, límites y handoff: [PHASE8.md](PHASE8.md). Backend requiere la migración F8 (14 acumuladas) exclusivamente en restaurante_app.

Verificado: typecheck/build, lint focalizado de archivos modificados; smoke Chromium F8 escritorio/móvil y regresión financiera F6–7 (pago efectivo/vuelto, Yape manual, rendición y persistencia al recargar). Sin excepciones JavaScript nuevas. Diagnósticos heredados: auth-renew401 previo a login, cash-register/actives404, fuentes/imagen externas inaccesibles en Cloud. No se corrigió masivamente lint histórico.

Pruebas HTTP y browser deben ejecutarse en secuencia, por la comprobación histórica global de usuarios en la suite de Pedidos. Pruebas reproducibles en tests/phase8.browser.cjs y tests/phase67.browser.cjs; no validan dispositivos/conexiones móviles físicos distintos.
