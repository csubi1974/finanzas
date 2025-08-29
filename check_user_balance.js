import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración de Supabase usando variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script para verificar y comparar el balance del usuario
 * con el total calculado de las transacciones
 */

async function checkUserBalance() {
  console.log('🔍 Verificando balance del usuario...');
  
  try {
    // Primero, obtener todos los usuarios que tienen transacciones
    console.log('\n👥 Obteniendo usuarios con transacciones...');
    const { data: users, error: usersError } = await supabase
      .from('transactions')
      .select('user_id')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError.message);
      return;
    }

    // Obtener usuarios únicos
    const uniqueUsers = [...new Set(users.map(u => u.user_id))];
    console.log('📊 Usuarios encontrados:', uniqueUsers.length);

    // Verificar cada usuario
    for (const userId of uniqueUsers) {
      console.log(`\n🔍 Verificando usuario: ${userId}`);
      await compareUserBalance(userId);
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

async function compareUserBalance(userId) {
  try {
    // Obtener todas las transacciones del usuario
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('type, amount, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (transError) {
      console.error('❌ Error obteniendo transacciones:', transError.message);
      return;
    }

    console.log(`📝 Total transacciones: ${transactions.length}`);

    // Calcular balance desde transacciones
    let calculatedBalance = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'income') {
        totalIncome += amount;
        calculatedBalance += amount;
      } else {
        totalExpenses += amount;
        calculatedBalance -= amount;
      }
    });

    console.log(`💰 Ingresos totales: $${totalIncome.toFixed(2)}`);
    console.log(`💸 Gastos totales: $${totalExpenses.toFixed(2)}`);
    console.log(`🧮 Balance calculado: $${calculatedBalance.toFixed(2)}`);

    // Obtener balance almacenado en user_balance
    const { data: storedBalanceData, error: balanceError } = await supabase
      .from('user_balance')
      .select('balance, updated_at')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      console.log('❌ No hay registro en user_balance:', balanceError.message);
      console.log('🔧 Creando registro inicial...');
      
      // Crear registro inicial
      const { error: insertError } = await supabase
        .from('user_balance')
        .insert({
          user_id: userId,
          balance: calculatedBalance
        });
      
      if (insertError) {
        console.error('❌ Error creando registro:', insertError.message);
      } else {
        console.log('✅ Registro creado exitosamente');
      }
    } else {
      const storedBalance = parseFloat(storedBalanceData.balance);
      console.log(`🏦 Balance almacenado: $${storedBalance.toFixed(2)}`);
      console.log(`📅 Última actualización: ${storedBalanceData.updated_at}`);
      
      const difference = Math.abs(calculatedBalance - storedBalance);
      console.log(`📊 Diferencia: $${difference.toFixed(2)}`);
      
      if (difference > 0.01) {
        console.log('⚠️ DISCREPANCIA DETECTADA!');
        console.log('🔧 Actualizando balance...');
        
        const { error: updateError } = await supabase
          .from('user_balance')
          .update({ balance: calculatedBalance })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('❌ Error actualizando balance:', updateError.message);
        } else {
          console.log('✅ Balance actualizado correctamente');
        }
      } else {
        console.log('✅ Los balances coinciden');
      }
    }

    // Mostrar últimas transacciones para contexto
    if (transactions.length > 0) {
      console.log('\n📋 Últimas 3 transacciones:');
      transactions.slice(-3).forEach((t, index) => {
        const sign = t.type === 'income' ? '+' : '-';
        console.log(`  ${index + 1}. ${sign}$${t.amount} - ${t.description} (${t.created_at})`);
      });
    }

  } catch (error) {
    console.error('💥 Error verificando usuario:', error.message);
  }
}

// Función para verificar un usuario específico
async function checkSpecificUser(userId) {
  console.log(`🎯 Verificando usuario específico: ${userId}`);
  await compareUserBalance(userId);
}

// Ejecutar verificación
checkUserBalance();

// Exportar funciones para uso manual
export { checkUserBalance, checkSpecificUser };