-- Create custom_categories table with support for NULL user_id
CREATE TABLE IF NOT EXISTS custom_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    icon VARCHAR(10) DEFAULT '📁', -- Emoji icon
    is_income BOOLEAN DEFAULT FALSE, -- TRUE for income categories, FALSE for expense categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for category name per user (allowing NULL user_id)
DROP INDEX IF EXISTS idx_custom_categories_user_name;
CREATE UNIQUE INDEX idx_custom_categories_user_name ON custom_categories(COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

-- Enable Row Level Security for custom_categories
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own custom categories" ON custom_categories;
DROP POLICY IF EXISTS "Users can insert their own custom categories" ON custom_categories;
DROP POLICY IF EXISTS "Users can update their own custom categories" ON custom_categories;
DROP POLICY IF EXISTS "Users can delete their own custom categories" ON custom_categories;
DROP POLICY IF EXISTS "Allow public access to custom categories" ON custom_categories;

-- Create policies that allow operations for authenticated users OR NULL user_id (public access)
CREATE POLICY "Users can view their own custom categories or public categories" ON custom_categories
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own custom categories or public categories" ON custom_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own custom categories or public categories" ON custom_categories
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own custom categories or public categories" ON custom_categories
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Insert some default categories for testing
INSERT INTO custom_categories (user_id, name, color, icon, is_income) VALUES
(NULL, 'Alimentación', '#FF6B6B', '🍽️', false),
(NULL, 'Transporte', '#4ECDC4', '🚗', false),
(NULL, 'Entretenimiento', '#45B7D1', '🎬', false),
(NULL, 'Salario', '#96CEB4', '💰', true),
(NULL, 'Freelance', '#FFEAA7', '💻', true)
ON CONFLICT DO NOTHING;