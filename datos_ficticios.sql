-- Script para poblar la base de datos con datos ficticios
-- Elimina todos los datos existentes y agrega transacciones de varios meses

-- Eliminar datos existentes
DELETE FROM transactions;
DELETE FROM user_balance;

-- Reiniciar secuencias
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE user_balance_id_seq RESTART WITH 1;

-- Insertar balance inicial
INSERT INTO user_balance (id, balance) VALUES (1, 0);

-- Datos ficticios para los últimos 6 meses
-- Octubre 2024
INSERT INTO transactions (type, category, amount, description, date) VALUES
('income', 'Salario', 850000, 'Salario octubre', '2024-10-01'),
('expense', 'Alimentación', 45000, 'Supermercado Jumbo', '2024-10-02'),
('expense', 'Transporte', 25000, 'Bencina auto', '2024-10-03'),
('expense', 'Vivienda', 180000, 'Arriendo departamento', '2024-10-05'),
('expense', 'Servicios', 35000, 'Cuenta de luz', '2024-10-07'),
('expense', 'Servicios', 28000, 'Internet y cable', '2024-10-08'),
('expense', 'Alimentación', 38000, 'Supermercado Santa Isabel', '2024-10-10'),
('expense', 'Entretenimiento', 15000, 'Cine con amigos', '2024-10-12'),
('expense', 'Salud', 22000, 'Farmacia medicamentos', '2024-10-14'),
('expense', 'Alimentación', 42000, 'Supermercado Lider', '2024-10-16'),
('expense', 'Transporte', 8000, 'Metro y micro', '2024-10-18'),
('expense', 'Ropa', 65000, 'Ropa de trabajo', '2024-10-20'),
('expense', 'Alimentación', 35000, 'Supermercado Tottus', '2024-10-22'),
('expense', 'Entretenimiento', 25000, 'Restaurante', '2024-10-24'),
('expense', 'Servicios', 18000, 'Cuenta de agua', '2024-10-26'),
('expense', 'Alimentación', 40000, 'Supermercado Unimarc', '2024-10-28'),
('expense', 'Transporte', 20000, 'Bencina auto', '2024-10-30'),

-- Noviembre 2024
('income', 'Salario', 850000, 'Salario noviembre', '2024-11-01'),
('income', 'Freelance', 120000, 'Proyecto web freelance', '2024-11-05'),
('expense', 'Alimentación', 48000, 'Supermercado Jumbo', '2024-11-02'),
('expense', 'Vivienda', 180000, 'Arriendo departamento', '2024-11-05'),
('expense', 'Servicios', 32000, 'Cuenta de luz', '2024-11-07'),
('expense', 'Servicios', 28000, 'Internet y cable', '2024-11-08'),
('expense', 'Transporte', 30000, 'Bencina auto', '2024-11-10'),
('expense', 'Alimentación', 41000, 'Supermercado Santa Isabel', '2024-11-12'),
('expense', 'Entretenimiento', 35000, 'Concierto', '2024-11-15'),
('expense', 'Alimentación', 39000, 'Supermercado Lider', '2024-11-17'),
('expense', 'Salud', 45000, 'Consulta médica', '2024-11-19'),
('expense', 'Alimentación', 37000, 'Supermercado Tottus', '2024-11-21'),
('expense', 'Transporte', 12000, 'Metro y micro', '2024-11-23'),
('expense', 'Entretenimiento', 28000, 'Restaurante familiar', '2024-11-25'),
('expense', 'Servicios', 19000, 'Cuenta de agua', '2024-11-27'),
('expense', 'Alimentación', 43000, 'Supermercado Unimarc', '2024-11-29'),

-- Diciembre 2024
('income', 'Salario', 850000, 'Salario diciembre', '2024-12-01'),
('income', 'Aguinaldo', 425000, 'Aguinaldo navideño', '2024-12-15'),
('expense', 'Alimentación', 52000, 'Supermercado Jumbo', '2024-12-02'),
('expense', 'Vivienda', 180000, 'Arriendo departamento', '2024-12-05'),
('expense', 'Servicios', 38000, 'Cuenta de luz', '2024-12-07'),
('expense', 'Servicios', 28000, 'Internet y cable', '2024-12-08'),
('expense', 'Transporte', 35000, 'Bencina auto', '2024-12-10'),
('expense', 'Alimentación', 45000, 'Supermercado Santa Isabel', '2024-12-12'),
('expense', 'Regalos', 85000, 'Regalos de navidad', '2024-12-15'),
('expense', 'Alimentación', 48000, 'Supermercado Lider', '2024-12-17'),
('expense', 'Entretenimiento', 45000, 'Cena de navidad', '2024-12-20'),
('expense', 'Alimentación', 55000, 'Supermercado para fiestas', '2024-12-22'),
('expense', 'Transporte', 15000, 'Metro y micro', '2024-12-23'),
('expense', 'Entretenimiento', 60000, 'Celebración año nuevo', '2024-12-31'),

-- Enero 2025
('income', 'Salario', 870000, 'Salario enero (aumento)', '2025-01-01'),
('expense', 'Alimentación', 46000, 'Supermercado Jumbo', '2025-01-03'),
('expense', 'Vivienda', 185000, 'Arriendo departamento (aumento)', '2025-01-05'),
('expense', 'Servicios', 42000, 'Cuenta de luz (verano)', '2025-01-07'),
('expense', 'Servicios', 30000, 'Internet y cable', '2025-01-08'),
('expense', 'Transporte', 28000, 'Bencina auto', '2025-01-10'),
('expense', 'Alimentación', 41000, 'Supermercado Santa Isabel', '2025-01-12'),
('expense', 'Salud', 35000, 'Exámenes médicos', '2025-01-14'),
('expense', 'Alimentación', 44000, 'Supermercado Lider', '2025-01-16'),
('expense', 'Entretenimiento', 22000, 'Cine', '2025-01-18'),
('expense', 'Alimentación', 38000, 'Supermercado Tottus', '2025-01-20'),
('expense', 'Transporte', 10000, 'Metro y micro', '2025-01-22'),
('expense', 'Ropa', 75000, 'Ropa de verano', '2025-01-24'),
('expense', 'Servicios', 20000, 'Cuenta de agua', '2025-01-26'),
('expense', 'Alimentación', 42000, 'Supermercado Unimarc', '2025-01-28'),
('expense', 'Entretenimiento', 30000, 'Restaurante', '2025-01-30'),

-- Febrero 2025 (hasta la fecha actual)
('income', 'Salario', 870000, 'Salario febrero', '2025-02-01'),
('expense', 'Alimentación', 47000, 'Supermercado Jumbo', '2025-02-02'),
('expense', 'Vivienda', 185000, 'Arriendo departamento', '2025-02-05'),
('expense', 'Servicios', 45000, 'Cuenta de luz', '2025-02-07'),
('expense', 'Servicios', 30000, 'Internet y cable', '2025-02-08'),
('expense', 'Transporte', 32000, 'Bencina auto', '2025-02-10'),
('expense', 'Alimentación', 43000, 'Supermercado Santa Isabel', '2025-02-12'),
('expense', 'Salud', 28000, 'Farmacia', '2025-02-14'),
('expense', 'Alimentación', 40000, 'Supermercado Lider', '2025-02-16'),
('expense', 'Entretenimiento', 25000, 'Salida con amigos', '2025-02-18'),
('expense', 'Alimentación', 39000, 'Supermercado Tottus', '2025-02-20'),
('expense', 'Transporte', 11000, 'Metro y micro', '2025-02-22'),
('expense', 'Educación', 55000, 'Curso online', '2025-02-24'),
('expense', 'Servicios', 21000, 'Cuenta de agua', '2025-02-26'),
('expense', 'Alimentación', 41000, 'Supermercado Unimarc', '2025-02-28'),

-- Marzo 2025
('income', 'Salario', 870000, 'Salario marzo', '2025-03-01'),
('expense', 'Alimentación', 44000, 'Supermercado Jumbo', '2025-03-03'),
('expense', 'Vivienda', 185000, 'Arriendo departamento', '2025-03-05'),
('expense', 'Servicios', 40000, 'Cuenta de luz', '2025-03-07'),
('expense', 'Servicios', 30000, 'Internet y cable', '2025-03-08'),
('expense', 'Transporte', 29000, 'Bencina auto', '2025-03-10'),
('expense', 'Alimentación', 42000, 'Supermercado Santa Isabel', '2025-03-12'),
('expense', 'Entretenimiento', 35000, 'Teatro', '2025-03-15'),
('expense', 'Alimentación', 38000, 'Supermercado Lider', '2025-03-17'),
('expense', 'Salud', 32000, 'Dentista', '2025-03-19'),
('expense', 'Alimentación', 41000, 'Supermercado Tottus', '2025-03-21'),
('expense', 'Transporte', 13000, 'Metro y micro', '2025-03-23'),
('expense', 'Ropa', 58000, 'Ropa de otoño', '2025-03-25'),
('expense', 'Servicios', 22000, 'Cuenta de agua', '2025-03-27'),
('expense', 'Alimentación', 39000, 'Supermercado Unimarc', '2025-03-29'),
('expense', 'Entretenimiento', 27000, 'Restaurante', '2025-03-31'),

-- Abril 2025
('income', 'Salario', 870000, 'Salario abril', '2025-04-01'),
('income', 'Freelance', 95000, 'Proyecto diseño', '2025-04-15'),
('expense', 'Alimentación', 46000, 'Supermercado Jumbo', '2025-04-02'),
('expense', 'Vivienda', 185000, 'Arriendo departamento', '2025-04-05'),
('expense', 'Servicios', 35000, 'Cuenta de luz', '2025-04-07'),
('expense', 'Servicios', 30000, 'Internet y cable', '2025-04-08'),
('expense', 'Transporte', 31000, 'Bencina auto', '2025-04-10'),
('expense', 'Alimentación', 43000, 'Supermercado Santa Isabel', '2025-04-12'),
('expense', 'Entretenimiento', 28000, 'Concierto', '2025-04-14'),
('expense', 'Alimentación', 40000, 'Supermercado Lider', '2025-04-16'),
('expense', 'Salud', 25000, 'Farmacia', '2025-04-18'),
('expense', 'Alimentación', 37000, 'Supermercado Tottus', '2025-04-20'),
('expense', 'Transporte', 14000, 'Metro y micro', '2025-04-22'),
('expense', 'Educación', 75000, 'Curso programación', '2025-04-24'),
('expense', 'Servicios', 23000, 'Cuenta de agua', '2025-04-26'),
('expense', 'Alimentación', 42000, 'Supermercado Unimarc', '2025-04-28'),
('expense', 'Entretenimiento', 33000, 'Cena familiar', '2025-04-30'),

-- Mayo 2025
('income', 'Salario', 890000, 'Salario mayo (aumento)', '2025-05-01'),
('expense', 'Alimentación', 48000, 'Supermercado Jumbo', '2025-05-03'),
('expense', 'Vivienda', 190000, 'Arriendo departamento (aumento)', '2025-05-05'),
('expense', 'Servicios', 33000, 'Cuenta de luz', '2025-05-07'),
('expense', 'Servicios', 32000, 'Internet y cable', '2025-05-08'),
('expense', 'Transporte', 28000, 'Bencina auto', '2025-05-10'),
('expense', 'Alimentación', 45000, 'Supermercado Santa Isabel', '2025-05-12'),
('expense', 'Entretenimiento', 40000, 'Día de la madre', '2025-05-14'),
('expense', 'Alimentación', 41000, 'Supermercado Lider', '2025-05-16'),
('expense', 'Salud', 38000, 'Exámenes anuales', '2025-05-18'),
('expense', 'Alimentación', 39000, 'Supermercado Tottus', '2025-05-20'),
('expense', 'Transporte', 12000, 'Metro y micro', '2025-05-22'),
('expense', 'Hogar', 65000, 'Electrodomésticos', '2025-05-24'),
('expense', 'Servicios', 24000, 'Cuenta de agua', '2025-05-26'),
('expense', 'Alimentación', 44000, 'Supermercado Unimarc', '2025-05-28'),
('expense', 'Entretenimiento', 29000, 'Cine y cena', '2025-05-30'),

-- Junio 2025
('income', 'Salario', 890000, 'Salario junio', '2025-06-01'),
('income', 'Bono', 150000, 'Bono por desempeño', '2025-06-15'),
('expense', 'Alimentación', 47000, 'Supermercado Jumbo', '2025-06-02'),
('expense', 'Vivienda', 190000, 'Arriendo departamento', '2025-06-05'),
('expense', 'Servicios', 38000, 'Cuenta de luz (invierno)', '2025-06-07'),
('expense', 'Servicios', 32000, 'Internet y cable', '2025-06-08'),
('expense', 'Transporte', 33000, 'Bencina auto', '2025-06-10'),
('expense', 'Alimentación', 46000, 'Supermercado Santa Isabel', '2025-06-12'),
('expense', 'Entretenimiento', 35000, 'Vacaciones de invierno', '2025-06-14'),
('expense', 'Alimentación', 43000, 'Supermercado Lider', '2025-06-16'),
('expense', 'Salud', 30000, 'Medicamentos invierno', '2025-06-18'),
('expense', 'Alimentación', 41000, 'Supermercado Tottus', '2025-06-20'),
('expense', 'Transporte', 15000, 'Metro y micro', '2025-06-22'),
('expense', 'Ropa', 85000, 'Ropa de invierno', '2025-06-24'),
('expense', 'Servicios', 25000, 'Cuenta de agua', '2025-06-26'),
('expense', 'Alimentación', 45000, 'Supermercado Unimarc', '2025-06-28'),
('expense', 'Entretenimiento', 32000, 'Restaurante', '2025-06-30'),

-- Julio 2025
('income', 'Salario', 890000, 'Salario julio', '2025-07-01'),
('expense', 'Alimentación', 49000, 'Supermercado Jumbo', '2025-07-03'),
('expense', 'Vivienda', 190000, 'Arriendo departamento', '2025-07-05'),
('expense', 'Servicios', 45000, 'Cuenta de luz (calefacción)', '2025-07-07'),
('expense', 'Servicios', 32000, 'Internet y cable', '2025-07-08'),
('expense', 'Transporte', 30000, 'Bencina auto', '2025-07-10'),
('expense', 'Alimentación', 48000, 'Supermercado Santa Isabel', '2025-07-12'),
('expense', 'Entretenimiento', 25000, 'Cine', '2025-07-14'),
('expense', 'Alimentación', 44000, 'Supermercado Lider', '2025-07-16'),
('expense', 'Salud', 35000, 'Consulta especialista', '2025-07-18'),
('expense', 'Alimentación', 42000, 'Supermercado Tottus', '2025-07-20'),
('expense', 'Transporte', 16000, 'Metro y micro', '2025-07-22'),
('expense', 'Educación', 85000, 'Certificación profesional', '2025-07-24'),
('expense', 'Servicios', 26000, 'Cuenta de agua', '2025-07-26'),
('expense', 'Alimentación', 46000, 'Supermercado Unimarc', '2025-07-28'),
('expense', 'Entretenimiento', 38000, 'Obra de teatro', '2025-07-30'),

-- Agosto 2025
('income', 'Salario', 890000, 'Salario agosto', '2025-08-01'),
('income', 'Freelance', 110000, 'Proyecto consultoría', '2025-08-10'),
('expense', 'Alimentación', 50000, 'Supermercado Jumbo', '2025-08-02'),
('expense', 'Vivienda', 190000, 'Arriendo departamento', '2025-08-05'),
('expense', 'Servicios', 42000, 'Cuenta de luz', '2025-08-07'),
('expense', 'Servicios', 32000, 'Internet y cable', '2025-08-08'),
('expense', 'Transporte', 34000, 'Bencina auto', '2025-08-10'),
('expense', 'Alimentación', 47000, 'Supermercado Santa Isabel', '2025-08-12'),
('expense', 'Entretenimiento', 45000, 'Fin de semana largo', '2025-08-14'),
('expense', 'Alimentación', 45000, 'Supermercado Lider', '2025-08-16'),
('expense', 'Salud', 28000, 'Farmacia', '2025-08-18'),
('expense', 'Alimentación', 43000, 'Supermercado Tottus', '2025-08-20'),
('expense', 'Transporte', 17000, 'Metro y micro', '2025-08-22'),
('expense', 'Hogar', 75000, 'Reparaciones casa', '2025-08-24'),
('expense', 'Servicios', 27000, 'Cuenta de agua', '2025-08-26'),
('expense', 'Alimentación', 48000, 'Supermercado Unimarc', '2025-08-28'),
('expense', 'Entretenimiento', 36000, 'Celebración cumpleaños', '2025-08-30');

-- Verificar que el balance se actualizó correctamente
SELECT 'Balance final:' as descripcion, balance FROM user_balance WHERE id = 1;

-- Mostrar resumen de transacciones por mes
SELECT 
  TO_CHAR(date, 'YYYY-MM') as mes,
  type,
  COUNT(*) as cantidad_transacciones,
  SUM(amount) as total_amount
FROM transactions 
GROUP BY TO_CHAR(date, 'YYYY-MM'), type 
ORDER BY mes, type;

-- Mostrar total de ingresos y gastos
SELECT 
  type,
  COUNT(*) as total_transacciones,
  SUM(amount) as total_amount
FROM transactions 
GROUP BY type;