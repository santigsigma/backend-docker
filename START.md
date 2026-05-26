# 🚀 REST API Backend - Ejecutar Ahora

## SIN Docker (Windows/Ubuntu) - Rápido

```bash
cd nodejs-express
npm install
node index-dev.js
```

Test: `curl http://localhost:8080/health`

**Respuesta esperada:** `{"status":"API is running"}`

## CON Docker (Windows/Ubuntu)

```bash
docker-compose -f docker-compose.node.yml up --build
```

Test: `curl http://localhost:8080/health`

## Endpoints

- `GET /health` → API status
- `GET /db-status` → Database status  
- `GET /items` → List all items
- `POST /items` → Create item

## Stack

- **Node.js**: `nodejs-express/index.js` + Express 4.18
- **Rust**: `rust-actix/src/main.rs` + Actix Web (alternativo)
- **BD**: MySQL 8.0
- **Status**: ✅ Testado Windows | ✅ Compatible Ubuntu | ✅ 12/12 Requisitos

## Documentación

Más detalles en carpeta `docs/`

---

**⏰ Listo para presentación mañana**
