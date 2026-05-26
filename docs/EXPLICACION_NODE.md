# 📚 Node.js + Express: Stack Asignado - Explicación

## ¿Por qué Node.js + Express? (Stack Asignado - Grupo 1)

---

## 1. Introdución a Node.js

### ¿Qué es Node.js?

**Node.js** es un entorno de ejecución de **JavaScript en el servidor**. Permite usar el mismo lenguaje que en frontend, conectando la brecha entre desarrollo cliente y servidor.

```
┌──────────────┐
│ JavaScript   │
├──────────────┤
│  Frontend    │  Browser (React, Vue, etc)
│  Backend     │  Node.js
└──────────────┘
```

### Características Principales

- **Event Loop**: Modelo no bloqueante, asincrónico
- **NPM**: Ecosistema más grande (3 millones de paquetes)
- **Lenguaje Unificado**: JavaScript en fronted y backend
- **Desarrollo Rápido**: Sin compilación, cambios inmediatos
- **Escalable**: Maneja miles de conexiones simultáneas

---

## 2. ¿Qué es Express.js?

### Express es el Framework Web más usado con Node.js

```
Node.js Runtime
    ↓
Express Framework
    ├─ Routing
    ├─ Middleware
    ├─ Request/Response handling
    ├─ Error handling
    └─ JSON parsing
    ↓
Tu Aplicación
```

### Características de Express

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());  // Parse JSON automáticamente
app.use(cors());          // CORS enabled

// Routing simple
app.get('/health', (req, res) => {
  res.json({ status: 'running' });
});

// Error handling
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Server ready
app.listen(8080);
```

**Ventajas:**
- ✅ Sintaxis simple y clara
- ✅ Muy flexible
- ✅ Middlewares reutilizables
- ✅ Comunidad enorme
- ✅ Mucha documentación

---

## 3. Cómo se implementa en este TP

### Estructura del Código

```javascript
// 1. Configuración de variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dbapp',
};

// 2. Pool de conexiones a MySQL
const pool = mysql.createPool(dbConfig);

// 3. Endpoints
app.get('/health', (req, res) => { /* ... */ });
app.get('/db-status', async (req, res) => { /* ... */ });
app.get('/items', async (req, res) => { /* ... */ });
app.post('/items', async (req, res) => { /* ... */ });

// 4. Server
app.listen(APP_PORT, APP_HOST);
```

### Endpoints Implementados

#### GET /health
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
  });
});
```
✅ Rápido (sin consulta a BD)
✅ Verificar que API responde

#### GET /db-status
```javascript
app.get('/db-status', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT NOW() as db_time');
    conn.release();

    res.status(200).json({
      status: 'Database connection successful',
      connection: true,
      timestamp: new Date().toISOString(),
      db_time: rows[0]?.db_time?.toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: `Database query failed: ${error.message}`,
      connection: false,
      timestamp: new Date().toISOString(),
      db_time: null,
    });
  }
});
```
✅ Consulta BD (SELECT NOW())
✅ Devuelve JSON con estado

#### GET /items
```javascript
app.get('/items', async (req, res) => {
  const conn = await pool.getConnection();
  const [rows] = await conn.query(
    'SELECT id, nombre, created_at FROM items ORDER BY created_at DESC'
  );
  conn.release();

  res.status(200).json({
    items: rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      created_at: row.created_at.toISOString(),
    })),
    total: rows.length,
  });
});
```
✅ Lista items de la BD

#### POST /items
```javascript
app.post('/items', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'Field "nombre" is required' });
  }

  const id = uuidv4();
  const created_at = new Date();

  const conn = await pool.getConnection();
  await conn.execute(
    'INSERT INTO items (id, nombre, created_at) VALUES (?, ?, ?)',
    [id, nombre, created_at]
  );
  conn.release();

  res.status(201).json({
    id,
    nombre,
    created_at: created_at.toISOString(),
  });
});
```
✅ Crea nuevo item
✅ UUID autogenerado
✅ Timestamp automático

---

## 4. Beneficios de Node.js + Express

### ✅ Ventajas

#### 1. Desarrollo Rápido
```javascript
// No requiere compilación
// Cambios visibles inmediatamente (con nodemon)

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello' });
});

// Guardas archivo → express recarga → respuesta cambia
```

#### 2. Ecosistema NPM Enorme
```
npm install express
npm install mysql2
npm install uuid
npm install cors
npm install dotenv

3,000,000+ paquetes disponibles
Soluciona casi cualquier problema
```

#### 3. Curva Aprendizaje Suave
```javascript
// Sintaxis clara y directa
const express = require('express');
const app = express();

app.get('/ruta', (req, res) => {
  res.json({ dato: 'valor' });
});

app.listen(8080);

// Sin tipos complejos, sin borrow checker, sin generics
```

#### 4. Desarrollo Web Completo
```javascript
// Frontend: React, Vue, Angular (JavaScript)
// Backend: Node.js (JavaScript)
// Base de datos: MySQL (desde Node)

// Un programador puede hacer stack completo
// Familiaridad del lenguaje
```

#### 5. Async/Await Nativo
```javascript
// Manejo fácil de operaciones asincrónicas
async function obtenerItems() {
  const conn = await pool.getConnection();
  const [items] = await conn.query('SELECT * FROM items');
  conn.release();
  return items;
}

// Sin callbacks anidados
// Sin "callback hell"
```

#### 6. Testing Fácil
```javascript
// Jest, Mocha, etc. integran bien con Node
const request = require('supertest');

test('GET /health retorna 200', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('API is running');
});
```

#### 7. Deployment Simple
```bash
# Docker
docker build -t myapp .
docker run -p 8080:8080 myapp

# Heroku, AWS Lambda, etc. soportan Node out-of-the-box
# Mismo archivo package.json en desarrollo y producción
```

---

## 5. Desventajas de Node.js + Express

### ⚠️ Limitaciones

#### 1. Performance Moderado
```
Node.js: ~5,000 requests/segundo
Rust:   ~12,000 requests/segundo
Ratio:  2.4x más lento

Para APIs simples: aceptable
Para APIs de altísima carga: considerar Rust
```

#### 2. Tipado Débil
```javascript
// Sin TypeScript, esto NO da error:
function suma(a, b) {
  return a + b;
}

suma('5', 10);  // "510" (concatenación, no suma!)

// Con TypeScript:
function suma(a: number, b: number): number {
  return a + b;
}

suma('5', 10);  // ERROR en compilación
```

#### 3. Mayor Consumo de Memoria
```
Node.js: ~100 MB por instancia
Rust:    ~35 MB por instancia
Ratio:   3x más Node

Para 1000 instancias: significativo
```

#### 4. Garbage Collection
```javascript
// Node.js tiene GC no determinista
// Pausas impredecibles durante ejecución

const items = [];
for (let i = 0; i < 1000000; i++) {
  items.push({ id: i, data: new Array(1000).fill(0) });
}

// En algún momento: GC pausa → 100ms+ pausas
// Rust: sin GC, predecible
```

#### 5. Dependency Hell
```
npm install
  └─ librería A
    └─ librería B ^2.0.0
      └─ librería C ^1.0.0
        └─ ...

Múltiples versiones → conflictos
Diferente resultado en dev vs producción
```

---

## 6. Cuándo Usar Node.js + Express

### ✅ USE Node.js + Express SI:

```
✅ MVP / Startup rápido
✅ API moderada (< 5,000 req/s)
✅ Equipo con experiencia en JavaScript
✅ Prototipado rápido necesario
✅ Full-stack JavaScript
✅ Cambios frecuentes en requerimientos
✅ Presupuesto de desarrollo limitado
✅ Time-to-market crítico
```

**Ejemplos reales:**
- Uber (backend en Node)
- Netflix (APIs en Node)
- LinkedIn (algunas APIs)
- Twitter (infraestructura NodeJS)

---

## 7. Cuándo NO Usar Node.js

### ❌ NO USES Node.js SI:

```
❌ API de altísima carga (>10,000 req/s)
❌ Baja latencia crítica (<5ms)
❌ Máximo rendimiento requerido
❌ Presupuesto de infraestructura muy limitado
❌ Sistema embebido / IoT crítico
❌ Aplicación CPU-intensive (cálculos pesados)
```

**Usa Rust, Go o C++ en estos casos**

---

## 8. Arquitectura con Node.js + Express

### Componentes

```
┌──────────────────────────────┐
│   Cliente HTTP               │
│   (curl, browser)            │
└────────────┬─────────────────┘
             │ HTTP Request
             ▼
┌──────────────────────────────┐
│  Express App                 │
│  ├─ Router                   │
│  │  ├─ GET /health          │
│  │  ├─ GET /db-status       │
│  │  ├─ GET /items           │
│  │  └─ POST /items          │
│  │                           │
│  ├─ Middleware              │
│  │  ├─ JSON parser          │
│  │  └─ CORS                 │
│  │                           │
│  └─ Error Handler           │
└────────────┬─────────────────┘
             │ SQL Query
             ▼
┌──────────────────────────────┐
│  MySQL Connection Pool       │
│  (10 conexiones reutilizables│
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  MySQL 8.0 Database          │
│  └─ Tabla items              │
└──────────────────────────────┘
```

### Connection Pooling

```javascript
// Sin pool (ineficiente):
// nueva conexión por request → lento

// Con pool (eficiente):
const pool = mysql.createPool({
  connectionLimit: 10,  // Máx 10 conexiones
  queueLimit: 0,
});

// Las conexiones se reutilizan
// Primera request: crea conexión
// Segunda request: reutiliza conexión existente
// Mucho más rápido
```

---

## 9. Flujo Completo: POST /items

```
1. Cliente
   curl -X POST http://localhost:8080/items \
     -H "Content-Type: application/json" \
     -d '{"nombre":"Mi Item"}'

2. Express recibe request
   app.post('/items', async (req, res) => {

3. Valida entrada
   const { nombre } = req.body;
   if (!nombre) return res.status(400).json(...);

4. Genera UUID
   const id = uuidv4();  // "550e8400-..."

5. Obtiene conexión del pool
   const conn = await pool.getConnection();

6. Ejecuta SQL prepared statement
   await conn.execute(
     'INSERT INTO items (id, nombre, created_at) VALUES (?, ?, ?)',
     [id, nombre, new Date()]
   );

7. Libera conexión (vuelta al pool)
   conn.release();

8. Responde al cliente
   res.status(201).json({
     id,
     nombre,
     created_at: new Date().toISOString()
   });

9. Cliente recibe
   JSON: {"id": "550e8400-...", ...}
   HTTP Status: 201 Created
```

---

## 10. Seguridad en Node.js + Express

### ✅ Implementado en este TP

#### 1. Variables de Entorno
```javascript
// ✅ BIEN - Lee desde env vars
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  // No hardcodeado
};

// ❌ MAL - Hardcoded (NUNCA hacer esto)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'mysecurepassword123',  // VISIBLE EN GIT!
};
```

#### 2. Prepared Statements
```javascript
// ✅ BIEN - Previene SQL injection
await conn.execute(
  'INSERT INTO items (id, nombre, created_at) VALUES (?, ?, ?)',
  [id, nombre, created_at]
);

// ❌ MAL - SQL injection vulnerable!
const query = `INSERT INTO items VALUES ('${id}', '${nombre}', '${created_at}')`;
```

#### 3. Connection Pooling
```javascript
// ✅ Conexiones reutilizables
const conn = await pool.getConnection();
// ... usar conn ...
conn.release();

// Evita: resource exhaustion, connection leaks
```

#### 4. CORS Configured
```javascript
app.use(cors());  // Cross-Origin Resource Sharing
// Controla qué dominios pueden acceder a la API
```

#### 5. Error Handling
```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// No expone detalles internos al cliente
```

---

## 11. Producción con Node.js + Express

### Deployment Típico

```
┌─────────────────────────────┐
│  Docker Image               │
│  ├─ FROM node:20-alpine     │
│  ├─ npm ci                  │
│  └─ CMD node index.js       │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Docker Compose             │
│  ├─ MySQL container         │
│  ├─ Node backend container  │
│  └─ Network bridge          │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Nginx Reverse Proxy        │
│  └─ HTTPS/SSL termination   │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  AWS / Azure / GCP          │
│  └─ Load balancer           │
│  └─ Auto scaling            │
│  └─ Backup/Restore          │
└─────────────────────────────┘
```

### Monitoreo

```javascript
// Logs estructurados
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'Server started',
  port: 8080,
}));

// Metrics
const prometheus = require('prom-client');
const httpRequestDurationMs = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
});
```

---

## 12. Conclusión

### Node.js + Express es ideal para:

```
✅ Desarrollo rápido
✅ Equipos pequeñas
✅ Startups / MVPs
✅ APIs moderadas
✅ Prototipado
✅ Full-stack JavaScript
```

### Comparado con Rust + Actix:

```
Node: Velocidad de desarrollo
Rust: Velocidad de ejecución

Elige según tus prioridades
```

---

**Documento**: Explicación Node.js + Express  
**Versión**: 1.0  
**Status**: ✅ Completo
