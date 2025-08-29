import OpenAI from 'openai';

// Configurar cliente de OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Solo para desarrollo, en producción usar backend
});

/**
 * Servicio para manejar consultas financieras con OpenAI
 */
export class FinancialChatService {
  constructor() {
    this.conversationHistory = [];
  }

  /**
   * Valida y limpia el contexto financiero
   * @param {Object} context - Contexto financiero del usuario
   * @returns {Object} - Contexto validado y limpio
   */
  validateFinancialContext(context) {
    if (!context) {
      return {
        balance: 0,
        transactions: [],
        monthlyIncome: 0,
        monthlyExpenses: 0,
        avgMonthlyIncome: 0,
        avgMonthlyExpenses: 0,
        savingsGoals: [],
        categoryAnalysis: {},
        spendingTrends: [],
        transactionCount: 0
      };
    }

    // Validar y limpiar datos numéricos
    const cleanNumber = (value) => {
      const num = parseFloat(value) || 0;
      return isNaN(num) ? 0 : num;
    };

    const validatedContext = {
      ...context,
      balance: cleanNumber(context.balance),
      monthlyIncome: cleanNumber(context.monthlyIncome),
      monthlyExpenses: cleanNumber(context.monthlyExpenses),
      avgMonthlyIncome: cleanNumber(context.avgMonthlyIncome),
      avgMonthlyExpenses: cleanNumber(context.avgMonthlyExpenses),
      transactions: Array.isArray(context.transactions) ? context.transactions : [],
      savingsGoals: Array.isArray(context.savingsGoals) ? context.savingsGoals : [],
      transactionCount: context.transactionCount || (context.transactions ? context.transactions.length : 0)
    };

    // Verificar consistencia de datos
    if (validatedContext.transactions.length > 0) {
      const calculatedTotal = validatedContext.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // Si hay una gran discrepancia, agregar nota de advertencia
      if (Math.abs(calculatedTotal - validatedContext.avgMonthlyExpenses * 3) > validatedContext.avgMonthlyExpenses) {
        validatedContext._dataWarning = 'Los datos pueden tener inconsistencias. Verificar cálculos.';
      }
    }

    return validatedContext;
  }

  /**
   * Verifica que los datos pertenezcan al usuario correcto
   * @param {Object} context - Contexto financiero
   * @param {Object} user - Usuario autenticado
   * @returns {boolean} - True si los datos son válidos para el usuario
   */
  validateUserData(context, user) {
    if (!user || !user.id) {
      console.warn('⚠️ Usuario no autenticado o sin ID');
      return false;
    }

    // Verificar que las transacciones tengan user_id correcto
    if (context.transactions && context.transactions.length > 0) {
      const invalidTransactions = context.transactions.filter(t => 
        t.user_id && t.user_id !== user.id
      );
      
      if (invalidTransactions.length > 0) {
        console.error('🚨 ALERTA DE SEGURIDAD: Transacciones de otros usuarios detectadas:', {
          usuarioActual: user.id,
          transaccionesInvalidas: invalidTransactions.length,
          ejemploInvalido: invalidTransactions[0]
        });
        return false;
      }
    }


    return true;
  }

  /**
   * Detecta inconsistencias específicas en los datos financieros
   * @param {Object} context - Contexto financiero validado
   * @returns {Array} - Lista de inconsistencias detectadas
   */
  detectDataInconsistencies(context) {
    const inconsistencies = [];

    // Verificar si los promedios mensuales son consistentes con las transacciones
    if (context.transactions && context.transactions.length > 0) {
      const expenseTransactions = context.transactions.filter(t => t.type === 'expense');
      const incomeTransactions = context.transactions.filter(t => t.type === 'income');
      
      const calculatedExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const calculatedIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // Verificar gastos
      if (Math.abs(calculatedExpenses - context.monthlyExpenses) > context.monthlyExpenses * 0.1) {
        inconsistencies.push(`Discrepancia en gastos: calculado $${calculatedExpenses.toLocaleString()} vs reportado $${context.monthlyExpenses.toLocaleString()}`);
      }

      // Verificar ingresos
      if (Math.abs(calculatedIncome - context.monthlyIncome) > context.monthlyIncome * 0.1) {
        inconsistencies.push(`Discrepancia en ingresos: calculado $${calculatedIncome.toLocaleString()} vs reportado $${context.monthlyIncome.toLocaleString()}`);
      }
    }

    // Verificar si los promedios son razonables
    if (context.avgMonthlyExpenses > context.monthlyExpenses * 5) {
      inconsistencies.push('El promedio mensual de gastos parece muy alto comparado con el mes actual');
    }

    if (context.avgMonthlyIncome > context.monthlyIncome * 5) {
      inconsistencies.push('El promedio mensual de ingresos parece muy alto comparado con el mes actual');
    }

    return inconsistencies;
  }

  /**
   * Procesa una consulta del usuario con contexto financiero
   * @param {string} userMessage - Mensaje del usuario
   * @param {Object} financialContext - Contexto financiero del usuario
   * @param {Object} user - Usuario autenticado
   * @returns {Promise<string>} - Respuesta del asistente
   */
  async processQuery(userMessage, financialContext, user) {
    try {
      // Validar y limpiar el contexto financiero
      const validatedContext = this.validateFinancialContext(financialContext);
      
      // Validar que los datos pertenezcan al usuario correcto
      if (!this.validateUserData(validatedContext, user)) {
        throw new Error('Error de seguridad: Los datos no pertenecen al usuario autenticado');
      }
      

      
      // Detectar inconsistencias en los datos
      const inconsistencies = this.detectDataInconsistencies(validatedContext);
      if (inconsistencies.length > 0) {
        validatedContext._inconsistencies = inconsistencies;

      }
      
      // Construir el contexto del sistema
      const systemPrompt = this.buildSystemPrompt(validatedContext);
      
      // Agregar mensaje del usuario al historial
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Preparar mensajes para OpenAI
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...this.conversationHistory.slice(-10) // Mantener solo los últimos 10 mensajes
      ];

      // Llamar a OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: messages,
        max_tokens: 500,
        temperature: 0.5,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const assistantResponse = completion.choices[0].message.content;
      
      // Agregar respuesta al historial
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantResponse
      });

      return assistantResponse;
    } catch (error) {
      console.error('Error en OpenAI:', error);
      throw new Error('Error al procesar la consulta. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Construye el prompt del sistema con contexto financiero
   * @param {Object} context - Contexto financiero del usuario
   * @returns {string} - Prompt del sistema
   */
  buildSystemPrompt(context) {
    const {
      balance = 0,
      transactions = [],
      monthlyIncome = 0,
      monthlyExpenses = 0,
      avgMonthlyIncome = 0,
      avgMonthlyExpenses = 0,
      savingsGoals = [],
      categoryAnalysis = {},
      spendingTrends = [],
      transactionCount = 0
    } = context;

    // Calcular estadísticas básicas
    const recentTransactions = transactions.slice(-10);
    const topCategories = this.getTopCategories(transactions);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Obtener información de fecha actual
    const currentDate = new Date();
    const dayOfMonth = currentDate.getDate();
    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    // Determinar período del mes para contexto
    let monthPeriod = '';
    let periodAdvice = '';
    
    if (dayOfMonth <= 10) {
      monthPeriod = 'INICIO DE MES';
      periodAdvice = '⚠️ IMPORTANTE: Estamos a inicio de mes. Es probable que aún no hayas realizado todos tus pagos fijos (renta, servicios, seguros). El saldo actual NO refleja tu ahorro real disponible.';
    } else if (dayOfMonth <= 20) {
      monthPeriod = 'MEDIADOS DE MES';
      periodAdvice = '📊 CONTEXTO: Estamos a mediados de mes. Algunos gastos fijos ya se han realizado, pero considera que aún pueden quedar pagos pendientes.';
    } else {
      monthPeriod = 'FIN DE MES';
      periodAdvice = '✅ CONTEXTO: Estamos cerca del fin de mes. La mayoría de gastos fijos ya se han realizado, por lo que el saldo actual es más representativo de tu capacidad de ahorro real.';
    }
    
    return `Eres un asistente financiero personal especializado en finanzas personales, economía, inversiones y el uso de esta aplicación financiera.

📈 ÁREAS DE ESPECIALIZACIÓN:
- Finanzas personales y gestión de presupuesto
- Análisis de inversiones (acciones, bonos, fondos, ETFs)
- Mercados financieros chilenos e internacionales
- Estrategias de ahorro e inversión
- Educación financiera y económica
- Uso de esta aplicación financiera

🚫 RESTRICCIONES:
- Evita temas completamente ajenos a finanzas como deportes, entretenimiento, política no económica, ciencia no financiera
- Para temas no financieros, redirige amablemente: "Como asistente financiero, me especializo en temas de finanzas e inversiones. ¿Te gustaría que te ayude con algún tema financiero?"

CONTEXTO FINANCIERO DEL USUARIO:
- Balance actual: $${balance.toLocaleString()}
- Total de transacciones registradas: ${transactionCount}

CONTEXTO TEMPORAL ACTUAL:
- Fecha de consulta: ${currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Día del mes: ${dayOfMonth} (${monthPeriod})
- ${periodAdvice}

RESUMEN DE GASTOS E INGRESOS:
- Gastos del mes actual: $${monthlyExpenses.toLocaleString()}
- Ingresos del mes actual: $${monthlyIncome.toLocaleString()}
- Promedio gastos últimos 3 meses: $${avgMonthlyExpenses.toLocaleString()}
- Promedio ingresos últimos 3 meses: $${avgMonthlyIncome.toLocaleString()}
- TOTAL HISTÓRICO de gastos: $${totalExpenses.toLocaleString()}
- TOTAL HISTÓRICO de ingresos: $${totalIncome.toLocaleString()}

METAS DE AHORRO:
- Metas activas: ${savingsGoals.length}

CATEGORÍAS MÁS UTILIZADAS:
${topCategories.map(cat => `- ${cat.name}: $${cat.total.toLocaleString()} (${cat.count} transacciones)`).join('\n')}

TRANSACCIONES RECIENTES (últimas 10):
${recentTransactions.map(t => `- ${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString()} - ${t.category} (${t.description || 'Sin descripción'})`).join('\n')}
${context._dataWarning ? `\n⚠️ ADVERTENCIA: ${context._dataWarning}` : ''}
${context._inconsistencies && context._inconsistencies.length > 0 ? `\n🔍 INCONSISTENCIAS DETECTADAS:\n${context._inconsistencies.map(inc => `- ${inc}`).join('\n')}` : ''}

REGLAS CRÍTICAS PARA EVITAR ERRORES:
1. 🎯 NUNCA des cifras sin especificar el período exacto
2. 📊 Cuando el usuario pregunte "gasto total", SIEMPRE pregunta qué período específico quiere:
   - Gastos del mes actual: $${monthlyExpenses.toLocaleString()}
   - Promedio mensual (3 meses): $${avgMonthlyExpenses.toLocaleString()}
   - Total histórico: $${totalExpenses.toLocaleString()}
   - ¿O se refiere a otro período específico?
3. 🔍 SIEMPRE verifica que los números que menciones coincidan exactamente con los datos proporcionados
4. ⚡ Si hay discrepancias en los datos, menciona que requieren verificación
5. 📝 Antes de responder con cifras, revisa dos veces que sean correctas
6. 🚫 NUNCA inventes o calcules cifras que no estén en el contexto
7. ✅ Si no estás seguro de un cálculo, pide aclaración al usuario
8. 💡 Enfócate principalmente en finanzas, economía, inversiones y uso de la aplicación
9. 📅 CONSIDERA SIEMPRE EL CONTEXTO TEMPORAL:
   - Si es INICIO DE MES: Sé conservador con recomendaciones de ahorro, advierte sobre gastos fijos pendientes
   - Si es MEDIADOS DE MES: Proporciona recomendaciones moderadas, considera gastos pendientes
   - Si es FIN DE MES: El saldo es más representativo, recomendaciones de ahorro más precisas

INSTRUCCIONES ADICIONALES:
- Responde en español de manera amigable y profesional
- Usa emojis ocasionalmente para hacer la conversación más amigable
- Proporciona consejos prácticos basados en datos reales
- Sé conversacional pero siempre preciso con los números
- Si detectas inconsistencias, sugiere verificar los datos
- Mantén las respuestas concisas pero informativas
- Siempre enfócate en educación financiera y mejores prácticas
- Para temas no financieros, redirige amablemente hacia finanzas e inversiones
- AJUSTA tus recomendaciones según el contexto temporal:
  * INICIO DE MES: "Considera que aún tienes gastos fijos pendientes antes de destinar dinero al ahorro"
  * MEDIADOS DE MES: "Ten en cuenta que pueden quedar algunos gastos por realizar este mes"
  * FIN DE MES: "Tu saldo actual es más representativo de tu capacidad real de ahorro"

TEMAS PERMITIDOS ÚNICAMENTE:
- Análisis de gastos e ingresos (especificando períodos exactos)
- Recomendaciones de ahorro
- Planificación de presupuesto
- Identificación de patrones de gasto
- Consejos para alcanzar metas financieras
- Explicación de conceptos financieros y económicos
- Aclaración de diferencias entre datos mensuales vs. históricos
- Uso y funcionalidades de la aplicación financiera
- Inversiones y productos financieros (incluyendo acciones, bonos, fondos mutuos)
- Mercado de valores chileno e internacional
- Análisis de acciones chilenas y recomendaciones de inversión
- Estrategias de inversión y diversificación de portafolio
- Educación financiera e inversiones
- Economía personal y familiar
- Renta fija y variable
- ETFs y fondos de inversión

Recuerda: NUNCA comprometas la precisión de los datos financieros, NUNCA salgas del ámbito financiero/económico, y SIEMPRE considera el contexto temporal (${monthPeriod}) al hacer recomendaciones de ahorro y análisis financiero.`;
  }

  /**
   * Obtiene las categorías más utilizadas
   * @param {Array} transactions - Lista de transacciones
   * @returns {Array} - Categorías ordenadas por uso
   */
  getTopCategories(transactions) {
    const categoryStats = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { name: category, total: 0, count: 0 };
      }
      categoryStats[category].total += parseFloat(transaction.amount);
      categoryStats[category].count += 1;
    });

    return Object.values(categoryStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  /**
   * Genera sugerencias automáticas basadas en el contexto
   * @param {Object} financialContext - Contexto financiero
   * @returns {Array} - Lista de sugerencias
   */
  generateSuggestions(financialContext) {
    const suggestions = [];
    const { balance, monthlyIncome, monthlyExpenses, transactions } = financialContext;

    // Sugerencia de ahorro
    if (monthlyIncome > monthlyExpenses) {
      const savingsPotential = monthlyIncome - monthlyExpenses;
      suggestions.push(`💰 Podrías ahorrar $${savingsPotential.toLocaleString()} mensuales`);
    }

    // Análisis de gastos
    if (transactions.length > 0) {
      const topCategories = this.getTopCategories(transactions);
      if (topCategories.length > 0) {
        suggestions.push(`📊 Tu mayor gasto es en ${topCategories[0].name}`);
      }
    }

    // Estado del balance
    if (balance < monthlyExpenses) {
      suggestions.push(`⚠️ Tu balance es menor a tus gastos mensuales`);
    }

    return suggestions;
  }

  /**
   * Limpia el historial de conversación
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Obtiene el historial de conversación
   * @returns {Array} - Historial de mensajes
   */
  getHistory() {
    return this.conversationHistory;
  }
}

// Instancia singleton del servicio
export const financialChatService = new FinancialChatService();