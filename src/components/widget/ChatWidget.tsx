import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { WidgetConfig, WidgetMessage } from '@/types/widget';

interface ChatWidgetProps {
  apiKey: string;
  baseUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  secondaryColor?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiKey,
  baseUrl = 'https://tu-dominio.com',
  position = 'bottom-right',
  primaryColor = '#3B82F6',
  secondaryColor = '#F3F4F6'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar configuración del widget
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/widget/config`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        }
      } catch (error) {
        console.error('Error loading widget config:', error);
      }
    };

    loadConfig();
  }, [apiKey, baseUrl]);

  // Scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: WidgetMessage = {
      id: Date.now().toString(),
      conversationId: conversationId || '',
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/widget/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: conversationId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversationId);

        const botMessage: WidgetMessage = {
          id: (Date.now() + 1).toString(),
          conversationId: data.conversationId,
          content: data.response,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage: WidgetMessage = {
          id: (Date.now() + 1).toString(),
          conversationId: conversationId || '',
          content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: WidgetMessage = {
        id: (Date.now() + 1).toString(),
        conversationId: conversationId || '',
        content: 'Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  if (!config) {
    return null; // No mostrar el widget hasta que se cargue la configuración
  }

  return (
    <>
      {/* Botón flotante del widget */}
      <div className={`fixed ${getPositionClasses()} z-50`}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
      </div>

      {/* Ventana del chat */}
      {isOpen && (
        <div className={`fixed ${getPositionClasses()} w-80 h-96 bg-card rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden`}>
          {/* Header */}
          <div
            className="p-4 text-white flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-3">
              {config.logoUrl && (
                <Image
                  src={config.logoUrl}
                  alt={config.businessName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <h3 className="font-semibold text-sm">{config.businessName}</h3>
                <p className="text-xs opacity-90">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-black/20 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm">
                <p>¡Hola! Soy el asistente de {config.businessName}.</p>
                <p>¿En qué puedo ayudarte hoy?</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm`}
                  style={{
                    backgroundColor: message.role === 'user' ? primaryColor : secondaryColor,
                    color: message.role === 'user' ? 'white' : 'inherit'
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary px-3 py-2 rounded-lg text-sm text-card-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
