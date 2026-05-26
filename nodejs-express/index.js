require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Configuración de variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dbapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const APP_PORT = process.env.APP_PORT || 8080;
const APP_HOST = process.env.APP_HOST || '0.0.0.0';

// Pool de conexiones
let pool;

// Inicializar pool de conexiones
async function initializePool() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ MySQL connection pool created');
    
    // Probar conexión
    const conn = await pool.getConnection();
    console.log('✅ Successfully connected to database');
    conn.release();
  } catch (error) {
    console.error('❌ Failed to create connection pool:', error.message);
    process.exit(1);
  }
}

// GET /health - Sin consulta a BD
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// GET /db-status - Consulta la BD
app.get('/db-status', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT NOW() as db_time');
    conn.release();

    res.status(200).json({
      status: 'Database connection successful',
      connection: true,
      timestamp: new Date().toISOString(),
      db_time: rows[0]?.db_time?.toISOString() || null,
    });
  } catch (error) {
    console.error('Database query failed:', error.message);
    res.status(500).json({
      status: `Database query failed: ${error.message}`,
      connection: false,
      timestamp: new Date().toISOString(),
      db_time: null,
    });
  }
});

// GET /items - Lista todos los items
app.get('/items', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Failed to fetch items:', error.message);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /items - Crea un nuevo item
app.post('/items', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'Field "nombre" is required' });
  }

  const id = uuidv4();
  const created_at = new Date();

  try {
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
  } catch (error) {
    console.error('Failed to insert item:', error.message);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Iniciar servidor
async function startServer() {
  await initializePool();

  app.listen(APP_PORT, APP_HOST, () => {
    console.log(`🚀 Server running at http://${APP_HOST}:${APP_PORT}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
