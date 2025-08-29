import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración de Supabase usando variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script para ver todos los usuarios en la base de datos
 */

async function viewAllUsers() {
  console.log('👥 Obteniendo información de usuarios...');
  
  try {
    // Obtener usuarios únicos desde transacciones
    console.log('\n📊 Usuarios con transacciones:');
    const { data: transactionUsers, error: transError } = await supabase
      .from('transactions')
      .select('user_id, created_at')
      .order('created_at', { ascending: false });
    
    if (transError) {
      console.error('❌ Error obteniendo usuarios de transacciones:', transError.message);
    } else {
      const uniqueTransactionUsers = [...new Set(transactionUsers.map(u => u.user_id))];
      console.log(`Total usuarios con transacciones: ${uniqueTransactionUsers.length}`);
      
      for (const userId of uniqueTransactionUsers) {
        const firstTransaction = transactionUsers.find(t => t.user_id === userId);
        console.log(`  📝 ${userId} (primera transacción: ${firstTransaction.created_at})`);
      }
    }

    // Obtener usuarios desde user_balance
    console.log('\n💰 Usuarios con balance:');
    const { data: balanceUsers, error: balanceError } = await supabase
      .from('user_balance')
      .select('user_id, balance, updated_at')
      .order('updated_at', { ascending: false });
    
    if (balanceError) {
      console.error('❌ Error obteniendo usuarios de balance:', balanceError.message);
    } else {
      console.log(`Total usuarios con balance: ${balanceUsers.length}`);
      
      for (const user of balanceUsers) {
        console.log(`  💰 ${user.user_id}`);
        console.log(`     Balance: $${parseFloat(user.balance).toFixed(2)}`);
        console.log(`     Actualizado: ${user.updated_at}`);
      }
    }

    // Obtener usuarios desde savings_goals
    console.log('\n🎯 Usuarios con metas de ahorro:');
    const { data: goalUsers, error: goalError } = await supabase
      .from('savings_goals')
      .select('user_id, title, target_amount, created_at')
      .order('created_at', { ascending: false });
    
    if (goalError) {
      console.error('❌ Error obteniendo usuarios de metas:', goalError.message);
    } else {
      const uniqueGoalUsers = [...new Set(goalUsers.map(g => g.user_id))];
      console.log(`Total usuarios con metas: ${uniqueGoalUsers.length}`);
      
      for (const userId of uniqueGoalUsers) {
        const userGoals = goalUsers.filter(g => g.user_id === userId);
        console.log(`  🎯 ${userId} (${userGoals.length} metas)`);
        userGoals.forEach(goal => {
          console.log(`     - ${goal.title}: $${parseFloat(goal.target_amount).toFixed(2)}`);
        });
      }
    }

    // Resumen consolidado
    console.log('\n📋 RESUMEN CONSOLIDADO:');
    const allUserIds = new Set();
    
    if (transactionUsers) {
      transactionUsers.forEach(t => allUserIds.add(t.user_id));
    }
    if (balanceUsers) {
      balanceUsers.forEach(b => allUserIds.add(b.user_id));
    }
    if (goalUsers) {
      goalUsers.forEach(g => allUserIds.add(g.user_id));
    }

    console.log(`\n👥 Total usuarios únicos en el sistema: ${allUserIds.size}`);
    
    for (const userId of allUserIds) {
      console.log(`\n🔍 Usuario: ${userId}`);
      
      // Contar transacciones
      const userTransactions = transactionUsers ? transactionUsers.filter(t => t.user_id === userId) : [];
      console.log(`  📝 Transacciones: ${userTransactions.length}`);
      
      // Mostrar balance
      const userBalance = balanceUsers ? balanceUsers.find(b => b.user_id === userId) : null;
      if (userBalance) {
        console.log(`  💰 Balance: $${parseFloat(userBalance.balance).toFixed(2)}`);
      } else {
        console.log(`  💰 Balance: No registrado`);
      }
      
      // Contar metas
      const userGoalsCount = goalUsers ? goalUsers.filter(g => g.user_id === userId).length : 0;
      console.log(`  🎯 Metas de ahorro: ${userGoalsCount}`);
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

// Función para ver detalles de un usuario específico
async function viewUserDetails(userId) {
  if (!userId) {
    console.log('❌ Se requiere un userId');
    return;
  }

  console.log(`🔍 Detalles del usuario: ${userId}`);
  
  try {
    // Transacciones del usuario
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (transError) {
      console.error('❌ Error obteniendo transacciones:', transError.message);
    } else {
      console.log(`\n📝 Transacciones (${transactions.length}):`);
      transactions.slice(0, 10).forEach((t, index) => {
        const sign = t.type === 'income' ? '+' : '-';
        console.log(`  ${index + 1}. ${sign}$${t.amount} - ${t.description} (${t.created_at})`);
      });
      if (transactions.length > 10) {
        console.log(`  ... y ${transactions.length - 10} más`);
      }
    }

    // Balance del usuario
    const { data: balance, error: balanceError } = await supabase
      .from('user_balance')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (balanceError) {
      console.log('\n💰 Balance: No registrado');
    } else {
      console.log(`\n💰 Balance: $${parseFloat(balance.balance).toFixed(2)}`);
      console.log(`   Actualizado: ${balance.updated_at}`);
    }

    // Metas del usuario
    const { data: goals, error: goalError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (goalError) {
      console.error('❌ Error obteniendo metas:', goalError.message);
    } else {
      console.log(`\n🎯 Metas de ahorro (${goals.length}):`);
      goals.forEach((goal, index) => {
        console.log(`  ${index + 1}. ${goal.title}`);
        console.log(`     Meta: $${parseFloat(goal.target_amount).toFixed(2)}`);
        console.log(`     Actual: $${parseFloat(goal.current_amount || 0).toFixed(2)}`);
        console.log(`     Creada: ${goal.created_at}`);
      });
    }

  } catch (error) {
    console.error('💥 Error obteniendo detalles:', error.message);
  }
}

// Ejecutar vista general
viewAllUsers();

// Exportar funciones para uso manual
export { viewAllUsers, viewUserDetails };

// Ejemplo de uso para ver detalles de un usuario específico:
// node -e "import('./view_users.js').then(m => m.viewUserDetails('295147a2-60d1-46e9-b8a4-79de02057fa9'))"