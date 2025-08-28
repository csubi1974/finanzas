-- Script para agregar columnas user_id a las tablas existentes
-- Ejecutar ANTES del setup_auth_rls.sql

-- 1. Agregar columna user_id a la tabla transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Agregar columna user_id a la tabla user_balance
ALTER TABLE user_balance 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Agregar columna user_id a la tabla savings_goals
ALTER TABLE savings_goals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Agregar columna user_id a la tabla custom_categories
ALTER TABLE custom_categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Agregar columna user_id a la tabla goal_contributions
ALTER TABLE goal_contributions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Crear constraint único para user_balance.user_id
ALTER TABLE user_balance 
DROP CONSTRAINT IF EXISTS user_balance_user_id_key;

ALTER TABLE user_balance 
ADD CONSTRAINT user_balance_user_id_key UNIQUE (user_id);

-- 7. Verificar que las columnas se agregaron correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('transactions', 'user_balance', 'savings_goals', 'custom_categories', 'goal_contributions')
    AND column_name = 'user_id'
ORDER BY table_name;

-- Comentarios:
-- 1. Ejecutar este script primero en Supabase SQL Editor
-- 2. Luego ejecutar setup_auth_rls.sql
-- 3. Las columnas user_id permitirán NULL inicialmente para datos existentes
-- 4. Los nuevos registros tendrán user_id asignado automáticamente por triggers