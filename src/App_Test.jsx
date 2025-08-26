import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-2xl font-bold text-gray-800">💰 Mis Finanzas</h1>
      </div>
      <div className="p-4">
        <p>Aplicación PWA funcionando correctamente</p>
        <p>Balance: ${balance}</p>
      </div>
    </div>
  );
}

export default App;