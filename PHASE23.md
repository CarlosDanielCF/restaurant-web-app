# Fases 2 y 3 — frontend operativo

Los requisitos definitivos prevalecen sobre pantallas heredadas. Ruta inicial `/attention`, con pestañas Cuentas y mesas, Reservas, Menú compuesto y Carta/disponibilidad. Cocina solo dispone de las dos últimas; Mozo consulta carta/menú y opera cuentas/reservas; Dueño/Administrador administran carta. La autorización efectiva se comprueba también en backend.

- Apertura TABLE con una o varias mesas, o TAKE_AWAY sin ocupar mesas; responsable elegido entre mozos activos. Selección de cuenta, consumo con presentaciones/modificadores/porciones explícitas, menú compuesto, notas por plato, unión/traslado, transferencia, cancelación de borrador motivada, cierre e historial.
- Reservas sin mesa al crear/editar; mesa y responsable solo en llegada. Horarios de restaurante. Cancelación con motivo.
- Menú compuesto con precio conjunto/componentes/opciones; no sustituye carta permanente. Disponibilidad y porciones por opción independientes.
- Carta con clasificación comida/bebida, precios, combos, cortesías, extras y acompañamientos; disponibilidad/porciones por rol. Políticas de consumo de porción independientes del precio.
- Formulario existente de alta corregido contra DTO real: variantes, clasificación, área opcional y validación. Edición envía campos explícitos y versión. Categoría con etiqueta accesible.
- Eventos `catalog.changed`, `attention.changed`, `reservation.changed` invalidan consultas; reconexión refresca; error/desconexión visible. Comandos nuevos conservan clave para reintentar y evitan doble toque. Conflictos de versión requieren revisar datos, sin sobrescritura silenciosa.
- Accesos heredados para crear pedidos/mesas redirigen a cuentas. Consulta y edición histórica permanecen; no se convierten pedidos ambiguos. Navegación móvil temporal con botón accesible y cierre al tocar fuera, sin rediseño general.

## Despliegue y límites

Desplegar conjuntamente con backend de Fases 2/3 y sus dos migraciones aditivas en `restaurante_app`. Variables API/WebSocket existentes sin cambios. Contratos detallados y estado en `restaurant-backend/docs/PHASES-2-3.md` y `ESTADO.md`.

Borradores no descuentan stock. No envío definitivo a cocina, cobros, delivery ni fases financieras nuevas. Cierre con saldo se rechaza salvo deuda ya registrada suficiente; no simula pago. Menú configura una opción elegida por componente. Revisar clasificación FOOD inicial de productos históricos; no se adivinan bebidas por nombre.

Verificación: build TypeScript/Vite, lint focalizado nuevo, Chromium con formulario real de producto, apertura/consumo, reserva/llegada, menú compuesto y carta/disponibilidad; escritorio y celular. Pruebas HTTP, seguridad y concurrencia están en backend. Advertencias históricas de bundle/dependencias y deuda global de lint se mantienen fuera del alcance.
