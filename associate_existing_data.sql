-- Script para asociar datos existentes al usuario christian.subiabre@gmail.com
-- Ejecutar después de haber configurado RLS y autenticación

-- 1. Obtener el UUID del usuario por su email
-- (Este query te mostrará el UUID del usuario)
SELECT id, email FROM auth.users WHERE email = 'christian.subiabre@gmail.com';

-- 2. Asociar transacciones existentes al usuario
-- UUID del usuario: 295147a2-60d1-46e9-b8a4-79de02057fa9
UPDATE transactions 
SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
WHERE user_id IS NULL;

-- 3. Asociar categorías personalizadas existentes al usuario
UPDATE custom_categories 
SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
WHERE user_id IS NULL;

-- 4. Asociar balance de usuario existente
UPDATE user_balance 
SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
WHERE user_id IS NULL;

-- 5. Asociar metas de ahorro existentes al usuario
UPDATE savings_goals 
SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
WHERE user_id IS NULL;

-- 6. Asociar contribuciones a metas existentes
UPDATE goal_contributions 
SET user_id = '295147a2-60d1-46e9-b8a4-79de02057fa9'
WHERE user_id IS NULL;

-- 7. Verificar que los datos se asociaron correctamente
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
FROM user_balance
UNION ALL
SELECT 
  'savings_goals' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as con_user_id
FROM savings_goals
UNION ALL
SELECT 
  'goal_contributions' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as con_user_id
FROM goal_contributions;

-- 8. Mostrar resumen de datos asociados al usuario
SELECT 
  u.email,
  u.id as user_id,
  (
    SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id
  ) as transacciones,
  (
    SELECT COUNT(*) FROM custom_categories cc WHERE cc.user_id = u.id
  ) as categorias_personalizadas,
  (
    SELECT COUNT(*) FROM savings_goals sg WHERE sg.user_id = u.id
  ) as metas_ahorro,
  (
    SELECT COUNT(*) FROM goal_contributions gc WHERE gc.user_id = u.id
  ) as contribuciones_metas
FROM auth.users u 
WHERE u.email = 'christian.subiabre@gmail.com';

-- Instrucciones de uso:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Primero ejecutar el query SELECT para obtener el UUID del usuario
-- 3. Los UPDATE asociarán automáticamente todos los datos existentes al usuario
-- 4. Los queries de verificación mostrarán el resultado de la asociación
-- 5. Después de esto, el usuario podrá ver todos sus datos históricos