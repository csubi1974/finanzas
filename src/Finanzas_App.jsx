import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AuthComponent from './AuthComponent';
import LoadingSpinner from './LoadingSpinner';
import ChatComponent from './components/ChatComponent';
import { useFinancialContext } from './hooks/useFinancialContext.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

function App() {
  // Estados de autenticación
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Estados existentes
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Estados para el chat con IA
  const [showChat, setShowChat] = useState(false);
  
  // Hook para obtener contexto financiero
  const { financialContext, isLoading: contextLoading } = useFinancialContext(user);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Estados para edición de transacciones


  // Función para formatear montos en pesos chilenos
  const formatCLP = (amount) => {
    if (!showValues) {
      return '$ ****';
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para calcular el balance mensual
  const getMonthlyBalance = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date || transaction.created_at);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
      balance: monthlyIncome - monthlyExpenses,
      income: monthlyIncome,
      expenses: monthlyExpenses
    };
  };

  // Obtener datos del mes actual
  const monthlyData = getMonthlyBalance();
  
  // Función para obtener el nombre del mes actual
  const getCurrentMonthName = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentDate = new Date();
    return months[currentDate.getMonth()];
  };
  
  // Función para obtener la fecha completa actual
  const getCurrentDate = () => {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = getCurrentMonthName();
    const year = currentDate.getFullYear();
    return `${day} de ${month} ${year}`;
  };
  const [showAddCategoryInModal, setShowAddCategoryInModal] = useState(false);

  // Categories
  const [customCategories, setCustomCategories] = useState({
    expense: ['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Hogar', 'Ropa', 'Otros'],
    income: ['Salario', 'Freelance', 'Inversiones', 'Bonos', 'Otros']
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('expense');

  // PWA Installation
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
    
    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      
      if (session?.user) {
        loadInitialData();
      } else {
        // Limpiar datos cuando el usuario se desconecta
        setTransactions([]);
        setBalance(0);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Iniciando carga de datos...');
      await fetchTransactions();
      await fetchCustomCategories();
      console.log('Carga de datos completada');
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error al cargar los datos');
      // Asegurar que la app funcione sin datos
      setTransactions([]);
      setBalance(0);
    } finally {
      console.log('Finalizando estado de carga');
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Error al cerrar sesión');
    }
  };

  const fetchCustomCategories = async () => {
    if (!user) return;
    
    try {
      console.log('Cargando categorías personalizadas...');
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error al cargar categorías:', error);
        return;
      }

      if (data && data.length > 0) {
        const expenseCategories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Hogar', 'Ropa', 'Otros'];
        const incomeCategories = ['Salario', 'Freelance', 'Inversiones', 'Bonos', 'Otros'];

        // Agregar categorías personalizadas a las categorías por defecto
        data.forEach(category => {
          if (category.is_income) {
            if (!incomeCategories.includes(category.name)) {
              incomeCategories.push(category.name);
            }
          } else {
            if (!expenseCategories.includes(category.name)) {
              expenseCategories.push(category.name);
            }
          }
        });

        setCustomCategories({
          expense: expenseCategories,
          income: incomeCategories
        });

        console.log('Categorías personalizadas cargadas:', data.length);
      }
    } catch (error) {
      console.error('Error fetching custom categories:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setBalance(0);
      return;
    }
    
    try {
      console.log('Intentando conectar con Supabase...');
      console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      console.log('User ID:', user.id);
      
      // Intentar conectar con Supabase filtrando por user_id
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('Error de Supabase:', error);
        console.log('No se pudo conectar a la base de datos');
        
        // No mostrar datos mock, solo mensaje de error
        setTransactions([]);
        setBalance(0);
        
        setError('No se puede conectar a la base de datos. Verifica la configuración de Supabase en las variables de entorno.');
        return;
      }

      setTransactions(data || []);
      
      // Calculate balance
      const totalIncome = (data || []).filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpenses = (data || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      setBalance(totalIncome - totalExpenses);
      
      console.log('Datos cargados exitosamente:', { transacciones: data?.length || 0, balance: totalIncome - totalExpenses });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      console.log('No se pudo conectar a la base de datos');
      
      // No mostrar datos mock, solo mensaje de error
      setTransactions([]);
      setBalance(0);
      
      setError(`No se puede conectar a la base de datos: ${error.message}. Verifica la configuración de Supabase.`);
    }
  };

  const addTransaction = async () => {
    if (!user) {
      setError('Debes estar autenticado para agregar transacciones');
      return;
    }
    
    if (!newTransaction.amount || !newTransaction.category) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          description: newTransaction.description || null,
          date: newTransaction.date,
          user_id: user.id
        }])
        .select();

      if (error) throw error;

      setTransactions(prev => [data[0], ...prev]);
      
      // Update balance
      if (newTransaction.type === 'income') {
        setBalance(prev => prev + parseFloat(newTransaction.amount));
      } else {
        setBalance(prev => prev - parseFloat(newTransaction.amount));
      }

      // Reset form
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddTransaction(false);
      setShowAddCategoryInModal(false);
      setError(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Error al agregar la transacción');
    }
  };



  // Función para eliminar transacción
  const deleteTransaction = async (transactionId) => {
    if (!user) {
      setError('Debes estar autenticado para eliminar transacciones');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Encontrar la transacción a eliminar para ajustar el balance
      const transactionToDelete = transactions.find(t => t.id === transactionId);
      
      // Actualizar transacciones
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      
      // Actualizar balance
      if (transactionToDelete.type === 'income') {
        setBalance(prev => prev - parseFloat(transactionToDelete.amount));
      } else {
        setBalance(prev => prev + parseFloat(transactionToDelete.amount));
      }

      setError(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Error al eliminar la transacción');
    }
  };



  const addCustomCategory = async () => {
    if (!user) {
      setError('Debes estar autenticado para agregar categorías');
      return;
    }
    
    if (!newCategoryName.trim()) {
      setError('Por favor ingresa un nombre para la categoría');
      return;
    }

    if (customCategories[newCategoryType].includes(newCategoryName.trim())) {
      setError('Esta categoría ya existe');
      return;
    }

    try {
      // Guardar en la base de datos con user_id
      const { data, error } = await supabase
        .from('custom_categories')
        .insert([{
          name: newCategoryName.trim(),
          is_income: newCategoryType === 'income',
          color: '#3B82F6',
          icon: newCategoryType === 'income' ? '💰' : '💸',
          user_id: user.id
        }])
        .select();

      if (error) {
        console.error('Error al guardar categoría:', error);
        setError('Error al guardar la categoría en la base de datos: ' + error.message);
        return;
      }

      // Actualizar estado local
      setCustomCategories(prev => ({
        ...prev,
        [newCategoryType]: [...prev[newCategoryType], newCategoryName.trim()]
      }));

      setNewCategoryName('');
      setShowCategoryModal(false);
      setError(null);
      console.log('Categoría guardada exitosamente:', data[0]);
    } catch (error) {
      console.error('Error adding custom category:', error);
      setError('Error al agregar la categoría');
    }
  };

  const deleteCustomCategory = async (type, categoryName) => {
    if (!user) {
      setError('Debes estar autenticado para eliminar categorías');
      return;
    }
    
    const defaultCategories = {
      expense: ['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Hogar', 'Ropa', 'Otros'],
      income: ['Salario', 'Freelance', 'Inversiones', 'Bonos', 'Otros']
    };

    // No permitir eliminar categorías por defecto
    if (defaultCategories[type].includes(categoryName)) {
      setError('No se pueden eliminar las categorías predeterminadas');
      return;
    }

    // Verificar si hay transacciones asociadas a esta categoría
    const hasTransactions = transactions.some(t => t.category === categoryName);
    if (hasTransactions) {
      setError('No se puede eliminar esta categoría porque tiene transacciones asociadas');
      return;
    }

    try {
      // Eliminar de la base de datos
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('name', categoryName)
        .eq('is_income', type === 'income')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error al eliminar categoría:', error);
        setError('Error al eliminar la categoría de la base de datos: ' + error.message);
        return;
      }

      // Actualizar estado local
      setCustomCategories(prev => ({
        ...prev,
        [type]: prev[type].filter(cat => cat !== categoryName)
      }));
      setError(null);
      console.log('Categoría eliminada exitosamente:', categoryName);
    } catch (error) {
      console.error('Error deleting custom category:', error);
      setError('Error al eliminar la categoría');
    }
  };

  const addQuickCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Por favor ingresa un nombre para la categoría');
      return;
    }

    if (customCategories[newTransaction.type].includes(newCategoryName.trim())) {
      setError('Esta categoría ya existe');
      return;
    }

    try {
      // Guardar en la base de datos con user_id
      const { data, error } = await supabase
        .from('custom_categories')
        .insert([{
          name: newCategoryName.trim(),
          is_income: newTransaction.type === 'income',
          color: '#3B82F6',
          icon: newTransaction.type === 'income' ? '💰' : '💸',
          user_id: user.id
        }])
        .select();

      if (error) {
        console.error('Error al guardar categoría:', error);
        setError('Error al guardar la categoría en la base de datos: ' + error.message);
        return;
      }

      // Actualizar estado local
      setCustomCategories(prev => ({
        ...prev,
        [newTransaction.type]: [...prev[newTransaction.type], newCategoryName.trim()]
      }));

      setNewTransaction({...newTransaction, category: newCategoryName.trim()});
      setNewCategoryName('');
      setShowAddCategoryInModal(false);
      setError(null);
      console.log('Categoría rápida guardada exitosamente:', data[0]);
    } catch (error) {
      console.error('Error adding quick category:', error);
      setError('Error al agregar la categoría');
    }
  };

  // Función para análisis con IA
  const analyzeFinancesWithAI = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Preparar datos para el análisis
      const stats = getStatisticsData();
      const recentTransactions = transactions.slice(0, 20);
      
      const financialData = {
        balance: balance,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        savingsRate: stats.savingsRate,
        expensesSinceSalary: stats.expensesSinceSalary,
        expensesByCategory: stats.expensesByCategory,
        monthlyData: stats.monthlyData,
        recentTransactions: recentTransactions.map(t => ({
          type: t.type,
          category: t.category,
          amount: t.amount,
          date: t.date
        }))
      };

      const prompt = `
        Analiza los siguientes datos financieros de esta aplicación y proporciona:
        1. Un análisis detallado de la situación financiera actual basado en los datos registrados
        2. 3-5 sugerencias específicas para mejorar las finanzas usando las funcionalidades de la aplicación
        3. 2-3 objetivos de ahorro realistas que se puedan gestionar con las metas de la aplicación
        4. Identificación de patrones de gasto problemáticos visibles en las categorías registradas
        5. Recomendaciones para optimizar el presupuesto aprovechando las estadísticas y gráficos disponibles

        Datos financieros registrados en la aplicación:
        - Balance actual: $${balance.toLocaleString('es-CL')}
        - Ingresos totales: $${totalIncome.toLocaleString('es-CL')}
        - Gastos totales: $${totalExpenses.toLocaleString('es-CL')}
        - Tasa de ahorro: ${stats.savingsRate.toFixed(1)}%
        - Gastos desde último salario: $${stats.expensesSinceSalary.toLocaleString('es-CL')}
        - Distribución de gastos por categoría: ${JSON.stringify(stats.expensesByCategory)}
        - Datos mensuales: ${JSON.stringify(stats.monthlyData)}
        
        Enfócate únicamente en cómo usar mejor esta aplicación de finanzas para mejorar el control financiero. No sugieras herramientas externas.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'system',
              content: 'Eres un asesor financiero experto que analiza datos financieros personales y proporciona consejos prácticos y específicos en español.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.choices[0].message.content;

      setAiAnalysis({
        analysis: analysis,
        timestamp: new Date().toLocaleString('es-CL'),
        financialData: financialData
      });

    } catch (error) {
      console.error('Error al analizar con IA:', error);
      setError('Error al conectar con el servicio de IA. Por favor intenta nuevamente.');
    } finally {
       setIsAnalyzing(false);
     }
   };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Función para obtener datos de estadísticas avanzadas
  const getStatisticsData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Encontrar el último salario del mes
    const salaryTransactions = transactions.filter(t => 
      t.type === 'income' && 
      t.category === 'Salario' &&
      new Date(t.date || t.created_at).getMonth() === currentMonth &&
      new Date(t.date || t.created_at).getFullYear() === currentYear
    ).sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
    
    const lastSalaryDate = salaryTransactions.length > 0 ? new Date(salaryTransactions[0].date || salaryTransactions[0].created_at) : null;
    
    // Gastos desde el último salario
    const expensesSinceSalary = lastSalaryDate ? 
      transactions.filter(t => 
        t.type === 'expense' && 
        new Date(t.date || t.created_at) >= lastSalaryDate
      ) : [];
    
    // Evolución diaria de gastos desde salario
    const dailyExpenses = {};
    expensesSinceSalary.forEach(t => {
      const date = new Date(t.date || t.created_at).toISOString().split('T')[0];
      dailyExpenses[date] = (dailyExpenses[date] || 0) + parseFloat(t.amount);
    });
    
    // Gastos por categoría
    const expensesByCategory = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + parseFloat(t.amount);
    });
    
    // Comparación mensual (últimos 6 meses)
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    transactions.forEach(t => {
      const date = new Date(t.date || t.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey][t.type === 'income' ? 'income' : 'expenses'] += parseFloat(t.amount);
      }
    });
    
    return {
      lastSalaryDate,
      expensesSinceSalary: expensesSinceSalary.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      dailyExpenses,
      expensesByCategory,
      monthlyData,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0
    };
  };

  const renderStatistics = () => {
    const stats = getStatisticsData();
    
    // Datos para gráfica de evolución diaria
    const dailyLabels = Object.keys(stats.dailyExpenses).sort();
    const dailyValues = dailyLabels.map(date => stats.dailyExpenses[date]);
    const cumulativeValues = dailyValues.reduce((acc, val, i) => {
      acc.push((acc[i - 1] || 0) + val);
      return acc;
    }, []);
    
    const dailyExpenseChart = {
      labels: dailyLabels.map(date => new Date(date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Gasto Diario',
          data: dailyValues,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Gasto Acumulado',
          data: cumulativeValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
    
    // Datos para gráfica de categorías
    const categoryLabels = Object.keys(stats.expensesByCategory);
    const categoryValues = Object.values(stats.expensesByCategory);
    const categoryColors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
    ];
    
    const categoryChart = {
      labels: categoryLabels,
      datasets: [{
        data: categoryValues,
        backgroundColor: categoryColors.slice(0, categoryLabels.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
    
    // Datos para comparación mensual
    const monthlyLabels = Object.keys(stats.monthlyData).map(key => {
      const [year, month] = key.split('-');
      return new Date(year, month - 1).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
    });
    const monthlyIncome = Object.values(stats.monthlyData).map(data => data.income);
    const monthlyExpenses = Object.values(stats.monthlyData).map(data => data.expenses);
    
    const monthlyChart = {
      labels: monthlyLabels,
      datasets: [
        {
          label: 'Ingresos',
          data: monthlyIncome,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2
        },
        {
          label: 'Gastos',
          data: monthlyExpenses,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2
        }
      ]
    };
    
    return (
      <div className="space-y-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
            <h3 className="text-sm font-medium opacity-90">Tasa de Ahorro</h3>
            <p className="text-2xl font-bold">{stats.savingsRate.toFixed(1)}%</p>
            <p className="text-xs opacity-80">Del total de ingresos</p>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-4 text-white">
            <h3 className="text-sm font-medium opacity-90">Desde Último Salario</h3>
            <p className="text-2xl font-bold">{formatCLP(stats.expensesSinceSalary)}</p>
            <p className="text-xs opacity-80">
              {stats.lastSalaryDate ? 
                new Date(stats.lastSalaryDate).toLocaleDateString('es-CL') : 
                'Sin salario registrado'
              }
            </p>
          </div>
        </div>
        
        {/* Evolución de gastos desde salario */}
        {dailyLabels.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolución de Gastos desde Salario</h3>
            <div className="h-64">
              <Line 
                data={dailyExpenseChart} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: 'Fecha'
                      }
                    },
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Gasto Diario (CLP)'
                      },
                      ticks: {
                        callback: function(value) {
                          return new Intl.NumberFormat('es-CL', {
                            style: 'currency',
                            currency: 'CLP',
                            minimumFractionDigits: 0
                          }).format(value);
                        }
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: {
                        display: true,
                        text: 'Gasto Acumulado (CLP)'
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                      ticks: {
                        callback: function(value) {
                          return new Intl.NumberFormat('es-CL', {
                            style: 'currency',
                            currency: 'CLP',
                            minimumFractionDigits: 0
                          }).format(value);
                        }
                      }
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + formatCLP(context.parsed.y);
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        )}


        
        {/* Distribución por categorías */}
        {categoryLabels.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Categoría</h3>
            <div className="h-64">
              <Doughnut 
                data={categoryChart} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                          return context.label + ': ' + formatCLP(context.parsed) + ' (' + percentage + '%)';
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        )}
        
        {/* Comparación mensual */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparación Mensual (Últimos 6 meses)</h3>
          <div className="h-64">
            <Bar 
              data={monthlyChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Mes'
                    }
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Monto (CLP)'
                    },
                    ticks: {
                      callback: function(value) {
                        return new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: 'CLP',
                          minimumFractionDigits: 0
                        }).format(value);
                      }
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.dataset.label + ': ' + formatCLP(context.parsed.y);
                      }
                    }
                  },
                  legend: {
                    position: 'top'
                  }
                }
              }} 
            />
          </div>
        </div>
        
        {/* Métricas adicionales */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen Financiero</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Ingresos:</span>
                <span className="font-semibold text-green-600">{formatCLP(totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Gastos:</span>
                <span className="font-semibold text-red-600">{formatCLP(totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-gray-800 font-medium">Balance Neto:</span>
                <span className={`font-bold text-lg ${
                  (totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCLP(totalIncome - totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Promedio Gasto Diario:</span>
                <span className="font-semibold text-gray-800">
                  {transactions.filter(t => t.type === 'expense').length > 0 ? 
                    formatCLP(totalExpenses / Math.max(1, Math.ceil((new Date() - new Date(Math.min(...transactions.filter(t => t.type === 'expense').map(t => new Date(t.date || t.created_at))))) / (1000 * 60 * 60 * 24)))) :
                    formatCLP(0)
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-medium opacity-90">Balance Mensual - {getCurrentDate()}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAIModal(true)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Análisis con IA"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
            <button
              onClick={() => setShowValues(!showValues)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <p className="text-3xl font-bold mb-4">{formatCLP(monthlyData.balance)}</p>
        <div className="flex justify-between text-sm">
          <div>
            <p className="opacity-80">Ingresos del mes</p>
            <p className="font-semibold text-green-200">+{formatCLP(monthlyData.income)}</p>
          </div>
          <div>
            <p className="opacity-80">Gastos del mes</p>
            <p className="font-semibold text-red-200">-{formatCLP(monthlyData.expenses)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            setNewTransaction({...newTransaction, type: 'income'});
            setShowAddTransaction(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex flex-col items-center"
        >
          <span className="text-2xl mb-2 block">💰</span>
          <span className="font-semibold">Agregar Ingreso</span>
        </button>
        <button
          onClick={() => {
            setNewTransaction({...newTransaction, type: 'expense'});
            setShowAddTransaction(true);
          }}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex flex-col items-center"
        >
          <span className="text-2xl mb-2 block">💸</span>
          <span className="font-semibold">Agregar Gasto</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transacciones Recientes</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay transacciones aún</p>
            <p className="text-sm">¡Agrega tu primera transacción!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{transaction.category}</p>
                    <p className="text-gray-600 text-sm">{transaction.description}</p>
                    <p className="text-gray-400 text-xs">{transaction.date}</p>
                  </div>
                  <p className={`font-bold text-lg ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCLP(transaction.amount)}
              </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Transacciones</h2>
        <button
          onClick={() => setShowAddTransaction(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay transacciones aún</p>
          <p className="text-sm">¡Agrega tu primera transacción!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(transaction => (
            <div key={transaction.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{transaction.category}</p>
                  <p className="text-gray-600 text-sm">{transaction.description}</p>
                  <p className="text-gray-400 text-xs">{transaction.date}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <p className={`font-bold text-lg ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCLP(transaction.amount)}
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
                          deleteTransaction(transaction.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      title="Eliminar transacción"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Categorías</h2>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span>Agregar</span>
        </button>
      </div>

      {/* Expense Categories */}
      <div>
        <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center">
          <span className="mr-2">💸</span>
          Categorías de Gastos
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {customCategories.expense.map(category => (
            <div key={category} className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
              <span className="text-red-800 font-medium">{category}</span>
              {!['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Hogar', 'Ropa', 'Otros'].includes(category) && (
                <button
                  onClick={() => deleteCustomCategory('expense', category)}
                  className="text-red-500 hover:text-red-700 text-lg font-bold ml-2 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                  title="Eliminar categoría"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories */}
      <div>
        <h3 className="text-lg font-semibold text-green-600 mb-3 flex items-center">
          <span className="mr-2">💰</span>
          Categorías de Ingresos
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {customCategories.income.map(category => (
            <div key={category} className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
              <span className="text-green-800 font-medium">{category}</span>
              {!['Salario', 'Freelance', 'Inversiones', 'Bonos', 'Otros'].includes(category) && (
                <button
                  onClick={() => deleteCustomCategory('income', category)}
                  className="text-green-500 hover:text-green-700 text-lg font-bold ml-2 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                  title="Eliminar categoría"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Mostrar spinner de autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner message="Verificando autenticación..." size="large" />
      </div>
    );
  }

  // Mostrar componente de autenticación si no hay usuario
  if (!user) {
    return <AuthComponent />;
  }

  // Mostrar spinner de carga de datos
  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Cargando datos financieros..." size="medium" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">💰 Mis Finanzas</h1>
            <p className="text-sm text-blue-600">👤 {user.email}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* PWA Install Button */}
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                title="Instalar aplicación"
              >
                <span className="text-xl">📱</span>
              </button>
            )}
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="p-2 text-red-600 hover:text-red-800 transition-colors"
              title="Cerrar sesión"
            >
              <span className="text-xl">🚪</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'categories' && renderCategories()}
        {activeTab === 'statistics' && renderStatistics()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`p-3 rounded-lg text-center transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="text-xl mb-1">🏠</div>
            <div className="text-xs font-medium">Inicio</div>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`p-3 rounded-lg text-center transition-colors ${
              activeTab === 'transactions'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="text-xl mb-1">📊</div>
            <div className="text-xs font-medium">Transacciones</div>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`p-3 rounded-lg text-center transition-colors ${
              activeTab === 'categories'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="text-xl mb-1">🏷️</div>
            <div className="text-xs font-medium">Categorías</div>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`p-3 rounded-lg text-center transition-colors ${
              activeTab === 'statistics'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="text-xl mb-1">📈</div>
            <div className="text-xs font-medium">Estadísticas</div>
          </button>
        </div>
      </div>

      {/* Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Nueva Transacción</h3>
              <button
                onClick={() => {
                  setShowAddTransaction(false);
                  setError(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Transaction Type */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                className={`p-3 rounded-xl font-semibold transition-all ${
                  newTransaction.type === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Gasto
              </button>
              <button
                onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                className={`p-3 rounded-xl font-semibold transition-all ${
                  newTransaction.type === 'income'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Ingreso
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (CLP) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50000"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
              {!showAddCategoryInModal ? (
                <div className="space-y-2">
                  <select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar categoría</option>
                    {customCategories[newTransaction.type].map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInModal(true)}
                    className="w-full p-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    + Agregar nueva categoría
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={addQuickCategory}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg font-medium transition-colors"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategoryInModal(false);
                        setNewCategoryName('');
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <input
                type="text"
                value={newTransaction.description || ''}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción opcional"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={addTransaction}
              disabled={!newTransaction.amount || !newTransaction.category}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200"
            >
              Agregar Transacción
            </button>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Nueva Categoría</h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                  setError(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Category Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Categoría</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewCategoryType('expense')}
                  className={`p-3 rounded-xl font-semibold transition-all ${
                    newCategoryType === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  💸 Gasto
                </button>
                <button
                  onClick={() => setNewCategoryType('income')}
                  className={`p-3 rounded-xl font-semibold transition-all ${
                    newCategoryType === 'income'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  💰 Ingreso
                </button>
              </div>
            </div>

            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Categoría *</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Mascotas, Viajes, etc."
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={addCustomCategory}
              disabled={!newCategoryName.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200"
            >
              Agregar Categoría
            </button>
          </div>
        </div>
      )}

      {/* Modal de Análisis con IA */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Análisis Financiero con IA
                </h2>
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiAnalysis(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!aiAnalysis && !isAnalyzing && (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Análisis Inteligente de tus Finanzas</h3>
                    <p className="text-gray-600 mb-6">Obtén insights personalizados, sugerencias de mejora y objetivos de ahorro basados en tu historial financiero.</p>
                  </div>
                  <button
                    onClick={() => {
                      analyzeFinancesWithAI();
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    🤖 Analizar mis Finanzas con IA
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Analizando tus finanzas...</h3>
                  <p className="text-gray-600">La IA está procesando tu información financiera para generar insights personalizados.</p>
                </div>
              )}

              {aiAnalysis && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Análisis completado - {aiAnalysis.timestamp}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {aiAnalysis.analysis}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        analyzeFinancesWithAI();
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
                    >
                      🔄 Nuevo Análisis
                    </button>
                    <button
                      onClick={() => {
                        setShowAIModal(false);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-800 font-medium">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante del chat */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
        title="Asistente Financiero IA"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Componente del Chat */}
      <ChatComponent
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        financialContext={financialContext}
        user={user}
      />
    </div>
  );
}

export default App;