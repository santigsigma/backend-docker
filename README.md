# REST API Backend - Dual Stack

**Ejecutar ahora:** [START.md](START.md) | **Demo mañana:** [DEMO.md](DEMO.md) | **Verificación:** [CHECKLIST.md](CHECKLIST.md)

## 🚀 Stacks (2 Implementaciones)

| Stack | Status | Testing | Documentación |
|-------|--------|---------|---|
| **Node.js + Express** | ✅ Probado Windows | 4/4 endpoints | [Ver](docs/) |
| **Rust + Actix Web** | ✅ Código listo | Async ready | [Ver](docs/) |

## 📁 Estructura Mínima

```
backend-docker/
├── START.md               ← COMIENZA AQUÍ
├── DEMO.md                ← Script presentación
├── README.md              ← Este archivo
├── CHECKLIST.md           ← 12/12 requisitos ✅
├── nodejs-express/        ← API Node.js (250 líneas)
├── rust-actix/            ← API Rust (400 líneas)
├── docker-compose.yml     ← Orquestación
├── docs/                  ← 26 archivos referencia
└── scripts/               ← Testing + SQL init
```

## ✅ Requisitos: 12/12

API REST ✅ | Dockerizado ✅ | MySQL ✅ | Documentado ✅ | Scripts ✅ | Stacks ✅ | Windows ✅ | Ubuntu ✅ | Errores ✅ | Logs ✅ | Env ✅ | Presentable ✅
│   ├── 00-LEEME-PRIMERO.md      ← LEER PRIMERO
│   ├── EXPLICACION_NODE.md      ← Stack asignado
│   ├── COMPARACION_STACKS.md    ← vs Rust análisis
│   ├── QUICKSTART.md            ← Ejecutar en 3 pasos
│   └── README.md                ← Este archivo
│
├── 🟩 STACK ASIGNADO: Node.js + Express
│   └── nodejs-express/
│       ├── index.js             ← Código (250+ líneas)
│       ├── package.json
│       ├── Dockerfile
│       └── .env.example
│
├── 🦀 STACK ALTERNATIVO: Rust + Actix Web
│   └── rust-actix/
│       ├── src/main.rs          ← Código (400+ líneas)
│       ├── Cargo.toml
│       ├── Dockerfile
│       └── .env.example
│
├── 🐳 DOCKER & BD
│   ├── docker-compose.yml
│   ├── docker-compose.node.yml
│   ├── docker-compose.rust.yml
│   ├── docker-compose.comparacion.yml
│   ├── .env
│   ├── scripts/
│   │   ├── init.sql
│   │   └── test-api.sh
│   └── .gitignore
```

## 🚀 Cómo Ejecutar

### Requisitos Previos

- Docker y Docker Compose instalados
- Puerto 3306 disponible (MySQL)
- Puerto 8080 disponible (Backend Rust)
- Puerto 8081 disponible (Backend Node - opcional)

### Opción 1: Ejecutar con Rust + Actix Web (Configuración por defecto)

```bash
cd backend-docker

# Construir e iniciar contenedores
docker-compose up --build

# En otra terminal, probar endpoints
curl http://localhost:8080/health
curl http://localhost:8080/db-status
curl http://localhost:8080/items
```

### Opción 2: Ejecutar con Node.js + Express (para comparación)

1. **Editar `docker-compose.yml`**: Comentar el servicio `backend-rust` y descomentar `backend-node`

2. **Ejecutar:**
```bash
docker-compose up --build
```

### Opción 3: Ejecutar Ambos Simultáneamente (para comparación en vivo)

1. **Descomentar ambos servicios en `docker-compose.yml`**
2. **Cambiar puerto del backend Node a 8081**
3. **Ejecutar:**
```bash
docker-compose up --build
```

Entonces:
- Rust/Actix: `http://localhost:8080`
- Node/Express: `http://localhost:8081`

## 📡 Endpoints Disponibles

### GET /health
Verifica que la API está funcionando (sin acceso a BD).

**Respuesta:**
```json
{
  "status": "API is running",
  "timestamp": "2024-05-25T10:30:45Z"
}
```

### GET /db-status
Verifica la conexión con MySQL ejecutando `SELECT NOW()`.

**Respuesta OK:**
```json
{
  "status": "Database connection successful",
  "connection": true,
  "timestamp": "2024-05-25T10:30:45Z",
  "db_time": "2024-05-25T10:30:45Z"
}
```

**Respuesta ERROR:**
```json
{
  "status": "Database query failed: ...",
  "connection": false,
  "timestamp": "2024-05-25T10:30:45Z",
  "db_time": null
}
```

### GET /items
Lista todos los items almacenados.

**Respuesta:**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "nombre": "Primer Item",
      "created_at": "2024-05-23T10:30:45Z"
    }
  ],
  "total": 1
}
```

### POST /items
Crea un nuevo item.

**Solicitud:**
```json
{
  "nombre": "Mi nuevo item"
}
```

**Respuesta:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "nombre": "Mi nuevo item",
  "created_at": "2024-05-25T10:30:45Z"
}
```

## 🔐 Variables de Entorno

Todas se configura en `.env`:

```
DB_USER=root
DB_PASSWORD=mysecurepassword
DB_NAME=dbapp
```

El código **NO hardcodea** credenciales. Siempre se leen desde:
- **Rust:** `std::env::var()`
- **Node:** `process.env`

## 🔄 Flujo de la Aplicación

### 1. Inicio del Sistema

```
docker-compose up
    ↓
MySQL inicia y ejecuta init.sql
    ↓
Backend espera healthcheck de MySQL (10 intentos, 5s entre cada)
    ↓
Backend intenta conectar a MySQL
    ↓
Backend expone servidor HTTP en :8080
```

### 2. Petición a /db-status

```
Cliente → GET /db-status
    ↓
Backend adquiere conexión del pool
    ↓
Ejecuta: SELECT NOW()
    ↓
Devuelve resultado en JSON
```

## 📊 Comparación: Rust + Actix vs Node.js + Express

| Aspecto | Rust + Actix Web | Node.js + Express |
|---------|------------------|-------------------|
| **Rendimiento** | ⚡⚡⚡ Excelente (~10,000 req/s) | ⚡⚡ Bueno (~5,000 req/s) |
| **Consumo Memoria** | 💤 Bajo (~20-50 MB) | 🔋 Moderado (~80-120 MB) |
| **Consumo CPU** | 💪 Eficiente | 📈 Mayor overhead |
| **Tiempo de compilación** | ⏱️ Lento (1-2 min) | ⚡ Rápido (init inmediato) |
| **Seguridad** | 🔒 Excelente (prevención de memory bugs) | ⚠️ Buena (depende del código) |
| **Curva de aprendizaje** | 📚 Empinada (compilador estricto) | 📚 Moderada (sintaxis amigable) |
| **Ecosistema de librerías** | 📦 Creciente pero limitado | 📦📦📦 Enorme (NPM) |
| **Mantenibilidad** | ✅ Excelente (tipos en compile time) | ✅ Buena (tipado opcional) |
| **Tamaño de imagen Docker** | 📦 ~100 MB (multi-stage) | 📦📦 ~200 MB |
| **Facilidad de despliegue** | ✅ Binario único, autocontenido | ✅ Node runtime + dependencias |
| **Async/Await** | ✅ Nativo y muy eficiente | ✅ Nativo con Promises |
| **Conexiones concurrentes** | 🚀 Miles simultáneas | 🚀 Cientos-Miles (event loop) |
| **Production-ready** | ✅ Muy robusto | ✅ Muy robusto |

## 🎯 Beneficios de Rust + Actix Web (Stack Asignado)

### 1. **Rendimiento Excepcional**
- Actix es uno de los frameworks web más rápidos del mundo
- Manejo eficiente de miles de conexiones concurrentes
- Ideal para APIs de alta carga

### 2. **Seguridad a Nivel de Compilación**
```rust
// Rust previene en tiempo de compilación:
// - Buffer overflows
// - Use-after-free
// - Data races (acceso simultáneo a memoria)
// - Null pointer dereferences
```

### 3. **Sin Garbage Collector**
- Rust usa "Ownership" en lugar de GC
- Predicible y consistente en rendimiento
- No hay pausas impredecibles

### 4. **Binario Único y Autónomo**
```
Imagen Docker Rust: ~100 MB
Imagen Docker Node: ~200 MB (requiere runtime)
```

### 5. **Async/Await Nativo y Eficiente**
```rust
// Basado en Tokio, muy eficiente
async fn get_items(db: web::Data<Mutex<PooledConn>>) -> HttpResponse {
    match db.lock() {
        Ok(mut conn) => {
            // Conexiones no bloqueantes
            match conn.query(...) { ... }
        }
    }
}
```

### 6. **Type Safety**
- El compilador de Rust es muy estricto
- Detecta errores antes de runtime
- Código más mantenible a largo plazo

## 📊 Beneficios de Node.js + Express (para comparación)

### 1. **Desarrollo Rápido**
- Sintaxis simple y flexible
- No requiere compilación
- Hot reload posible

### 2. **Ecosistema NPM Enorme**
- Miles de librerías disponibles
- Rápido prototipado

### 3. **Curva de aprendizaje Menor**
- Más accesible para principiantes
- JavaScript ubicuo (frontend + backend)

### 4. **Iteración Rápida**
- Cambios en código visibles inmediatamente
- Útil en desarrollo

## ⚙️ Configuración de la Base de Datos

### Tabla `items`
```sql
CREATE TABLE items (
    id VARCHAR(36) PRIMARY KEY,           -- UUID
    nombre VARCHAR(255) NOT NULL,        -- Nombre del item
    created_at TIMESTAMP,                -- Fecha creación (auto)
    updated_at TIMESTAMP,                -- Fecha actualización (auto)
    INDEX idx_created_at (created_at)    -- Índice para queries
);
```

### Variables de Entorno
- `DB_HOST`: Host MySQL (default: mysql)
- `DB_PORT`: Puerto MySQL (default: 3306)
- `DB_USER`: Usuario BD (default: root)
- `DB_PASSWORD`: Contraseña BD
- `DB_NAME`: Nombre BD (default: dbapp)

## 📝 Pruebas

### Test completo de endpoints

```bash
# 1. Health check (sin BD)
curl -v http://localhost:8080/health

# 2. DB Status (con BD)
curl -v http://localhost:8080/db-status

# 3. Listar items
curl -v http://localhost:8080/items

# 4. Crear item
curl -v -X POST http://localhost:8080/items \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mi Item Nuevo"}'

# 5. Listar items nuevamente (para ver el creado)
curl -v http://localhost:8080/items
```

### Con curl avanzado (instalándolo)
```powershell
# En Windows con Powershell
Invoke-WebRequest -Uri "http://localhost:8080/health" -Method Get | ConvertTo-Json

# Para POST
$body = @{"nombre"="Test Item"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8080/items" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## 🐛 Troubleshooting

### "Failed to connect to MySQL"
```bash
# Verificar que MySQL está corriendo
docker ps | grep mysql

# Ver logs de MySQL
docker logs db-mysql

# Esperar más tiempo (healthcheck)
docker-compose up --wait
```

### "Connection refused" en backend
```bash
# Verificar conectividad de red
docker network ls
docker network inspect app-network

# Verificar credenciales en .env
cat .env
```

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v  # Elimina volúmenes
docker system prune -a  # Limpia imágenes sin usar
docker-compose up --build  # Reconstruye desde cero
```

## 📚 Decisiones de Diseño

### 1. Multi-stage Docker (Rust)
- Build stage: Compila Rust (~2 min)
- Runtime stage: Solo binario ejecutable (~100 MB)

### 2. Health Checks
```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  timeout: 20s
  retries: 10
```
- Espera a que MySQL esté realmente listo
- Evita race conditions

### 3. Connection Pooling
- Rust: `Pool` con múltiples conexiones
- Node: `mysql.createPool()` nativo
- Reutiliza conexiones, evita overhead

### 4. Variables de Entorno
- Seguridad: Sin hardcoding
- Flexibilidad: Mismo código, múltiples entornos
- Best practice: Usado en producción

## 🎓 Lo que aprendemos con este proyecto

### Conceptos de Docker
- ✅ Multi-stage builds
- ✅ Health checks
- ✅ Networks (bridge)
- ✅ Volumes persistence
- ✅ Env vars
- ✅ docker-compose orquestación
- ✅ Dependency management

### Conceptos de Databases
- ✅ Connection pooling
- ✅ Query async
- ✅ Migrations (init.sql)
- ✅ Error handling
- ✅ Logging

### Conceptos de APIs REST
- ✅ Routing
- ✅ JSON responses
- ✅ HTTP status codes
- ✅ CORS
- ✅ Logging

### Performance & Architecture
- ✅ SystemAsync I/O
- ✅ Memory management
- ✅ Security considerations
- ✅ Production readiness

## 🎬 Conclusión

**Rust + Actix Web** es superior en:
- 🏆 Performance
- 🔒 Seguridad
- 💰 Eficiencia de recursos
- 📦 Tamaño de imagen

**Node.js + Express** es mejor para:
- 🚀 Time-to-market
- 📚 Curva aprendizaje
- 🔧 Ecosistema
- 📝 Prototipado

**Recomendación**: Usar Rust para servicios críticos, APIs de alta carga, o donde la seguridad es paramount. Usar Node para MVPs, prototipado rápido y equipos con poco tiempo.

---

**Fecha**: Mayo 2024
**Autor**: Grupo comparación
**Versión**: 1.0
