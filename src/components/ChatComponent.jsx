import React, { useState, useRef, useEffect } from 'react';
import { financialChatService } from '../services/openaiService.js';
import LoadingSpinner from '../LoadingSpinner';

const ChatComponent = ({ isOpen, onClose, financialContext, user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automático al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generar sugerencias cuando se abre el chat
  useEffect(() => {
    if (isOpen && financialContext) {
      const autoSuggestions = financialChatService.generateSuggestions(financialContext);
      setSuggestions(autoSuggestions);
      
      // Mensaje de bienvenida
      if (messages.length === 0) {
        setMessages([{
          id: Date.now(),
          type: 'assistant',
          content: `¡Hola! 👋 Soy tu asistente financiero personal. Puedo ayudarte a analizar tus finanzas, dar consejos de ahorro y responder preguntas sobre tu situación financiera.\n\n¿En qué puedo ayudarte hoy?`,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, financialContext]);

  // Enfocar input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await financialChatService.processQuery(inputMessage, financialContext, user);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Lo siento, hubo un error al procesar tu consulta. Por favor, verifica tu configuración de OpenAI e intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([]);
    financialChatService.clearHistory();
    setSuggestions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              🤖
            </div>
            <div>
              <h3 className="font-semibold">Asistente Financiero</h3>
              <p className="text-sm text-blue-100">Powered by OpenAI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title="Limpiar chat"
            >
              🗑️
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title="Cerrar chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sugerencias */}
        {suggestions.length > 0 && messages.length <= 1 && (
          <div className="p-4 bg-gray-50 border-b">
            <p className="text-sm text-gray-600 mb-2">💡 Sugerencias basadas en tus finanzas:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(`Explícame: ${suggestion}`)}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'error'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-1 opacity-70 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-gray-600">Pensando...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregúntame sobre tus finanzas..."
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : '📤'}
            </button>
          </div>
          
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => handleSuggestionClick('¿Cómo puedo ahorrar más dinero?')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              💰 Consejos de ahorro
            </button>
            <button
              onClick={() => handleSuggestionClick('Analiza mis gastos del último mes')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              📊 Análisis de gastos
            </button>
            <button
              onClick={() => handleSuggestionClick('¿Cómo está mi situación financiera?')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              📈 Estado financiero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;