# Troubleshooting & Deployment Guide

## 🐛 Solución de Problemas Comunes

### 1. Error: "Port 3306 already in use"

#### Síntoma
```
docker: Error response from daemon: Ports are not available: 
expose 3306: failed to open userland proxy to 0.0.0.0:3306
```

#### Causas Posibles
- MySQL ya corriendo en host
- Otro contenedor usando puerto 3306
- Puerto reservado por el sistema

#### Soluciones

**Opción A: Identificar y matar proceso**
```powershell
# Ver qué usa puerto 3306
netstat -ano | findstr :3306

# Matar el proceso (PID = el número que salió)
taskkill /PID <PID> /F
```

**Opción B: Cambiar puerto en docker-compose**
```yaml
services:
  mysql:
    ports:
      - "3307:3306"  # Cambiar de 3306 a 3307
```

Luego en .env:
```
DB_PORT=3307
```

**Opción C: Limpiar Docker completamente**
```powershell
docker system prune -a  # ADVERTENCIA: borra todo
docker-compose up --build
```

---

### 2. Error: "Connection refused" en backend

#### Síntoma
```
❌ Failed to connect to MySQL
Backend logs: "Connection refused (os error 111)"
```

#### Causas Probables
1. MySQL aún no inició
2. Credenciales incorrectas
3. Nombre de host incorrecto

#### Soluciones

**Verificar MySQL está corriendo:**
```powershell
docker ps | grep mysql

# Si no aparece
docker-compose logs mysql
```

**Verificar credenciales en .env:**
```powershell
cat .env
```

**Aumentar tiempo de wait:**

En docker-compose.yml:
```yaml
depends_on:
  mysql:
    condition: service_healthy

healthcheck:
  timeout: 30s  # Aumentar de 20s
  retries: 15   # Aumentar de 10
```

**Verificar networking:**
```powershell
docker network ls
docker network inspect app-network

# ¿Están ambos containers en la red?
docker ps --format "{{.Names}} {{.Networks}}"
```

---

### 3. Error: "GET /health responde 404"

#### Síntoma
```
curl http://localhost:8080/health
→ Cannot GET /health
→ 404 Not Found
```

#### Causas
- Backend no inició
- Puerto incorrecto
- Ruta mal escrita

#### Soluciones

**Verificar backend está corriendo:**
```powershell
docker ps | grep backend
docker logs backend-rust
```

**Verificar puerto correcto:**
```powershell
# Si es la opción de comparación, verificar puerto
docker-compose ps  # Ver expuesto: 8080 o 8081

# Si 8081:
curl http://localhost:8081/health
```

**Escribir correctamente:**
```powershell
# ❌ MALO
curl http://localhost:8080/Health    # Mayúscula
curl http://localhost:8080/healths   # Plural

# ✅ BIEN
curl http://localhost:8080/health    # Exacto
```

---

### 4. Error: "Failed to query database"

#### Síntoma
```json
{
  "status": "Database query failed: ...",
  "connection": false
}
```

#### Causas
- Tabla no existe
- SQL error
- Connection perdida

#### Soluciones

**Verificar tabla existe:**
```powershell
docker exec db-mysql mysql -u root -pmysecurepassword dbapp -e "SHOW TABLES;"

# Debería mostrar: "items"
```

**Recrear tabla si falta:**
```powershell
docker exec db-mysql mysql -u root -pmysecurepassword dbapp -e "
  CREATE TABLE items (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
"
```

**Verificar init.sql se ejecutó:**
```powershell
docker logs db-mysql | grep "init.sql"

# Debería ver algo como: "Processing init.sql"
```

---

### 5. Error: "Out of memory" o crashes

#### Síntoma
```
Backend logs: "OOMKilled"
docker-compose logs: "Killed"
```

#### Causa
Docker sin suficiente memoria

#### Solución

**Aumentar memoria en Docker Desktop:**
1. Docker Desktop → Settings → Resources
2. Aumentar "Memory" a 4-8 GB
3. Reiniciar Docker

**O limitar contenedor:**
```yaml
services:
  backend-rust:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

### 6. Error: "Compilation error" (Rust)

#### Síntoma
```
error: failed to compile `backend-api`
```

#### Causa
Cargo.toml con dependencias incorrectas

#### Solución

**Limpiar y rebuilding:**
```powershell
docker-compose down
docker image rm backend-docker_backend-rust  # Eliminar imagen
docker-compose up --build
```

**Verificar Cargo.toml:**
```toml
[dependencies]
actix-web = "4.4"  # Versiones correctas
mysql = "24.1"
tokio = "1.35"
```

---

### 7. Error: "Cannot find module" (Node)

#### Síntoma
```
Error: Cannot find module 'express'
```

#### Causa
package.json con problemas

#### Solución

**Limpiar node_modules:**
```powershell
docker-compose down
docker image rm backend-docker_backend-node
docker-compose -f docker-compose.node.yml up --build
```

**Verificar package.json:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5"
  }
}
```

---

### 8. Error: "ECONNREFUSED" en inicio

#### Síntoma
```
MySQL Error: ECONNREFUSED 127.0.0.1:3306
```

#### Causa
Backend intenta conectar antes de MySQL estar listo

#### Solución

Verificar docker-compose.yml tiene healthcheck:

```yaml
services:
  mysql:
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
      interval: 5s

  backend-rust:
    depends_on:
      mysql:
        condition: service_healthy  # ← Importante
```

---

## ✅ Checklist de Presentación

### Antes de Presentar (30 min antes)

**Verificaciones Técnicas:**
- [ ] Docker Desktop está corriendo
- [ ] Carpeta `backend-docker` accesible
- [ ] Archivo `.env` existe con credenciales
- [ ] Puertos 3306, 8080, 8081 disponibles
- [ ] `docker-compose.yml` está correcto
- [ ] `Dockerfile` existen en ambas carpetas

**Pre-test (15 min antes):**
```powershell
# Limpiar
docker-compose down -v

# Reconstruir
docker-compose -f docker-compose.rust.yml up --build

# Esperar ~3 minutos
#Cuando veas: "🚀 Starting server at http://0.0.0.0:8080"

# Test rápido (en otra terminal)
curl http://localhost:8080/health
```

**Preparar Screenshots/Demostraciones:**
- [ ] Health check respondiendo
- [ ] DB status mostrando conexión exitosa
- [ ] POST /items creando item
- [ ] GET /items mostrando datos

### Durante la Presentación

**Intro (2 min):**
- [ ] Explicar qué es Docker
- [ ] Explicar arquitectura general
- [ ] Mostrar docker-compose.yml

**Demo Técnica (10 min):**
- [ ] Ejecutar `docker-compose up`
- [ ] Mostrar logs: MySQL → Backend → Ready
- [ ] Test health endpoint (sin DB)
- [ ] Test db-status endpoint (con DB)
- [ ] Crear item (POST)
- [ ] Listar items (GET)
- [ ] Mostrar datos en MySQL directamente (opcional)

**Explicación Rust + Actix (8 min)**
- [ ] ¿Qué es Rust? (memory safety)
- [ ] ¿Qué es Actix? (performance)
- [ ] Mostrar código src/main.rs
- [ ] Explicar handlers async/await
- [ ] Explicar connection pooling
- [ ] Performance vs Node

**Explicación Node + Express (6 min)**
- [ ] ¿Qué es Node? (event loop)
- [ ] ¿Qué es Express? (routing)
- [ ] Mostrar código index.js
- [ ] Comparar con Rust
- [ ] Ventajas/Desventajas

**Comparación Final (4 min)**
- [ ] Tabla comparativa
- [ ] Gráfico performance
- [ ] Recomendaciones de uso
- [ ] Conclusiones

**Q&A (tiempo restante)**
- [ ] Preguntas de docentes
- [ ] Preguntas de compañeros

### Documentación a Mostrar

- [ ] README.md (intro)
- [ ] PRESENTACION.md (contenido)
- [ ] COMPARACION_STACKS.md (análisis)
- [ ] ARQUITECTURA.md (diagramas)
- [ ] QUICKSTART.md (ejecución)

---

## 🎯 Métricas de Éxito

```
✅ DEBE FUNCIONAR:
  - Docker-compose inicia sin errores
  - MySQL se conecta correctamente
  - Backend responde en :8080
  - GET /health retorna status: "API is running"
  - GET /db-status retorna connection: true
  - POST /items crea el item
  - GET /items lista los items
  - Variables de entorno se leen internamente

✅ DEBE EXPLICAR:
  - Diferencias Rust vs Node.js
  - Por qué Actix es rápido
  - Beneficios de cada stack
  - Cuándo usar cada uno
  - Arquitectura Docker
  - Connection pooling
  - Async/await

✅ DEBE DOCUMENTAR:
  - README.md existe y es completo
  - docker-compose.yml está bien formado
  - Dockerfile tienen good practices
  - Código comentado
  - Variables de entorno sin hardcoding
```

---

## 📊 Plan de Presentación (30 minutos)

```
00:00-02:00  Introducción & Contexto
02:00-04:00  Mostrar docker-compose up
04:00-06:00  Demo endpoints
06:00-08:00  Explicar Rust + Actix
08:00-10:00  Show code Rust
10:00-12:00  Explicar Node + Express
12:00-14:00  Show code Node
14:00-18:00  Comparación detallada
18:00-22:00  Arquitectura/Diagrams
22:00-26:00  Performance metrics
26:00-28:00  Conclusiones
28:00-30:00  Preguntas
```

---

## 🎓 Puntos a Enfatizar

### Sobre Docker
1. **Aislamiento**: Cada container es un mini-servidor
2. **Networks**: Containers se comunican por DNS
3. **Volumes**: Persistencia de datos
4. **Health checks**: Esperar a que servicios estén listos

### Sobre Rust
1. **Memory safety**: Errores en compile-time
2. **Performance**: 10x más requests/segundo
3. **Async**: Tokio para manejar 10k+ conexiones
4. **Type safety**: Refactoring seguro

### Sobre Node
1. **Developer experience**: Desarrollo rápido
2. **Ecosystem**: NPM enorme
3. **Learning curve**: Más accesible
4. **Time-to-market**: MVP rápido

---

## 🚨 Situaciones de Emergencia

### Si Backend no inicia (30 seg de presentación)

```bash
# Opción 1: Mostrar logs
docker logs backend-rust -f

# Opción 2: Si hay error de compilación, mostrar README
"En caso de error, de compilación, 
 la solución sería limpiar caché..."

# Opción 3: Tener demo pre-grabada
"Aquí les muestro un video de cuando funciona..."
```

### Si MySQL no inicia (30 seg)

```bash
# Reiniciar el servicio
docker restart db-mysql

# Mientras espera, explicar código o arquitectura
```

### Si no hay conexión a Internet

```
- docker-compose down
- Demostrar código offline
- Mostrar arquitectura/diagramas
- Explicar cómo funcionaría si estuviera online
```

---

## 📝 Notas Finales

- **Llevar USB**: Docker images pueden pesar
- **Backup de code**: Git push antes de presentar
- **Dormir bien**: La presentación será de día, descanso
- **Practicar**: Ensayar con amigos 1-2 veces
- **Timing**: Tener reloj listo
- **Plan B**: Slides con screenshots si falla live demo

---

**Documento**: Troubleshooting & Deployment
**Última actualización**: Mayo 2024
**Versión**: 1.0
**Estado**: Listo para usar ✅
