-- Crear tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear tabla de balance del usuario
CREATE TABLE IF NOT EXISTS user_balance (
  id BIGSERIAL PRIMARY KEY,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar balance inicial si no existe
INSERT INTO user_balance (id, balance) 
SELECT 1, 0 
WHERE NOT EXISTS (SELECT 1 FROM user_balance WHERE id = 1)
ON CONFLICT (id) DO NOTHING;

-- Función para actualizar el balance automáticamente
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
  WHERE id = 1; -- Especificar qué fila actualizar
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar balance automáticamente
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

-- Habilitar RLS (Row Level Security) si es necesario
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;

-- Crear tabla de metas de ahorro
CREATE TABLE IF NOT EXISTS savings_goals (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  target_date DATE,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear tabla de contribuciones a metas
CREATE TABLE IF NOT EXISTS goal_contributions (
  id BIGSERIAL PRIMARY KEY,
  goal_id BIGINT REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Función para actualizar el monto actual de una meta
CREATE OR REPLACE FUNCTION update_goal_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el monto actual de la meta
  UPDATE savings_goals 
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM goal_contributions
    WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id)
  ),
  updated_at = NOW(),
  is_completed = (
    SELECT COALESCE(SUM(amount), 0) >= target_amount
    FROM goal_contributions
    WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id)
  )
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar metas automáticamente
DROP TRIGGER IF EXISTS update_goal_on_contribution_insert ON goal_contributions;
DROP TRIGGER IF EXISTS update_goal_on_contribution_update ON goal_contributions;
DROP TRIGGER IF EXISTS update_goal_on_contribution_delete ON goal_contributions;

CREATE TRIGGER update_goal_on_contribution_insert
  AFTER INSERT ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_amount();

CREATE TRIGGER update_goal_on_contribution_update
  AFTER UPDATE ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_amount();

CREATE TRIGGER update_goal_on_contribution_delete
  AFTER DELETE ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_amount();

-- Habilitar RLS para las nuevas tablas
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir acceso público (puedes modificar esto según tus necesidades)
CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on user_balance" ON user_balance
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on savings_goals" ON savings_goals
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on goal_contributions" ON goal_contributions
  FOR ALL USING (true);

-- Create custom_categories table
CREATE TABLE custom_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    icon VARCHAR(10) DEFAULT '📁', -- Emoji icon
    is_income BOOLEAN DEFAULT FALSE, -- TRUE for income categories, FALSE for expense categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for category name per user
CREATE UNIQUE INDEX idx_custom_categories_user_name ON custom_categories(user_id, name);

-- Enable Row Level Security for custom_categories
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_categories
CREATE POLICY "Users can view their own custom categories" ON custom_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom categories" ON custom_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories" ON custom_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories" ON custom_categories
    FOR DELETE USING (auth.uid() = user_id);