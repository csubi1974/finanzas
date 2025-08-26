import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
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
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: ''
  });

  // Función para formatear montos en pesos chilenos
  const formatCLP = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await fetchTransactions();
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      
      // Calculate balance
      const totalIncome = (data || []).filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpenses = (data || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
      setBalance(totalIncome - totalExpenses);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Error al cargar las transacciones');
    }
  };

  const addTransaction = async () => {
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
          date: new Date().toISOString().split('T')[0]
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
        description: ''
      });
      setShowAddTransaction(false);
      setShowAddCategoryInModal(false);
      setError(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Error al agregar la transacción');
    }
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) {
      setError('Por favor ingresa un nombre para la categoría');
      return;
    }

    if (customCategories[newCategoryType].includes(newCategoryName.trim())) {
      setError('Esta categoría ya existe');
      return;
    }

    setCustomCategories(prev => ({
      ...prev,
      [newCategoryType]: [...prev[newCategoryType], newCategoryName.trim()]
    }));

    setNewCategoryName('');
    setShowCategoryModal(false);
    setError(null);
  };

  const deleteCustomCategory = (type, categoryName) => {
    const defaultCategories = {
      expense: ['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Hogar', 'Ropa', 'Otros'],
      income: ['Salario', 'Freelance', 'Inversiones', 'Bonos', 'Otros']
    };

    // No permitir eliminar categorías por defecto
    if (defaultCategories[type].includes(categoryName)) {
      setError('No se pueden eliminar las categorías predeterminadas');
      return;
    }

    setCustomCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(cat => cat !== categoryName)
    }));
  };

  const addQuickCategory = () => {
    if (!newCategoryName.trim()) {
      setError('Por favor ingresa un nombre para la categoría');
      return;
    }

    if (customCategories[newTransaction.type].includes(newCategoryName.trim())) {
      setError('Esta categoría ya existe');
      return;
    }

    setCustomCategories(prev => ({
      ...prev,
      [newTransaction.type]: [...prev[newTransaction.type], newCategoryName.trim()]
    }));

    setNewTransaction({...newTransaction, category: newCategoryName.trim()});
    setNewCategoryName('');
    setShowAddCategoryInModal(false);
    setError(null);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <h2 className="text-lg font-medium opacity-90 mb-2">Balance Total</h2>
        <p className="text-3xl font-bold mb-4">{formatCLP(balance)}</p>
        <div className="flex justify-between text-sm">
          <div>
            <p className="opacity-80">Ingresos</p>
            <p className="font-semibold text-green-200">+{formatCLP(totalIncome)}</p>
          </div>
          <div>
            <p className="opacity-80">Gastos</p>
            <p className="font-semibold text-red-200">-{formatCLP(totalExpenses)}</p>
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
                  className="text-red-500 hover:text-red-700 text-sm"
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
                  className="text-green-500 hover:text-green-700 text-sm"
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

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando tus finanzas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">💰 Mis Finanzas</h1>
          
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'categories' && renderCategories()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-1">
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
    </div>
  );
}

export default App;