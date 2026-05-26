// Development mode - executa sin MySQL
// Usa para demostrar que el código Node.js funciona
// Ejecutar: node index-dev.js

require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.APP_PORT || 8080;

app.use(express.json());

// Simular BD en memoria
const items_db = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d000',
    nombre: 'Sample Item 1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d001',
    nombre: 'Sample Item 2',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d002',
    nombre: 'Sample Item 3',
    created_at: new Date().toISOString()
  }
];

// 1. GET /health - Sin consulta BD
app.get('/health', (req, res) => {
  const response = {
    status: 'API is running',
    timestamp: new Date().toISOString(),
    mode: 'DEV (no database)',
    node_version: process.version
  };

  console.log(`[GET] /health → 200 OK`);
  res.status(200).json(response);
});

// 2. GET /db-status - Simula BD
app.get('/db-status', (req, res) => {
  const response = {
    connection: true,
    db_time: new Date().toISOString(),
    mode: 'DEV (simulated database)',
    database: 'in-memory'
  };

  console.log(`[GET] /db-status → 200 OK (simulated)`);
  res.status(200).json(response);
});

// 3. GET /items - Retorna items en memoria
app.get('/items', (req, res) => {
  const response = {
    items: items_db.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    total: items_db.length,
    mode: 'DEV (in-memory)'
  };

  console.log(`[GET] /items → 200 OK (${items_db.length} items)`);
  res.status(200).json(response);
});

// 4. POST /items - Agrega item a memoria
app.post('/items', (req, res) => {
  const { nombre } = req.body;

  // Validar input
  if (!nombre || nombre.trim().length === 0) {
    console.log(`[POST] /items → 400 Bad Request`);
    return res.status(400).json({ error: 'nombre is required' });
  }

  const newItem = {
    id: uuidv4(),
    nombre: nombre.trim(),
    created_at: new Date().toISOString()
  };

  items_db.push(newItem);

  console.log(`[POST] /items → 201 Created (ID: ${newItem.id})`);
  res.status(201).json(newItem);
});

// Error 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║                                                ║');
  console.log(`║  🚀 DEV SERVER running (NO DATABASE)           ║`);
  console.log(`║                                                ║`);
  console.log(`║  → http://localhost:${PORT}                           ║`);
  console.log(`║  → Node.js: ${process.version.split('v')[1]}                              ║`);
  console.log('║  → Mode: Development (in-memory DB)            ║');
  console.log('║  → Database: Simulated                          ║');
  console.log('║                                                ║');
  console.log('║  Ready for testing! Press Ctrl+C to stop       ║');
  console.log('║                                                ║');
  console.log('╚════════════════════════════════════════════════╝\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n[SHUTDOWN] Closing server...');
  process.exit(0);
});
