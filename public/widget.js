/**
 * Chat Widget Integration Script
 * Versión: 1.0.0
 * Descripción: Script para integrar el widget de chat en cualquier sitio web
 */

(function() {
  // Evitar múltiples inicializaciones
  if (window.ChatWidget) {
    return;
  }

  let isInitialized = false;
  let widgetContainer = null;

  // Función principal de inicialización
  function init(options) {
    if (isInitialized) {
      console.warn('ChatWidget ya está inicializado');
      return;
    }

    if (!options.apiKey) {
      console.error('ChatWidget: apiKey es requerido');
      return;
    }

    isInitialized = true;

    // Crear contenedor del widget
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'chat-widget-container';
    widgetContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(widgetContainer);

    // Cargar React y el componente del widget
    loadDependencies(options);
  }

  // Cargar dependencias necesarias
  function loadDependencies(options) {
    // Lista de dependencias a cargar
    const dependencies = [
      'https://unpkg.com/react@18/umd/react.production.min.js',
      'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
      'https://unpkg.com/@babel/standalone/babel.min.js'
    ];

    let loadedCount = 0;

    dependencies.forEach(url => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        loadedCount++;
        if (loadedCount === dependencies.length) {
          loadWidgetComponent(options);
        }
      };
      script.onerror = () => {
        console.error(`Error cargando dependencia: ${url}`);
      };
      document.head.appendChild(script);
    });
  }

  // Cargar y renderizar el componente del widget
  function loadWidgetComponent(options) {
    // Crear script con el código del widget
    const widgetScript = document.createElement('script');
    widgetScript.type = 'text/babel';
    widgetScript.textContent = `
      const { useState, useEffect, useRef } = React;

      const ChatWidget = (${getWidgetComponentCode()});

      // Renderizar el widget
      const root = ReactDOM.createRoot(document.getElementById('chat-widget-container'));
      root.render(React.createElement(ChatWidget, ${JSON.stringify(options)}));
    `;

    document.head.appendChild(widgetScript);
  }

  // Código del componente del widget (simplificado para embeber)
  function getWidgetComponentCode() {
    return `
      (props) => {
        const [isOpen, setIsOpen] = useState(false);
        const [messages, setMessages] = useState([]);
        const [inputMessage, setInputMessage] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [config, setConfig] = useState(null);
        const [conversationId, setConversationId] = useState(null);
        const messagesEndRef = useRef(null);

        const baseUrl = props.baseUrl || 'https://tu-dominio.com';
        const position = props.position || 'bottom-right';
        const primaryColor = props.primaryColor || '#3B82F6';
        const secondaryColor = props.secondaryColor || '#F3F4F6';

        useEffect(() => {
          const loadConfig = async () => {
            try {
              const response = await fetch(\`\${baseUrl}/api/widget/config\`, {
                headers: { 'Authorization': \`Bearer \${props.apiKey}\` }
              });
              if (response.ok) {
                const configData = await response.json();
                setConfig(configData);
              }
            } catch (error) {
              console.error('Error loading config:', error);
            }
          };
          loadConfig();
        }, []);

        useEffect(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [messages]);

        const sendMessage = async () => {
          if (!inputMessage.trim() || isLoading) return;

          const userMessage = {
            id: Date.now().toString(),
            content: inputMessage,
            role: 'user',
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, userMessage]);
          setInputMessage('');
          setIsLoading(true);

          try {
            const response = await fetch(\`\${baseUrl}/api/widget/chat\`, {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${props.apiKey}\`,
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
              const botMessage = {
                id: (Date.now() + 1).toString(),
                content: data.response,
                role: 'assistant',
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, botMessage]);
            }
          } catch (error) {
            console.error('Error sending message:', error);
          } finally {
            setIsLoading(false);
          }
        };

        const handleKeyPress = (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        };

        const getPositionClasses = () => {
          switch (position) {
            case 'bottom-left': return 'bottom-4 left-4';
            case 'top-right': return 'top-4 right-4';
            case 'top-left': return 'top-4 left-4';
            default: return 'bottom-4 right-4';
          }
        };

        if (!config) return null;

        return React.createElement('div', { style: { position: 'relative', width: '100%', height: '100%' } },
          // Botón flotante
          !isOpen && React.createElement('div', {
            className: \`fixed \${getPositionClasses()} z-50\`,
            style: { pointerEvents: 'auto' }
          }, React.createElement('button', {
            onClick: () => setIsOpen(true),
            style: {
              backgroundColor: primaryColor,
              borderRadius: '50%',
              padding: '16px',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }
          }, React.createElement('svg', {
            width: 24, height: 24, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24'
          }, React.createElement('path', {
            strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2,
            d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
          })))),

          // Ventana del chat
          isOpen && React.createElement('div', {
            className: \`fixed \${getPositionClasses()} w-80 h-96 bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden\`,
            style: { pointerEvents: 'auto' }
          },
            // Header
            React.createElement('div', {
              style: { backgroundColor: primaryColor, padding: '16px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
            },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                config.logoUrl && React.createElement('img', {
                  src: config.logoUrl, alt: config.businessName,
                  style: { width: '32px', height: '32px', borderRadius: '50%' }
                }),
                React.createElement('div', {},
                  React.createElement('h3', { style: { fontSize: '14px', fontWeight: '600' } }, config.businessName),
                  React.createElement('p', { style: { fontSize: '12px', opacity: '0.9' } }, 'En línea')
                )
              ),
              React.createElement('button', {
                onClick: () => setIsOpen(false),
                style: { color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }
              }, '×')
            ),

            // Mensajes
            React.createElement('div', {
              style: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }
            },
              messages.length === 0 && React.createElement('div', {
                style: { textAlign: 'center', color: '#6B7280', fontSize: '14px' }
              },
                React.createElement('p', {}, \`¡Hola! Soy el asistente de \${config.businessName}.\`),
                React.createElement('p', {}, '¿En qué puedo ayudarte hoy?')
              ),
              messages.map(message => React.createElement('div', {
                key: message.id,
                style: { display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }
              }, React.createElement('div', {
                style: {
                  maxWidth: '320px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: message.role === 'user' ? primaryColor : secondaryColor,
                  color: message.role === 'user' ? 'white' : '#1F2937'
                }
              }, message.content))),
              isLoading && React.createElement('div', {
                style: { display: 'flex', justifyContent: 'flex-start' }
              }, React.createElement('div', {
                style: { backgroundColor: '#F3F4F6', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }
              }, 'Escribiendo...')),
              React.createElement('div', { ref: messagesEndRef })
            ),

            // Input
            React.createElement('div', { style: { padding: '16px', borderTop: '1px solid #E5E7EB' } },
              React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                React.createElement('input', {
                  type: 'text',
                  value: inputMessage,
                  onChange: (e) => setInputMessage(e.target.value),
                  onKeyPress: handleKeyPress,
                  placeholder: 'Escribe tu mensaje...',
                  style: {
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  },
                  disabled: isLoading
                }),
                React.createElement('button', {
                  onClick: sendMessage,
                  disabled: !inputMessage.trim() || isLoading,
                  style: {
                    padding: '8px 16px',
                    backgroundColor: primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: (!inputMessage.trim() || isLoading) ? 0.5 : 1
                  }
                }, 'Enviar')
              )
            )
          )
        );
      }
    `;
  }

  // Exponer la función de inicialización globalmente
  window.ChatWidget = {
    init: init
  };

  // Auto-inicialización si hay opciones en el script
  const script = document.currentScript;
  if (script) {
    const apiKey = script.getAttribute('data-api-key');
    const baseUrl = script.getAttribute('data-base-url');
    const position = script.getAttribute('data-position');
    const primaryColor = script.getAttribute('data-primary-color');
    const secondaryColor = script.getAttribute('data-secondary-color');

    if (apiKey) {
      init({
        apiKey,
        baseUrl,
        position,
        primaryColor,
        secondaryColor
      });
    }
  }
})();