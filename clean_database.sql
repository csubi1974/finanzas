-- Script para limpiar completamente la base de datos
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos de la aplicación
-- Úsalo solo si estás seguro de que quieres empezar desde cero

-- 1. Eliminar todas las transacciones
DELETE FROM transactions;

-- 2. Eliminar todas las categorías personalizadas
DELETE FROM custom_categories;

-- 3. Reiniciar secuencias (si las hay)
-- Nota: En PostgreSQL con UUID no hay secuencias, pero incluimos por completitud

-- 4. Verificar que las tablas estén vacías
SELECT 'transactions' as tabla, COUNT(*) as registros FROM transactions
UNION ALL
SELECT 'custom_categories' as tabla, COUNT(*) as registros FROM custom_categories;

-- 5. Opcional: Reinsertar categorías por defecto
-- Descomenta las siguientes líneas si quieres mantener las categorías básicas

/*
INSERT INTO custom_categories (user_id, name, color, icon, is_income) VALUES
(NULL, 'Alimentación', '#FF6B6B', '🍽️', false),
(NULL, 'Transporte', '#4ECDC4', '🚗', false),
(NULL, 'Entretenimiento', '#45B7D1', '🎬', false),
(NULL, 'Salud', '#A8E6CF', '🏥', false),
(NULL, 'Educación', '#FFD93D', '📚', false),
(NULL, 'Compras', '#FF8B94', '🛒', false),
(NULL, 'Servicios', '#B4A7D6', '🔧', false),
(NULL, 'Otros Gastos', '#C7CEEA', '📦', false),
(NULL, 'Salario', '#96CEB4', '💰', true),
(NULL, 'Freelance', '#FFEAA7', '💻', true),
(NULL, 'Inversiones', '#DDA0DD', '📈', true),
(NULL, 'Otros Ingresos', '#98FB98', '💵', true)
ON CONFLICT DO NOTHING;
*/

-- Mensaje de confirmación
SELECT '✅ Base de datos limpiada exitosamente' as resultado;