# Desarrollo local en Windows — Fase 10

## Diagnóstico de la pantalla blanca

Evidencia recibida del equipo Windows: `npm run dev` en main 6998c74 mostró **Port 3030 is in use, trying another one...** y anunció **http://localhost:3031/**. Luego se abrió 3030. Por tanto, esa pestaña no estaba conectada a la instancia recién iniciada: otro proceso ya atendía ese puerto. No se registró su PID ni una URL individual de los módulos pendientes; no es posible identificar retrospectivamente ese proceso ni afirmar un deadlock específico de Vite. El aviso de throttling de pestaña en segundo plano puede prolongar la espera; no prueba una excepción React ni un fallo del backend.

Además, se reprodujo una carga inicial innecesaria: AppRouter importaba SetupRestaurant de forma estática; este importaba el router privado completo. PublicRouter también importaba todas sus pantallas de forma anticipada. Medición de red con Chromium, sin sesión, en Cloud: **487 módulos /src/, 383 privados** antes; **87 módulos, 1 privado** después de separar las importaciones mediante React.lazy. Estos son conteos del grafo solicitado, no un benchmark de Windows ni de caché fría. En Cloud no se reprodujo un bloqueo indefinido.

Correcciones:

- `server.strictPort: true`: un 3030 ocupado es ahora un error explícito; Vite no cambia a 3031 silenciosamente.
- Carga diferida de configuración del restaurante y pantallas públicas no necesarias para login, sin cambiar rutas ni permisos.
- HTML inicial visible antes de ejecutar React. Si los módulos tardan más de 20 segundos, informa cómo revisar la terminal/puerto; no reenvía operaciones ni recarga automáticamente.
- Sin fuentes Google remotas bloqueando la carga de estilos: se utiliza Inter si está disponible localmente, con fallback sans-serif.
- `pnpm dev:reset` reconstruye únicamente la caché de optimización Vite. No borra datos de negocio, almacenamiento de operaciones pendientes ni base de datos.

## Requisitos y gestores

Frontend: **pnpm 8.15.0**, indicado por packageManager y pnpm-lock.yaml. `.npmrc` contiene opciones propias de pnpm. Los avisos de npm sobre shamefully-hoist/auto-install-peers/node-linker no son por sí solos la causa del bloqueo: npm run puede ejecutar un script existente, pero instalar dependencias mezclando gestores pierde reproducibilidad. No crear package-lock.json ni usar npm install en el frontend.

Backend: npm y su package-lock.json. MySQL con base exclusiva **restaurante_app**. Node.js LTS compatible (22 LTS recomendado para Windows); las verificaciones Cloud se ejecutaron con Node 24. No se ejecutó Windows nativo en este entorno.

En PowerShell, instalar pnpm si no está disponible:

```powershell
npm install --global pnpm@8.15.0
pnpm --version
node --version
```

Si Corepack ya está configurado, puede usarse `corepack pnpm` respetando packageManager, sin reinstalar pnpm globalmente.

## Una instancia por puerto

Antes de arrancar, comprobar quién escucha:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3030,5000 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

Para inspeccionar un PID concreto de esa salida:

```powershell
$restaurantProcessId = 12345 # Sustituir por el PID encontrado
Get-CimInstance Win32_Process -Filter "ProcessId=$restaurantProcessId" |
  Select-Object ProcessId,ParentProcessId,ExecutablePath,CommandLine
```

Cerrar preferentemente con Ctrl+C en su terminal original. Solo después de identificar que es una instancia obsoleta de este proyecto, puede cerrarse su árbol con `taskkill /PID $restaurantProcessId /T /F`. No matar todos los procesos node.exe: pueden pertenecer a otras aplicaciones. No abrir varias terminales Nest watch/Vite. Si 3030 sigue ocupado, resolver el proceso propietario; no abrir otro puerto por intuición.

## Backend (terminal 1)

```powershell
cd C:\Users\Carlos\restaurant-backend
npm ci
# Solo si no existe .env, copiar .env.example y editar credenciales reales.
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run migration:run
npm run start:dev
```

Antes de ejecutar migraciones, revisar .env: `DB_DATABASE=restaurante_app`, credenciales MySQL locales, `PORT=5000`, secreto JWT propio y `FRONTEND_ORIGIN=http://localhost:3030,http://127.0.0.1:3030`. No usar setup:local ni seed para arrancar una instalación existente. No recrear la base. No acceder a tienda.

Desde otra terminal, `Invoke-RestMethod http://localhost:5000/api/health` debe devolver status ok.

## Frontend (terminal 2)

```powershell
cd C:\Users\Carlos\restaurant-web-app
pnpm install --frozen-lockfile
# Crear/editar .env.local sin sobreescribir configuración existente.
pnpm dev
```

Contenido local requerido (variables públicas del navegador, nunca secretos):

```dotenv
VITE_APP_NAME=Restaurante
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

Abrir **la URL que anuncia la terminal**, normalmente http://localhost:3030. Mantener la pestaña activa durante el primer arranque. Reiniciar Vite después de cambiar variables. El sufijo `/api` pertenece a HTTP, no a Socket.IO.

Si se mezclaron gestores anteriormente: detener Vite, eliminar solo node_modules del frontend y reinstalar con `pnpm install --frozen-lockfile`. No borrar pnpm-lock.yaml, .env.local, sessionStorage ni datos del navegador para resolver la identidad de operaciones pendientes.

Si tras una actualización hay optimización obsoleta, detener Vite y ejecutar `pnpm dev:reset` una vez. Inspeccionar Network y terminal: registrar URL exacta, estado, hora y PID si vuelve a ocurrir. No asumir que un 0 B pendiente es un error de API.

## Verificación

```powershell
pnpm typecheck
pnpm build
# Vista del build; no es el servidor de desarrollo ni un despliegue productivo.
pnpm preview
```

Preview usa 8080; si se prueba contra el backend, añadir explícitamente ese origen local a FRONTEND_ORIGIN y reiniciar backend. No cambiar DTO/endpoints para resolver CORS. Dejar los servidores dev en una única instancia y detenerlos con Ctrl+C al terminar.

## Candidato final F10

El usuario validó backend/frontend Windows y acceso al sistema. Este cierre conserva pnpm, 3030 estricto y login diferido. Para datos de demostración utilizar **el nuevo seed del backend** (`npm run seed:demo`), no ejecutar seeds históricos ni importar SQL sobre una base con operaciones. Consultar `restaurant-backend/WINDOWS.md` y README para DEMO_PASSWORD, cuatro roles y 24 mesas.

Migraciones: 15, sin nuevas en este cierre. SMTP CONFIGURADO: NO; pendiente proveedor/credenciales. La operación normal y login siguen disponibles. Backup/restore: `restaurant-backend/docs/BACKUP-RECOVERY.md`; ensayar únicamente en un servidor aislado con nombre restaurante_app. Nunca reutilizar un servidor/base ajena.
