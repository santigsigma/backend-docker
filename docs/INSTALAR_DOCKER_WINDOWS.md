╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              🚀 CÓMO INSTALAR DOCKER - GUÍA PASO A PASO                   ║
║                                                                            ║
║                    Sistema: Windows 11 / Windows 10                        ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════
⚠️  SITUACIÓN ACTUAL
═══════════════════════════════════════════════════════════════════════════

✗ Docker Desktop NO está instalado en tu Windows
✓ Node.js v24.15.0 SÍ está instalado
✓ npm SÍ está disponible

Opciones:
  A) Instalar Docker Desktop y ejecutar el proyecto completo (RECOMENDADO)
  B) Ejecutar en desarrollo local mientras instalas Docker

═══════════════════════════════════════════════════════════════════════════
📥 OPCIÓN A: INSTALAR DOCKER DESKTOP (Recomendado)
═══════════════════════════════════════════════════════════════════════════

PASO 1: Descargar Docker Desktop
   • Ir a: https://www.docker.com/products/docker-desktop
   • Click en "Download for Windows"
   • Se descargará: Docker Desktop Installer.exe

PASO 2: Instalar Docker Desktop
   • Doble-click en Docker Desktop Installer.exe
   • Seleccionar:
     ✓ Install required WSL 2 components
     ✓ Add Docker to PATH
     ✓ Add shortcut to desktop (opcional)
   • Click INSTALL
   • Esperar a que termine (2-5 minutos)

PASO 3: Reiniciar Windows
   • Click CLOSE or RESTART ahora
   • Si pide reiniciar, REINICIAR
   • Windows se reinicia y Docker se configura (1-2 minutos)

PASO 4: Verificar Docker instalado
   • Abrir PowerShell como Administrator
   • Escribir:
     docker --version
   • Debe mostrar: Docker version 24.x.x o mayor

PASO 5: Esperar a que Docker inicie
   • Docker Desktop debe aparecer corriendo en la bandeja
   • Ver ícono Docker (ballena) en system tray
   • Esperar hasta que aparezca "Docker is running" en tooltip

PASO 6: Ejecutar el proyecto
   • Abrir PowerShell
   • cd "c:\Users\BIG SHOT\Downloads\death2\backend-docker"
   • docker-compose -f docker-compose.node.yml up --build
   • Esperar a ver: "🚀 Server running at http://0.0.0.0:8080"

PASO 7: Probar en OTRA ventana PowerShell
   • Abrir otra PowerShell
   • .\scripts\test-api.ps1
   • Ver resultados de tests

═══════════════════════════════════════════════════════════════════════════
💻 OPCIÓN B: EJECUTAR EN DESARROLLO (Sin Docker)
═══════════════════════════════════════════════════════════════════════════

Mientras instalas Docker, puedes ejecutar el proyecto en dev mode.

REQUISITOS:
   ✓ Node.js 20+ (TIENES v24.15.0 ✓)
   ✓ npm (incluido con Node)
   ✗ MySQL 8.0 (necesitarías instalar)

LIMITACIÓN:
   • Los endpoints /health y /db-status funcionarán
   • El endpoint /db-status dirá "no DB" (porque no hay MySQL)
   • Es solo para verificar que el código Node.js funciona

PASO 1: Instalar dependencias
   cd c:\Users\BIG SHOT\Downloads\death2\backend-docker\nodejs-express
   npm install

PASO 2: Verificar que se instalaron
   npm list
   (Debe mostrar express, mysql2, uuid, etc.)

PASO 3: Ejecutar servidor
   node index.js

   Debe mostrar:
   🚀 Server running at http://0.0.0.0:8080
   ⚠️  Database connection error (es esperado, sin MySQL)

PASO 4: Probar en OTRA ventana PowerShell
   curl http://localhost:8080/health
   
   Respuesta esperada:
   {"status":"API is running","timestamp":"2024-05-25T..."}

   Esto demuestra que Node.js funciona ✓

═══════════════════════════════════════════════════════════════════════════
❓ PREGUNTAS FRECUENTES SOBRE INSTALACIÓN
═══════════════════════════════════════════════════════════════════════════

P: ¿Docker Desktop pesa mucho?
R: Sí, ~900 MB, pero necesario para ejecutar containers.

P: ¿Necesito WSL2?
R: Sí, Docker Desktop requiere WSL2. Se instala automáticamente.

P: ¿Ralentiza Windows?
R: Mínimamente. Docker Desktop usa WSL2 eficientemente.

P: ¿Puedo desinstalar después?
R: Sí. Control Panel → Programs → Uninstall.

P: ¿Mi antivirus puede bloquearlo?
R: Posiblemente. Añade Docker a exclusiones del antivirus.

P: ¿Si tengo error en instalación?
R: Reinicia Windows y reintenta. Si persiste, desinstala y reinstala.

P: ¿Cuánto tarda en instalarse?
R: 5-10 minutos total. Reinicio de Windows incluido.

═══════════════════════════════════════════════════════════════════════════
🔧 ALTERNATIVA: INSTALAR DOCKER EN LINUX/WSL
═══════════════════════════════════════════════════════════════════════════

Si prefieres usar Linux (dentro de Windows):

OPCIÓN: WSL2 + Docker en Ubuntu
   1. Instalar WSL2 (dentro de Windows)
   2. Instalar Ubuntu 22.04 desde Microsoft Store
   3. Instalar Docker en Ubuntu:
      sudo apt-get update
      sudo apt-get install docker.io docker-compose
   4. Ejecutar proyecto desde WSL2 terminal

VENTAJA: Docker nativo, sin virtualización extra
DESVENTAJA: Curva aprendizaje WSL2

═══════════════════════════════════════════════════════════════════════════
✅ CHECKLIST PRE-INSTALACIÓN
═══════════════════════════════════════════════════════════════════════════

Antes de instalar Docker Desktop, verifica:

  ☐ Windows 10 versión 1909+ o Windows 11
  ☐ Hyper-V habilitado (versión Pro/Enterprise)
  ☐ 4 GB RAM mínimo (8 GB recomendado)
  ☐ 10 GB espacio en disco
  ☐ Conexión a internet (para descargar 900 MB)
  ☐ Usuario = Administrator (para instalar)

Si tienes Windows Home:
  ☐ Necesitas WSL2 manualmente
  ☐ O cambiar a Pro/Enterprise
  ☐ O usar Docker Toolbox (legacy)

═══════════════════════════════════════════════════════════════════════════
🐳 VERIFICAR QUE DOCKER FUNCIONA DESPUÉS INSTALAR
═══════════════════════════════════════════════════════════════════════════

1. Docker Desktop corriendo:
   • Ícono ballena en system tray
   • Tooltip dice "Docker is running"

2. Verificar desde PowerShell:
   docker --version
   docker run hello-world
   
   Debe mostrar: Hello from Docker!

3. Verificar docker-compose:
   docker compose version
   
   Debe mostrar: Docker Compose version 2.x.x

4. Listar containers:
   docker ps
   
   Debe estar vacío o mostrar containers corriendo

Si todo está ✓ = DOCKER READY

═══════════════════════════════════════════════════════════════════════════
🚀 DESPUÉS DE INSTALAR DOCKER: PRÓXIMOS PASOS
═══════════════════════════════════════════════════════════════════════════

1. Esperar a que Docker Desktop termine de iniciar (1-2 min)

2. Abrir PowerShell como Administrator

3. cd "c:\Users\BIG SHOT\Downloads\death2\backend-docker"

4. EJECUTAR EL PROYECTO:
   
   docker-compose -f docker-compose.node.yml up --build
   
   Primera vez tarda 2-5 minutos

5. ESPERAR A VER:
   
   "🚀 Server running at http://0.0.0.0:8080"

6. EN OTRA POWERSHELL, PROBAR:
   
   curl http://localhost:8080/health
   
   Respuesta:
   {"status":"API is running","timestamp":"..."}

═══════════════════════════════════════════════════════════════════════════
⏱️  TIMING ESTIMADO
═══════════════════════════════════════════════════════════════════════════

Descarga Docker:         5-10 minutos (depende internet)
Instalar Docker:         5-10 minutos
Reinicio Windows:        2-3 minutos
Boot Docker Desktop:     1-2 minutos
Primera ejecución:       2-5 minutos
Test endpoints:          1 minuto
─────────────────
TOTAL:                   20-40 minutos (primera vez)

Siguientes ejecuciones:  15-30 segundos

═══════════════════════════════════════════════════════════════════════════
💡 TIPS & TRICKS
═══════════════════════════════════════════════════════════════════════════

Ejecutar en background:
  docker-compose -f docker-compose.node.yml up -d
  (No verás logs, pero container corre)

Ver logs después:
  docker logs backend-node

Parar containers:
  docker-compose down

Reset completo:
  docker-compose down -v
  (Borra datos, ten cuidado!)

Ver containers corriendo:
  docker ps

Entrar a container bash:
  docker exec -it backend-node sh

Ver recursos Docker:
  docker stats

═══════════════════════════════════════════════════════════════════════════
📞 AYUDA - Si hay errores
═══════════════════════════════════════════════════════════════════════════

Error: "Docker daemon is not running"
  → Abrir Docker Desktop desde menú Start
  → Esperar 1-2 minutos a que inicie

Error: "WSL 2 installation is incomplete"
  → Descargar WSL2 Kernel:https://aka.ms/wsl2kernel
  → Instalar y reiniciar

Error: "Port 3306 already in use"
  → docker ps | grep mysql
  → docker stop <container_id>
  → Reintentar

Error: "Cannot connect to image"
  → docker pull mysql:8.0
  → docker pull node:20-alpine
  → Reintentar

Error: "Permission denied"
  → Reiniciar Docker Desktop
  → Reiniciar PowerShell como Administrator

═══════════════════════════════════════════════════════════════════════════

🎯 SIGUIENTE PASO:

1. Si ya tienes Docker:
   → Ve a: WINDOWS_POWERSHELL_COMANDOS.txt

2. Si no tienes Docker:
   → Sigue OPCIÓN A arriba (20-40 minutos)
   → Luego vuelve a: WINDOWS_POWERSHELL_COMANDOS.txt

═══════════════════════════════════════════════════════════════════════════
