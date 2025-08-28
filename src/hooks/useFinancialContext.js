import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient.js';

/**
 * Hook personalizado para obtener y procesar el contexto financiero del usuario
 * @param {Object} user - Usuario autenticado
 * @returns {Object} - Contexto financiero procesado
 */
export const useFinancialContext = (user) => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos financieros del usuario
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadFinancialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cargar transacciones
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(100); // Últimas 100 transacciones

        if (transactionsError) throw transactionsError;

        // Cargar balance del usuario
        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balance')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (balanceError && balanceError.code !== 'PGRST116') {
          throw balanceError;
        }

        // Cargar metas de ahorro
        const { data: goalsData, error: goalsError } = await supabase
          .from('savings_goals')
          .select(`
            *,
            goal_contributions(
              amount,
              date
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (goalsError) throw goalsError;

        // Cargar categorías personalizadas
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('custom_categories')
          .select('*')
          .eq('user_id', user.id);

        if (categoriesError) throw categoriesError;

        // Log de depuración para verificar datos cargados
        console.log('📊 Datos cargados para usuario:', user.id, {
          transacciones: transactionsData?.length || 0,
          balance: balanceData?.balance || 0,
          metasAhorro: goalsData?.length || 0,
          categorias: categoriesData?.length || 0,
          primeraTransaccion: transactionsData?.[0]
        });

        // Actualizar estados
        setTransactions(transactionsData || []);
        setBalance(balanceData?.balance || 0);
        setSavingsGoals(goalsData || []);
        setCustomCategories(categoriesData || []);

      } catch (err) {
        console.error('Error cargando datos financieros:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadFinancialData();
  }, [user?.id]);

  // Procesar contexto financiero
  const financialContext = useMemo(() => {
    if (!user || isLoading) {
      return null;
    }

    // Calcular estadísticas de transacciones
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Transacciones del mes actual
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    // Calcular ingresos y gastos mensuales
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calcular promedios de los últimos 3 meses
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) >= threeMonthsAgo
    );

    const avgMonthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3;

    const avgMonthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3;

    // Análisis por categorías
    const categoryAnalysis = {};
    transactions.forEach(transaction => {
      const category = transaction.category;
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          total: 0,
          count: 0,
          type: transaction.type
        };
      }
      categoryAnalysis[category].total += parseFloat(transaction.amount);
      categoryAnalysis[category].count += 1;
    });

    // Metas de ahorro con progreso
    const goalsWithProgress = savingsGoals.map(goal => {
      const contributions = goal.goal_contributions || [];
      const totalContributed = contributions.reduce((sum, contrib) => 
        sum + parseFloat(contrib.amount), 0
      );
      const progress = (totalContributed / parseFloat(goal.target_amount)) * 100;
      
      return {
        ...goal,
        totalContributed,
        progress: Math.min(progress, 100),
        isCompleted: totalContributed >= parseFloat(goal.target_amount)
      };
    });

    // Tendencias de gasto (últimos 6 meses)
    const spendingTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === month && tDate.getFullYear() === year;
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      spendingTrends.push({
        month: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        income,
        expenses,
        net: income - expenses
      });
    }

    return {
      // Datos básicos
      balance,
      transactions,
      savingsGoals: goalsWithProgress,
      customCategories,
      
      // Estadísticas mensuales
      monthlyIncome,
      monthlyExpenses,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      
      // Análisis
      categoryAnalysis,
      spendingTrends,
      
      // Métricas calculadas
      savingsRate: avgMonthlyIncome > 0 ? ((avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome) * 100 : 0,
      totalSavingsGoals: goalsWithProgress.reduce((sum, goal) => sum + parseFloat(goal.target_amount), 0),
      totalSavingsProgress: goalsWithProgress.reduce((sum, goal) => sum + goal.totalContributed, 0),
      
      // Estado financiero
      financialHealth: {
        hasEmergencyFund: balance >= (avgMonthlyExpenses * 3),
        isOverspending: avgMonthlyExpenses > avgMonthlyIncome,
        savingsGoalProgress: goalsWithProgress.length > 0 ? 
          goalsWithProgress.reduce((sum, goal) => sum + goal.progress, 0) / goalsWithProgress.length : 0
      },
      
      // Metadatos
      lastUpdated: new Date(),
      transactionCount: transactions.length,
      activeGoalsCount: goalsWithProgress.filter(goal => !goal.isCompleted).length
    };
  }, [user, transactions, balance, savingsGoals, customCategories, isLoading]);

  return {
    financialContext,
    isLoading,
    error,
    refreshData: () => {
      // Trigger re-fetch by updating a dependency
      setIsLoading(true);
    }
  };
};

export default useFinancialContext;