-- Script para configurar Row Level Security (RLS) y autenticación
-- Ejecutar después de crear las tablas básicas

-- 1. Habilitar Row Level Security en las tablas
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own categories" ON custom_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON custom_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON custom_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON custom_categories;

-- 3. Crear políticas para la tabla transactions
-- Política para SELECT (ver transacciones)
CREATE POLICY "Users can view own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Política para INSERT (crear transacciones)
CREATE POLICY "Users can insert own transactions" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (actualizar transacciones)
CREATE POLICY "Users can update own transactions" 
ON transactions FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Política para DELETE (eliminar transacciones)
CREATE POLICY "Users can delete own transactions" 
ON transactions FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Crear políticas para la tabla custom_categories
-- Política para SELECT (ver categorías)
CREATE POLICY "Users can view own categories" 
ON custom_categories FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Política para INSERT (crear categorías)
CREATE POLICY "Users can insert own categories" 
ON custom_categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (actualizar categorías)
CREATE POLICY "Users can update own categories" 
ON custom_categories FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Política para DELETE (eliminar categorías)
CREATE POLICY "Users can delete own categories" 
ON custom_categories FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Nota: Las columnas user_id y sus constraints deben agregarse primero
-- ejecutando el script add_user_id_columns.sql

-- 6. Crear función para limpiar datos huérfanos (opcional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS void AS $$
BEGIN
  -- Eliminar transacciones sin user_id válido
  DELETE FROM transactions 
  WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM auth.users);
  
  -- Eliminar categorías personalizadas sin user_id válido
  DELETE FROM custom_categories 
  WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM auth.users);
  
  RAISE NOTICE 'Datos huérfanos eliminados exitosamente';
END;
$$ LANGUAGE plpgsql;

-- 7. Crear función trigger para auto-asignar user_id en inserts
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-asignar el user_id del usuario autenticado
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear triggers para auto-asignar user_id
DROP TRIGGER IF EXISTS set_user_id_transactions ON transactions;
CREATE TRIGGER set_user_id_transactions
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_categories ON custom_categories;
CREATE TRIGGER set_user_id_categories
  BEFORE INSERT ON custom_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- 9. Verificar configuración
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('transactions', 'custom_categories');

-- Mostrar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('transactions', 'custom_categories');

-- Comentarios finales
COMMENT ON TABLE transactions IS 'Tabla de transacciones con RLS habilitado para separación por usuario';
COMMENT ON TABLE custom_categories IS 'Tabla de categorías personalizadas con RLS habilitado para separación por usuario';

-- Instrucciones de uso:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Verificar que no hay errores
-- 3. Probar autenticación desde la aplicación
-- 4. Los triggers auto-asignarán user_id en nuevos registros
-- 5. Las políticas RLS garantizan separación de datos por usuario