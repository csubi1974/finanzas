import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Vista simple de usuarios en el sistema
 */

async function showUsers() {
  console.log('👥 USUARIOS EN EL SISTEMA DE FINANZAS');
  console.log('=====================================\n');
  
  try {
    // Obtener usuarios únicos desde transacciones
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('user_id, created_at')
      .order('created_at', { ascending: true });
    
    if (transError) {
      console.error('❌ Error:', transError.message);
      return;
    }

    // Obtener usuarios únicos
    const uniqueUsers = [...new Set(transactions.map(t => t.user_id))];
    
    console.log(`📊 Total de usuarios: ${uniqueUsers.length}\n`);

    // Mostrar información de cada usuario
    for (let i = 0; i < uniqueUsers.length; i++) {
      const userId = uniqueUsers[i];
      console.log(`👤 USUARIO ${i + 1}`);
      console.log(`🆔 ID: ${userId}`);
      
      // Obtener primera transacción (registro)
      const firstTransaction = transactions.find(t => t.user_id === userId);
      console.log(`📅 Registrado: ${new Date(firstTransaction.created_at).toLocaleDateString('es-ES')}`);
      
      // Contar transacciones
      const userTransactions = transactions.filter(t => t.user_id === userId);
      console.log(`📝 Transacciones: ${userTransactions.length}`);
      
      // Obtener balance actual
      const { data: balance } = await supabase
        .from('user_balance')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (balance) {
        const balanceAmount = parseFloat(balance.balance);
        const formattedBalance = new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD'
        }).format(balanceAmount);
        console.log(`💰 Balance actual: ${formattedBalance}`);
      } else {
        console.log(`💰 Balance actual: No disponible`);
      }
      
      console.log('─'.repeat(50));
    }

    // Mostrar estadísticas generales
    console.log('\n📈 ESTADÍSTICAS GENERALES:');
    console.log(`• Total usuarios: ${uniqueUsers.length}`);
    console.log(`• Total transacciones: ${transactions.length}`);
    
    // Calcular balance total del sistema
    let totalSystemBalance = 0;
    for (const userId of uniqueUsers) {
      const { data: balance } = await supabase
        .from('user_balance')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (balance) {
        totalSystemBalance += parseFloat(balance.balance);
      }
    }
    
    const formattedTotal = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(totalSystemBalance);
    console.log(`• Balance total del sistema: ${formattedTotal}`);

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Función para mostrar detalles de un usuario específico
async function showUserDetails(userIndex) {
  try {
    // Obtener lista de usuarios
    const { data: transactions } = await supabase
      .from('transactions')
      .select('user_id')
      .order('created_at', { ascending: true });
    
    const uniqueUsers = [...new Set(transactions.map(t => t.user_id))];
    
    if (userIndex < 1 || userIndex > uniqueUsers.length) {
      console.log(`❌ Usuario no válido. Usa un número entre 1 y ${uniqueUsers.length}`);
      return;
    }
    
    const userId = uniqueUsers[userIndex - 1];
    console.log(`\n🔍 DETALLES DEL USUARIO ${userIndex}`);
    console.log(`🆔 ID: ${userId}`);
    
    // Obtener transacciones del usuario
    const { data: userTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    console.log(`\n📝 ÚLTIMAS 5 TRANSACCIONES:`);
    userTransactions.slice(0, 5).forEach((t, index) => {
      const sign = t.type === 'income' ? '+' : '-';
      const amount = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
      }).format(parseFloat(t.amount));
      const date = new Date(t.created_at).toLocaleDateString('es-ES');
      console.log(`  ${index + 1}. ${sign}${amount} - ${t.description} (${date})`);
    });
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Ejecutar vista de usuarios
showUsers();

// Exportar funciones
export { showUsers, showUserDetails };

// Instrucciones de uso
console.log('\n💡 COMANDOS ÚTILES:');
console.log('• Para ver detalles del usuario 1: node -e "import(\'./simple_users_view.js\').then(m => m.showUserDetails(1))"');
console.log('• Para ver detalles del usuario 2: node -e "import(\'./simple_users_view.js\').then(m => m.showUserDetails(2))"');