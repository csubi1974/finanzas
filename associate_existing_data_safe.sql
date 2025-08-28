-- Script seguro para asociar datos existentes al usuario christian.subiabre@gmail.com
-- Este script verifica la existencia de columnas antes de ejecutar las actualizaciones
-- Ejecutar después de haber configurado RLS y autenticación

-- 1. Verificar que las columnas user_id existen en todas las tablas
DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    -- Verificar transactions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'user_id'
    ) THEN
        missing_columns := missing_columns || 'transactions.user_id, ';
    END IF;
    
    -- Verificar custom_categories
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_categories' AND column_name = 'user_id'
    ) THEN
        missing_columns := missing_columns || 'custom_categories.user_id, ';
    END IF;
    
    -- Verificar user_balance
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_balance' AND column_name = 'user_id'
    ) THEN
        missing_columns := missing_columns || 'user_balance.user_id, ';
    END IF;
    
    -- Verificar savings_goals
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'savings_goals' AND column_name = 'user_id'
    ) THEN
        missing_columns := missing_columns || 'savings_goals.user_id, ';
    END IF;
    
    -- Verificar goal_contributions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goal_contributions' AND column_name = 'user_id'
    ) THEN
        missing_columns := missing_columns || 'goal_contributions.user_id, ';
    END IF;
    
    -- Si faltan columnas, mostrar error
    IF missing_columns != '' THEN
        RAISE EXCEPTION 'FALTAN COLUMNAS user_id: %. Ejecuta primero add_user_id_columns.sql', 
            rtrim(missing_columns, ', ');
    END IF;
    
    RAISE NOTICE 'Todas las columnas user_id existen. Procediendo con la asociación de datos...';
END $$;

-- 2. Obtener el UUID del usuario por su email
-- (Este query te mostrará el UUID del usuario)
SELECT id, email FROM auth.users WHERE email = 'christian.subiabre@gmail.com';

-- 3. Asociar datos existentes al usuario
-- UUID del usuario: 295147a2-60d1-46e9-b8a4-79de02057fa9

-- Asociar transacciones existentes al usuario
UPDATE transactions 
SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
WHERE user_id IS NULL;

-- Asociar categorías personalizadas existentes al usuario
UPDATE custom_categories 
SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
WHERE user_id IS NULL;

-- Asociar balance de usuario existente
UPDATE user_balance 
SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
WHERE user_id IS NULL;

-- Asociar metas de ahorro existentes al usuario (si la tabla existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'savings_goals') THEN
        UPDATE savings_goals 
        SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
        WHERE user_id IS NULL;
        RAISE NOTICE 'Metas de ahorro asociadas al usuario';
    ELSE
        RAISE NOTICE 'Tabla savings_goals no existe, omitiendo...';
    END IF;
END $$;

-- Asociar contribuciones a metas existentes (si la tabla existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_contributions') THEN
        UPDATE goal_contributions 
        SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
        WHERE user_id IS NULL;
        RAISE NOTICE 'Contribuciones a metas asociadas al usuario';
    ELSE
        RAISE NOTICE 'Tabla goal_contributions no existe, omitiendo...';
    END IF;
END $$;

-- 4. Verificar que los datos se asociaron correctamente
SELECT 
  'transactions' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as con_user_id
FROM transactions
UNION ALL
SELECT 
  'custom_categories' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as con_user_id
FROM custom_categories
UNION ALL
SELECT 
  'user_balance' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as con_user_id
FROM user_balance;

-- 5. Verificar tablas opcionales si existen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'savings_goals') THEN
        RAISE NOTICE 'Verificando savings_goals...';
        PERFORM 1; -- Placeholder para futuras verificaciones
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_contributions') THEN
        RAISE NOTICE 'Verificando goal_contributions...';
        PERFORM 1; -- Placeholder para futuras verificaciones
    END IF;
END $$;

-- 6. Mostrar resumen de datos asociados al usuario
SELECT 
  u.email,
  u.id as user_id,
  (
    SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id
  ) as transacciones,
  (
    SELECT COUNT(*) FROM custom_categories cc WHERE cc.user_id = u.id
  ) as categorias_personalizadas
FROM auth.users u 
WHERE u.email = 'christian.subiabre@gmail.com';

-- Instrucciones de uso:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Si aparece error sobre columnas faltantes, ejecutar primero add_user_id_columns.sql
-- 3. Los UPDATE asociarán automáticamente todos los datos existentes al usuario
-- 4. Los queries de verificación mostrarán el resultado de la asociación
-- 5. Después de esto, el usuario podrá ver todos sus datos históricos