import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración de Supabase usando variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script para corregir problemas específicos de balance
 */

async function fixBalanceIssues() {
  console.log('🔧 Corrigiendo problemas de balance...');
  
  try {
    // Verificar el estado actual de user_balance
    console.log('\n📊 Estado actual de user_balance:');
    const { data: allBalances, error: balanceError } = await supabase
      .from('user_balance')
      .select('user_id, balance, updated_at');
    
    if (balanceError) {
      console.error('❌ Error obteniendo balances:', balanceError.message);
      return;
    }

    console.log('Registros en user_balance:', allBalances.length);
    allBalances.forEach(balance => {
      console.log(`  Usuario: ${balance.user_id} - Balance: $${parseFloat(balance.balance).toFixed(2)}`);
    });

    // Obtener todos los usuarios únicos de transacciones
    const { data: users, error: usersError } = await supabase
      .from('transactions')
      .select('user_id')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError.message);
      return;
    }

    const uniqueUsers = [...new Set(users.map(u => u.user_id))];
    console.log('\n👥 Usuarios con transacciones:', uniqueUsers.length);

    // Verificar cada usuario y corregir si es necesario
    for (const userId of uniqueUsers) {
      await ensureUserBalance(userId);
    }

    console.log('\n✅ Proceso de corrección completado');

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

async function ensureUserBalance(userId) {
  try {
    console.log(`\n🔍 Procesando usuario: ${userId}`);
    
    // Calcular balance correcto desde transacciones
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

    console.log(`💰 Balance calculado: $${calculatedBalance.toFixed(2)}`);

    // Verificar si existe registro en user_balance
    const { data: existingBalance, error: checkError } = await supabase
      .from('user_balance')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle(); // Usar maybeSingle en lugar de single
    
    if (checkError) {
      console.error('❌ Error verificando balance existente:', checkError.message);
      return;
    }

    if (!existingBalance) {
      // No existe registro, crear uno nuevo
      console.log('📝 Creando nuevo registro de balance...');
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
      // Existe registro, verificar si necesita actualización
      const storedBalance = parseFloat(existingBalance.balance);
      const difference = Math.abs(calculatedBalance - storedBalance);
      
      console.log(`🏦 Balance almacenado: $${storedBalance.toFixed(2)}`);
      console.log(`📊 Diferencia: $${difference.toFixed(2)}`);
      
      if (difference > 0.01) {
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
        console.log('✅ Balance correcto, no requiere actualización');
      }
    }

  } catch (error) {
    console.error('💥 Error procesando usuario:', error.message);
  }
}

// Función para verificar el estado final
async function verifyFinalState() {
  console.log('\n🎯 Verificación final del estado:');
  
  try {
    const { data: balances, error } = await supabase
      .from('user_balance')
      .select('user_id, balance, updated_at')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error en verificación final:', error.message);
      return;
    }

    console.log('\n📊 Estado final de balances:');
    for (const balance of balances) {
      console.log(`\n👤 Usuario: ${balance.user_id}`);
      console.log(`💰 Balance: $${parseFloat(balance.balance).toFixed(2)}`);
      console.log(`📅 Actualizado: ${balance.updated_at}`);
      
      // Verificar que coincida con transacciones
      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', balance.user_id);
      
      const calculatedBalance = transactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount));
      }, 0);
      
      const difference = Math.abs(calculatedBalance - parseFloat(balance.balance));
      if (difference > 0.01) {
        console.log(`⚠️ Aún hay discrepancia: $${difference.toFixed(2)}`);
      } else {
        console.log('✅ Balance verificado correctamente');
      }
    }

  } catch (error) {
    console.error('💥 Error en verificación final:', error.message);
  }
}

// Ejecutar corrección
fixBalanceIssues().then(() => {
  setTimeout(verifyFinalState, 1000); // Esperar un segundo antes de verificar
});

export { fixBalanceIssues, verifyFinalState };