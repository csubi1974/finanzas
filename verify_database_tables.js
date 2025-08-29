import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración de Supabase usando variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vzduypgltddutfwgqahm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHV5cGdsdGRkdXRmd2dxYWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzM1MTgsImV4cCI6MjA3MTc0OTUxOH0.Z9RBwCcUPcYzmCmev745sgxc1qSNeimybb5960Id29o';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script para verificar qué tablas existen en la base de datos de Supabase
 * y diagnosticar el problema del user_balance
 */

async function verifyDatabaseTables() {
  console.log('🔍 Verificando tablas en la base de datos...');
  console.log('🔗 URL:', supabaseUrl);
  
  try {
    // Verificar tabla transactions
    console.log('\n📊 Verificando tabla transactions...');
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('count', { count: 'exact', head: true });
    
    if (transactionsError) {
      console.error('❌ Error en tabla transactions:', transactionsError.message);
    } else {
      console.log('✅ Tabla transactions existe - Total registros:', transactionsData);
    }

    // Verificar tabla user_balance
    console.log('\n💰 Verificando tabla user_balance...');
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balance')
      .select('count', { count: 'exact', head: true });
    
    if (balanceError) {
      console.error('❌ Error en tabla user_balance:', balanceError.message);
      console.log('🔧 La tabla user_balance no existe o no es accesible');
    } else {
      console.log('✅ Tabla user_balance existe - Total registros:', balanceData);
    }

    // Verificar tabla savings_goals
    console.log('\n🎯 Verificando tabla savings_goals...');
    const { data: goalsData, error: goalsError } = await supabase
      .from('savings_goals')
      .select('count', { count: 'exact', head: true });
    
    if (goalsError) {
      console.error('❌ Error en tabla savings_goals:', goalsError.message);
    } else {
      console.log('✅ Tabla savings_goals existe - Total registros:', goalsData);
    }

    // Verificar tabla custom_categories
    console.log('\n🏷️ Verificando tabla custom_categories...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('custom_categories')
      .select('count', { count: 'exact', head: true });
    
    if (categoriesError) {
      console.error('❌ Error en tabla custom_categories:', categoriesError.message);
    } else {
      console.log('✅ Tabla custom_categories existe - Total registros:', categoriesData);
    }

    // Si user_balance no existe, mostrar instrucciones
    if (balanceError) {
      console.log('\n🚨 PROBLEMA DETECTADO:');
      console.log('La tabla user_balance no existe en la base de datos.');
      console.log('\n📋 SOLUCIONES:');
      console.log('1. Ejecutar el archivo database_schema.sql en Supabase SQL Editor');
      console.log('2. Verificar que todas las tablas se crearon correctamente');
      console.log('3. Ejecutar fix_trigger.sql si es necesario');
      console.log('\n🔗 Accede a: https://supabase.com/dashboard/project/vzduypgltddutfwgqahm/sql');
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

// Función para verificar el balance actual calculado vs almacenado
async function compareBalances(userId) {
  if (!userId) {
    console.log('❌ Se requiere un userId para comparar balances');
    return;
  }

  try {
    console.log('\n🔄 Comparando balances...');
    
    // Obtener transacciones y calcular balance
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId);
    
    if (transError) {
      console.error('❌ Error obteniendo transacciones:', transError.message);
      return;
    }

    const calculatedBalance = transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount));
    }, 0);

    console.log('💰 Balance calculado desde transacciones:', calculatedBalance);

    // Intentar obtener balance almacenado
    const { data: storedBalance, error: balanceError } = await supabase
      .from('user_balance')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      console.log('❌ No se pudo obtener balance almacenado:', balanceError.message);
    } else {
      console.log('🏦 Balance almacenado en user_balance:', storedBalance.balance);
      
      const difference = Math.abs(calculatedBalance - parseFloat(storedBalance.balance));
      if (difference > 0.01) {
        console.log('⚠️ DISCREPANCIA DETECTADA:', difference);
      } else {
        console.log('✅ Los balances coinciden');
      }
    }

  } catch (error) {
    console.error('💥 Error comparando balances:', error.message);
  }
}

// Ejecutar verificación
verifyDatabaseTables();

// Exportar funciones para uso manual
export { verifyDatabaseTables, compareBalances };