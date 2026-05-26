# Arquitectura del Sistema - Backend Docker

## Diagrama General del Sistema

```
┌────────────────────────────────────────────────────────────┐
│                    HOST MACHINE (Windows)                  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Docker Desktop Engine                  │  │
│  │                                                    │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │    Docker Internal Networks (bridge)        │ │  │
│  │  │                                             │ │  │
│  │  │  ┌──────────────┐      ┌──────────────┐   │ │  │
│  │  │  │   MySQL 8.0  │      │ Backend API  │   │ │  │
│  │  │  │              │◄────►│ (Rust/Node)  │   │ │  │
│  │  │  │   :3306      │      │   :8080/81   │   │ │  │
│  │  │  └──────────────┘      └──────────────┘   │ │  │
│  │  │         ▲                      ▲           │ │  │
│  │  │         │                      │           │ │  │
│  │  │    init.sql            Código Fuente      │ │  │
│  │  │    (auto-run)          (mount volume)     │ │  │
│  │  │                                           │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  │                    ▲                         │  │
│  │                    │                         │  │
│  └────────────────────┼─────────────────────────┘  │
│                       │Port Mapping                │
│                  :3306 → 3306                      │
│                  :8080 → 8080                      │
│                                                   │
└───────────────────────┬────────────────────────────┘
                        │
                   ┌────▼─────┐
                   │ Navegador │
                   │ POST/GET  │
                   └───────────┘
```

---

## Flujo de Inicio

```
1. STARTUP PHASE
   ✓ docker-compose up
           │
           ├─► Crear network "app-network"
           │
           ├─► Iniciar MySQL container
           │   ├─► Montar volumen "mysql_data"
           │   ├─► Ejecutar script init.sql (auto)
           │   └─► Esperar healthcheck
           │
           └─► Iniciar Backend container
               ├─► Leer .env (DB_HOST, DB_USER, etc)
               ├─► Conectar a pool MySQL
               ├─► Esperar hasta 10 intentos
               └─► Exponer :8080

2. RUNTIME PHASE
   ✓ Backend está listo
           │
           ├─► Acepta GET /health (sin DB)
           │
           ├─► Acepta GET /db-status (con query SELECT NOW())
           │
           ├─► Acepta GET /items (SELECT * FROM items)
           │
           └─► Acepta POST /items (INSERT nuevo item)

3. SHUTDOWN PHASE
   ✓ docker-compose down
           │
           ├─► Terminar Backend (graceful)
           │
           ├─► Terminar MySQL (sync BD)
           │
           └─► Remover containers/networks
               (volumen persiste en mysql_data/)
```

---

## Componentes Principales

### 1. MySQL Container

```
┌─────────────────────────────────┐
│    MySQL 8.0.35 (container)     │
├─────────────────────────────────┤
│                                 │
│  DB Name: dbapp                │
│  User: root                     │
│  Password: mysecurepassword     │
│                                 │
│  Puerto Interno: :3306         │
│  Puerto Expuesto: :3306        │
│                                 │
│  Volumen: mysql_data/          │
│  (persiste entre restart)      │
│                                 │
│  Script Init:                   │
│  └─► init.sql (auto-ejecuta)   │
│      ├─► CREATE TABLE items    │
│      └─► INSERT datos ejemplo  │
│                                 │
│  Healthcheck:                   │
│  └─► mysqladmin ping           │
│      (cada 5s, max 10 intentos)│
│                                 │
└─────────────────────────────────┘
```

**Tabla `items`:**
```sql
CREATE TABLE items (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Backend Container (Rust + Actix)

```
┌────────────────────────────────────┐
│  Rust + Actix Web Container        │
├────────────────────────────────────┤
│                                    │
│  ENTRYPOINT: ./backend-api        │
│                                    │
│  Código:                           │
│  src/main.rs                      │
│  ├─► main() async                │
│  ├─► Connection Pool             │
│  ├─► Health Handler              │
│  ├─► DB Status Handler           │
│  ├─► Get Items Handler           │
│  └─► Create Item Handler         │
│                                    │
│  Puerto: :8080                    │
│  (expuesto al host :8080)         │
│                                    │
│  Environment:                      │
│  ├─► APP_HOST=0.0.0.0            │
│  ├─► APP_PORT=8080               │
│  ├─► DB_HOST=mysql               │
│  ├─► DB_PORT=3306                │
│  ├─► DB_USER=root                │
│  ├─► DB_PASSWORD=xxx             │
│  └─► DB_NAME=dbapp               │
│                                    │
│  Dependencies:                     │
│  ├─► actix-web 4.4               │
│  ├─► mysql 24.1                  │
│  ├─► tokio 1.35                  │
│  ├─► uuid 1.6                    │
│  └─► dotenv 0.15                 │
│                                    │
│  Logs:                             │
│  ├─► INFO: "✅ DB connection"     │
│  └─► INFO: "🚀 Server running"    │
│                                    │
│  Memory: ~20-35 MB               │
│  CPU: ~12% (bajo carga)          │
│                                    │
└────────────────────────────────────┘
```

### 3. Backend Container (Node + Express)

```
┌────────────────────────────────────┐
│  Node.js + Express Container       │
├────────────────────────────────────┤
│                                    │
│  Runtime: node:20-alpine          │
│  Entrypoint: node index.js        │
│                                    │
│  Código:                           │
│  index.js                         │
│  ├─► require('express')          │
│  ├─► mysql.createPool()          │
│  ├─► app.get('/health')          │
│  ├─► app.get('/db-status')       │
│  ├─► app.get('/items')           │
│  └─► app.post('/items')          │
│                                    │
│  Puerto: :8080 (interno)          │
│  X :8081 (en comparación)         │
│                                    │
│  Environment:                      │
│  Similar a Rust                   │
│  (mismo .env)                     │
│                                    │
│  Dependencies (npm):              │
│  ├─► express                      │
│  ├─► mysql2                       │
│  ├─► uuid                         │
│  ├─► dotenv                       │
│  └─► cors                         │
│                                    │
│  Memory: ~85-120 MB              │
│  CPU: ~40-45% (bajo carga)       │
│                                    │
└────────────────────────────────────┘
```

---

## Flujo de una Solicitud HTTP

### Ejemplo: POST /items (crear item)

```
HTTP CLIENT (tu navegador/curl)
         │
         │ POST http://localhost:8080/items
         │ Content-Type: application/json
         │ {"nombre": "Mi Item"}
         │
         ▼
DOCKER PORT MAPPING
         │
         │ :8080 (host) → :8080 (container)
         │
         ▼
BACKEND ACTIX WEB
         │
         ├─► route matching
         │   └─► POST /items → create_item()
         │
         ├─► parse JSON
         │   └─► {"nombre": "Mi Item"}
         │
         ├─► generate UUID
         │   └─► "550e8400-e29b..."
         │
         ├─► current timestamp
         │   └─► "2024-05-25T10:30:45Z"
         │
         ├─► acquire DB connection
         │   └─► conn = pool.get_conn()
         │
         ├─► prepare SQL
         │   └─► INSERT INTO items VALUES(?, ?, ?)
         │
         ├─► execute with params
         │   └─► (id, nombre, created_at)
         │
         ▼
MYSQL CONTAINER
         │
         ├─► receive INSERT query
         │
         ├─► validate syntax
         │
         ├─► acquire lock on table
         │
         ├─► insert row
         │
         ├─► update indexes
         │
         ├─► commit transaction
         │
         └─► return success
         │
         ▼
BACKEND ACTIX WEB (respuesta)
         │
         ├─► serialize item as JSON
         │
         ├─► set HTTP status 201
         │
         ├─► set Content-Type: application/json
         │
         └─► send response
         │
         ▼
HTTP CLIENT (respuesta)
         │
         └─► {"id": "550e...", "nombre": "Mi Item", ...}
             HTTP/1.1 201 Created
```

---

## Variables de Entorno

### Flujo de Carga

```
.env (archivo en root)
         │
         ├─► DB_USER=root
         ├─► DB_PASSWORD=mysecurepassword
         └─► DB_NAME=dbapp
         │
         ▼
docker-compose.yml
         │
         ├─► "environment:" section
         │   ├─► ${DB_USER}     ← interpolado de .env
         │   ├─► ${DB_PASSWORD} ← interpolado de .env
         │   └─► ${DB_NAME}     ← interpolado de .env
         │
         ▼
Backend Container (proceso)
         │
         ├─► std::env::var() [Rust]
         │   o
         ├─► process.env [Node]
         │
         ▼
Database Connection String
         │
         └─► mysql://root:mysecurepassword@mysql:3306/dbapp
```

### Importancia

```
✅ BUENO (como está ahora):
   Variables en .env
   No hardcodeadas
   Distintas per-environment
   
❌ MALO (lo que evitamos):
   Hardcoded en código
   usuario/contraseña visibles
   Imposible cambiar sin recompilación
   Seguridad de producción comprometida
```

---

## Persistencia de Datos

### Volumen MySQL

```
HOST FILESYSTEM
└── c:\Users\BIG SHOT\Downloads\death2\backend-docker\
    └── (virtual)
        └── mysql_data/          ← Volumen Docker montado
            ├── ibdata1
            ├── ib_logfile0
            ├── mysql/           ← BD sistema
            ├── performance/
            └── dbapp/           ← Nuestra BD
                ├── db.opt
                ├── items.frm
                ├── items.ibd    ← Datos persistidos
                └── items.MYI
```

### Lifecycle

```
docker-compose up
         │
         └─► Crea volumen "mysql_data" si no existe
             Monta en /var/lib/mysql del container
         │
         ▼
MySQL escribes datos
         │
         └─► Datos se escriben en el volumen
             (persisten en host)

docker-compose down
         │
         └─► Container se detiene
             Datos quedan en host

docker-compose down -v
         │
         └─► Borra container Y volumen
             ⚠️ PIERDE DATOS
```

---

## Networking (Docker)

### Bridge Network

```
┌────────────────────────────────────┐
│     Docker Internal network        │
│     "app-network" (bridge)         │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────┐  ┌────────────┐ │
│  │  mysql:3306  │  │ backend:.. │ │
│  │              │  │            │ │
│  │  hostname:   │  │ hostname:  │ │
│  │  "mysql"     │  │ "backend-" │ │
│  │  (DNS)       │  │ "rust"     │ │
│  │              │  │            │ │
│  └──────────────┘  └────────────┘ │
│         ▲                  │       │
│         │                  │       │
│         └──────────────────┘       │
│         (intra-container comms)    │
│                                    │
└────────────────────────────────────┘
         ▲
         │ Host port mapping
         │ (expone seleccionados)
    HOST NETWORK
    localhost:3306 → 3306 (mysql)
    localhost:8080 → 8080 (backend)
```

### DNS Resolution

```
Desde backend al conectar a MySQL:

backend                  MySQL
  │                        │
  └─► connect("mysql", 3306)
      │
      └─► Docker DNS (127.0.0.11:53)
          │
          └─► busca "mysql" en la red
              │
              └─► retorna IP interno (172.18.0.2)
              │
              └─► conecta directo al container
```

---

## Seguridad a Nivel Arquitectura

```
┌─────────────────────────────────────┐
│   SECURITY LAYERS                   │
├─────────────────────────────────────┤
│                                     │
│  Layer 1: Red isolation             │
│  └─► MySQL no expone al host       │
│      (solo :3306 mapeado)          │
│                                     │
│  Layer 2: No hardcoding             │
│  └─► Credenciales en .env          │
│      (nunca en código)              │
│                                     │
│  Layer 3: Connection pooling        │
│  └─► Reutiliza conexiones          │
│      (menos overhead, más rápido)   │
│                                     │
│  Layer 4: Prepared statements       │
│  └─► Previene SQL injection         │
│      (ambos stacks lo hacen)        │
│                                     │
│  Layer 5: Type safety (Rust)        │
│  └─► Memory safety en compile time │
│      (Rust solo)                    │
│                                     │
│  Layer 6: CORS (Node)               │
│  └─► Cross-origin requests          │
│      (Express incluye cors pkg)     │
│                                     │
└─────────────────────────────────────┘
```

---

## Monitoreo y Debugging

### Ver Logs

```bash
# Backend
docker logs backend-rust -f --tail=50

# MySQL
docker logs db-mysql -f --tail=20

# Todos
docker-compose logs -f
```

### Inspeccionar Procesos

```bash
# Ver containers corriendo
docker ps

# Ver estadísticas
docker stats

# Ver red interna
docker network inspect app-network

# SSH al container
docker exec -it backend-rust /bin/bash
```

### Verificar Conectividad

```bash
# Desde el backend al MySQL
docker exec backend-rust \
  /bin/bash -c "curl mysql:3306"

# Desde host al backend
curl http://localhost:8080/health
```

---

## Error Handling

```
┌─────────────────────────────────────┐
│   Error Scenarios                   │
├─────────────────────────────────────┤
│                                     │
│  1. MySQL no inicia               │
│     └─► Backend retry 10 veces    │
│         └─► Fail con error        │
│                                     │
│  2. Conexión BD perdida           │
│     └─► Endpoint /db-status       │
│         └─► Retorna "connection:false"│
│                                     │
│  3. Query error                    │
│     └─► Log error                 │
│         └─► Retorna 500           │
│                                     │
│  4. Data validation               │
│     └─► Ambos stacks validan     │
│         └─► Retornan 400 si error│
│                                     │
└─────────────────────────────────────┘
```

---

## Resumen Técnico

| Componente | Versión | Puerto | Rol |
|-----------|---------|--------|-----|
| MySQL | 8.0.35 | 3306 | Base de datos |
| Rust | 1.75 | - | Runtime compilador |
| Actix Web | 4.4 | 8080 | Framework web |
| Node.js | 20 | 8081 | Runtime JS |
| Express | 4.18 | 8081 | Framework web |
| Docker | Latest | - | Contenerización |

---

**Documento**: Arquitectura Sistema
**Versión**: 1.0
**Rango**: Interno/Educativo
**Estado**: Completo ✅
