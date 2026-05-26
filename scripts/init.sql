-- Script de inicialización de base de datos
-- Se ejecuta automáticamente cuando el contenedor MySQL inicia

-- Crear tabla items
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de ejemplo
INSERT INTO items (id, nombre, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Primer Item', NOW() - INTERVAL 2 DAY),
('550e8400-e29b-41d4-a716-446655440002', 'Segundo Item', NOW() - INTERVAL 1 DAY),
('550e8400-e29b-41d4-a716-446655440003', 'Tercer Item', NOW());

-- Ver estructura y datos
SELECT * FROM items;
