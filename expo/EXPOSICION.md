# 🎓 Exposición: Backend REST API con Rust + Actix Web + Docker

---

## 📌 ¿Qué es nuestro proyecto?

Una **API REST** completa y funcional que:
- Corre dentro de **contenedores Docker**
- Usa **Rust + Actix Web** como backend
- Se conecta a una base de datos **MySQL 8.0**
- Expone 4 endpoints para gestionar items (CRUD básico)

---

## 🦀 ¿Qué es Rust?

**Rust** es un lenguaje de programación de sistemas creado por Mozilla (2015).

### Características principales:
| Característica | Descripción |
|---|---|
| **Seguridad de memoria** | Previene errores como buffer overflow, use-after-free y null pointers **en tiempo de compilación** |
| **Sin Garbage Collector** | Usa un sistema de "Ownership" (propiedad) en lugar de GC, lo que da rendimiento predecible |
| **Concurrencia segura** | Previene data races (accesos simultáneos a memoria) por diseño |
| **Rendimiento** | Comparable a C/C++, compila a código máquina nativo |
| **Tipado estricto** | Detecta muchos errores antes de ejecutar el programa |

### ¿Para qué se usa Rust?
- Servidores web de alto rendimiento
- Herramientas de línea de comandos (CLI)
- Sistemas operativos y drivers
- Blockchain y criptografía
- Juegos y motores gráficos
- Empresas que lo usan: **Discord, Cloudflare, Amazon, Microsoft, Meta**

---

## ⚡ ¿Qué es Actix Web?

**Actix Web** es un framework web para Rust. Es uno de los **frameworks más rápidos del mundo** según benchmarks (TechEmpower).

### Características principales:
| Característica | Descripción |
|---|---|
| **Velocidad extrema** | Maneja ~10,000+ peticiones por segundo |
| **Async/Await** | Procesamiento asíncrono basado en Tokio |
| **Type-safe** | Rutas y parámetros verificados en compilación |
| **Middleware** | Soporte para logging, CORS, autenticación, etc. |
| **Bajo consumo** | ~20-50 MB de RAM en ejecución |

### ¿Para qué se usa Actix Web?
- APIs REST de alta carga
- Microservicios
- Servidores WebSocket
- Backends donde la velocidad y seguridad son críticas

### Ejemplo de cómo definimos una ruta en nuestro código:
```rust
// Endpoint GET /health - verifica que la API está corriendo
async fn health_check() -> HttpResponse {
    let response = HealthResponse {
        status: "API is running".to_string(),
        timestamp: Local::now().to_rfc3339(),
    };
    HttpResponse::Ok().json(response)
}
```

---

## 🐳 ¿Qué es Docker?

**Docker** es una plataforma que permite empaquetar aplicaciones en **contenedores**: entornos aislados y portables que incluyen todo lo necesario para ejecutarse.

### Conceptos clave:
| Concepto | Descripción |
|---|---|
| **Imagen** | Plantilla de solo lectura con el código y dependencias |
| **Contenedor** | Instancia en ejecución de una imagen |
| **Dockerfile** | Receta para construir una imagen |
| **Docker Compose** | Herramienta para orquestar múltiples contenedores |
| **Volumen** | Almacenamiento persistente para datos (ej: la BD) |
| **Network** | Red interna para que los contenedores se comuniquen |

### ¿Para qué se usa Docker?
- Garantizar que la app funciona igual en cualquier máquina
- Desplegar aplicaciones rápidamente
- Aislar servicios (BD, backend, frontend)
- Facilitar el desarrollo en equipo

---

## 🐬 ¿Qué es MySQL?

**MySQL** es un sistema de gestión de bases de datos relacional (RDBMS), uno de los más usados del mundo.

### En nuestro proyecto:
- Corre dentro de un contenedor Docker
- Se inicializa automáticamente con un script SQL (`init.sql`)
- Almacena los items con: `id`, `nombre`, `created_at`, `updated_at`
- El backend se conecta mediante **connection pooling** (reutiliza conexiones)

---

## 🏗️ Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────┐
│              Docker Compose                       │
│                                                   │
│  ┌─────────────┐         ┌──────────────────┐   │
│  │   MySQL 8.0 │◄────────│  Rust + Actix    │   │
│  │  Puerto 3306│         │   Puerto 8080    │   │
│  │  (db-mysql) │         │ (backend-rust)   │   │
│  └─────────────┘         └──────────────────┘   │
│         │                         │               │
│    Volume:                   Expuesto:            │
│   mysql_data              localhost:8080          │
│                                                   │
│         └─────── app-network ─────┘              │
└─────────────────────────────────────────────────┘
```

**Flujo:**
1. `docker-compose up` levanta MySQL y el backend
2. MySQL ejecuta `init.sql` y crea la tabla `items`
3. El backend espera a que MySQL esté sano (healthcheck)
4. El backend se conecta y expone la API en el puerto 8080
5. El cliente hace peticiones HTTP a `localhost:8080`

---

## 📡 Endpoints de la API

| Método | Ruta | Descripción | Necesita BD |
|--------|------|-------------|:-----------:|
| `GET` | `/health` | Verifica que la API corre | ❌ |
| `GET` | `/db-status` | Verifica conexión a MySQL | ✅ |
| `GET` | `/items` | Lista todos los items | ✅ |
| `POST` | `/items` | Crea un nuevo item | ✅ |

---

## 🐳 Dockerfile: Multi-Stage Build

Nuestro Dockerfile usa **2 etapas** para optimizar la imagen final:

```dockerfile
# Etapa 1: Compilar Rust (imagen pesada ~1.5 GB)
FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

# Etapa 2: Solo el binario ejecutable (imagen liviana ~100 MB)
FROM debian:bookworm-slim
COPY --from=builder /app/target/release/backend-api .
CMD ["./backend-api"]
```

**Ventaja:** La imagen final pesa ~100 MB en vez de ~1.5 GB.

---

## 🔐 Variables de Entorno

El código **nunca** tiene contraseñas hardcodeadas. Todo se lee desde variables de entorno:

```bash
DB_USER=root
DB_PASSWORD=mysecurepassword
DB_NAME=dbapp
```

En Rust se leen así:
```rust
let db_user = std::env::var("DB_USER").unwrap_or_else(|_| "root".to_string());
```

---

## 🖥️ COMANDOS PARA EJECUTAR EN UBUNTU (sin sudo)

### Paso 0: Ir a la carpeta del proyecto
```bash
cd ~/backend-docker
```

### Paso 1: Crear el archivo .env (configuración de la base de datos)
```bash
echo "DB_USER=root
DB_PASSWORD=mysecurepassword
DB_NAME=dbapp" > .env
```

### Paso 2: Construir e iniciar los contenedores
```bash
docker compose up --build -d
```
> `-d` ejecuta en segundo plano (detached). Sin `-d` se ven los logs en vivo.
> **NOTA:** La primera vez tarda ~2-3 minutos porque compila Rust.

### Paso 3: Ver el estado de los contenedores
```bash
docker compose ps
```
> Deben aparecer `db-mysql` y `backend-rust` en estado "running" o "healthy".

### Paso 4: Ver los logs (para verificar que todo arrancó bien)
```bash
docker compose logs backend-rust
```
> Debería mostrar: `✅ Database connection pool created` y `🚀 Starting server`

### Paso 5: Probar endpoint /health (sin base de datos)
```bash
curl http://localhost:8080/health
```
> Respuesta esperada:
> ```json
> {"status":"API is running","timestamp":"2026-06-09T..."}
> ```

### Paso 6: Probar endpoint /db-status (conexión a MySQL)
```bash
curl http://localhost:8080/db-status
```
> Respuesta esperada:
> ```json
> {"status":"Database connection successful","connection":true,"timestamp":"...","db_time":"..."}
> ```

### Paso 7: Listar items (los 3 que carga init.sql)
```bash
curl http://localhost:8080/items
```
> Respuesta esperada:
> ```json
> {"items":[{"id":"...","nombre":"Primer Item","created_at":"..."},...],"total":3}
> ```

### Paso 8: Crear un nuevo item (POST con JSON)
```bash
curl -X POST http://localhost:8080/items -H "Content-Type: application/json" -d '{"nombre":"Item creado en clase"}'
```
> Respuesta esperada:
> ```json
> {"id":"uuid-generado","nombre":"Item creado en clase","created_at":"..."}
> ```

### Paso 9: Verificar que se creó (listar de nuevo)
```bash
curl http://localhost:8080/items
```
> Ahora debería mostrar `"total":4`

### Paso 10: Ver los logs en tiempo real (opcional, para mostrar las peticiones)
```bash
docker compose logs -f backend-rust
```
> Presionar `Ctrl+C` para salir de los logs.

### Paso 11: Detener todo al terminar
```bash
docker compose down
```

### (Opcional) Limpiar todo completamente (eliminar volúmenes y datos)
```bash
docker compose down -v
```

---

## 📋 Resumen rápido de comandos (copiar y pegar)

```bash
cd ~/backend-docker
echo "DB_USER=root
DB_PASSWORD=mysecurepassword
DB_NAME=dbapp" > .env
docker compose up --build -d
docker compose ps
docker compose logs backend-rust
curl http://localhost:8080/health
curl http://localhost:8080/db-status
curl http://localhost:8080/items
curl -X POST http://localhost:8080/items -H "Content-Type: application/json" -d '{"nombre":"Item creado en clase"}'
curl http://localhost:8080/items
docker compose down
```

---

## 🎯 ¿Por qué elegimos Rust + Actix en vez de Node.js?

| Aspecto | Rust + Actix | Node.js + Express |
|---------|:---:|:---:|
| Rendimiento | ⚡⚡⚡ ~10,000 req/s | ⚡⚡ ~5,000 req/s |
| Memoria RAM | ~20-50 MB | ~80-120 MB |
| Seguridad | Errores detectados en compilación | Errores en ejecución |
| Imagen Docker | ~100 MB | ~200 MB |
| Velocidad inicio | Instantáneo (binario nativo) | Requiere runtime Node |

**Conclusión:** Rust es ideal para APIs de producción de alta carga. Node.js es mejor para prototipado rápido.

---

## 🎤 Puntos clave para la exposición

1. **Docker nos permite** levantar toda la infraestructura (BD + Backend) con UN solo comando
2. **Rust garantiza** seguridad de memoria sin sacrificar rendimiento
3. **Actix Web** es uno de los frameworks web más rápidos que existen
4. **Multi-stage build** reduce la imagen Docker de 1.5 GB a ~100 MB
5. **Variables de entorno** mantienen las credenciales seguras
6. **Health checks** aseguran que el backend no arranca hasta que MySQL esté listo
7. **Connection pooling** reutiliza conexiones a la BD para mayor eficiencia

---

*Archivo creado para la exposición del proyecto - Junio 2026*
