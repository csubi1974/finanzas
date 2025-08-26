-- Script para corregir el trigger de balance

-- Función corregida para actualizar el balance automáticamente
CREATE OR REPLACE FUNCTION update_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular el nuevo balance basado en todas las transacciones
  UPDATE user_balance 
  SET balance = (
    SELECT COALESCE(
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 
      0
    )
    FROM transactions
  ),
  updated_at = NOW()
  WHERE id = 1;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recrear los triggers
DROP TRIGGER IF EXISTS update_balance_on_insert ON transactions;
DROP TRIGGER IF EXISTS update_balance_on_update ON transactions;
DROP TRIGGER IF EXISTS update_balance_on_delete ON transactions;

CREATE TRIGGER update_balance_on_insert
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_balance();

CREATE TRIGGER update_balance_on_update
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_balance();

CREATE TRIGGER update_balance_on_delete
  AFTER DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_balance();

-- Asegurar que existe un registro de balance
INSERT INTO user_balance (id, balance) 
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;