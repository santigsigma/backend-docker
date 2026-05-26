# 🎯 DEMO SCRIPT - Ejecutar Mañana

## Opción 1: SIN Docker (Recomendado - Más rápido)

```bash
# Terminal 1: Ejecutar API
cd nodejs-express
npm install  # Solo la primera vez (2 min)
node index-dev.js
```

Esperar: `Server running on http://localhost:8080`

```bash
# Terminal 2: Testear (Windows PowerShell)
curl http://localhost:8080/health
curl http://localhost:8080/db-status
curl http://localhost:8080/items
curl -X POST http://localhost:8080/items -H "Content-Type: application/json" -d "{\"nombre\":\"Demo Item\"}"
```

## Opción 2: CON Docker (Si hablamos de infraestructura)

```bash
docker-compose -f docker-compose.node.yml up --build
```

Luego mismo testing que arriba.

## Respuestas Esperadas

```json
GET /health
{"status":"API is running"}

GET /db-status  
{"status":"simulated"}

GET /items
[{"id":"...","nombre":"...","created_at":"..."},...]

POST /items
{"id":"...","nombre":"Demo Item","created_at":"..."}
```

## Timing

- Opción 1 (sin Docker): ~3 minutos para primer demo
- Opción 2 (con Docker): ~5 minutos
- Luego: Cualquier test/endpoint adicional: <1 segundo

---

**Presentado por:** Grupo  
**Stack principal:** Node.js + Express  
**Stack alternativo:** Rust + Actix Web  
**Requisitos:** 12/12 ✅
