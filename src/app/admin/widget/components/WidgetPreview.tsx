'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { WidgetConfig } from '@/types/widget';

export function WidgetPreview() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/widget/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return {
          width: '375px',
          height: '667px',
          borderRadius: '20px',
          border: '12px solid #000',
          borderTopWidth: '40px',
          borderBottomWidth: '40px',
          position: 'relative' as const
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          borderRadius: '20px',
          border: '12px solid #000',
          borderTopWidth: '40px',
          borderBottomWidth: '40px',
          position: 'relative' as const
        };
      default:
        return {
          width: '100%',
          maxWidth: '1200px',
          height: '600px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          position: 'relative' as const
        };
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
    return <div className="text-center py-8">Cargando vista previa...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controles de Vista Previa */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <label className="text-sm font-medium">Dispositivo:</label>
            <Select value={device} onValueChange={(value: any) => setDevice(value)}>
              <SelectTrigger className="w-32 ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <span>Desktop</span>
                  </div>
                </SelectItem>
                <SelectItem value="tablet">
                  <div className="flex items-center space-x-2">
                    <Tablet className="w-4 h-4" />
                    <span>Tablet</span>
                  </div>
                </SelectItem>
                <SelectItem value="mobile">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Móvil</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Posición:</label>
            <Select value={position} onValueChange={(value: any) => setPosition(value)}>
              <SelectTrigger className="w-40 ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Abajo Derecha</SelectItem>
                <SelectItem value="bottom-left">Abajo Izquierda</SelectItem>
                <SelectItem value="top-right">Arriba Derecha</SelectItem>
                <SelectItem value="top-left">Arriba Izquierda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={config.isActive ? 'default' : 'secondary'}>
            {config.isActive ? 'Widget Activo' : 'Widget Inactivo'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWidgetOpen(!isWidgetOpen)}
          >
            {isWidgetOpen ? 'Cerrar Widget' : 'Abrir Widget'}
          </Button>
        </div>
      </div>

      {/* Simulación del Sitio Web */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa del Sitio Web</CardTitle>
          <CardDescription>
            Simulación de cómo se verá el widget en un sitio web real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="mx-auto bg-white overflow-hidden"
            style={getDeviceStyles()}
          >
            {/* Barra de navegación simulada */}
            <div className="bg-gray-100 px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded"></div>
                  <div className="hidden sm:block">
                    <div className="w-32 h-4 bg-gray-300 rounded"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded mt-1"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>

            {/* Contenido del sitio web simulado */}
            <div className="p-6 space-y-4">
              <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <h2 className="text-white text-xl font-bold">Contenido del Sitio Web</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>

              <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-600">Más contenido aquí...</p>
              </div>
            </div>

            {/* Widget del Chat */}
            {config.isActive && (
              <>
                {/* Botón flotante del widget */}
                <div
                  className={`absolute ${getPositionClasses()} z-50`}
                  style={{ pointerEvents: 'none' }}
                >
                  {!isWidgetOpen && (
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-200"
                      style={{
                        backgroundColor: config.primaryColor,
                        pointerEvents: 'auto'
                      }}
                      onClick={() => setIsWidgetOpen(true)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Ventana del chat */}
                {isWidgetOpen && (
                  <div
                    className={`absolute ${getPositionClasses()} w-80 h-96 bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {/* Header */}
                    <div
                      className="p-4 text-white flex items-center justify-between"
                      style={{ backgroundColor: config.primaryColor }}
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
                        onClick={() => setIsWidgetOpen(false)}
                        className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      <div className="text-center text-gray-500 text-sm">
                        <p>{config.welcomeMessage}</p>
                      </div>

                      {/* Mensajes de ejemplo */}
                      <div className="flex justify-start">
                        <div
                          className="max-w-xs px-3 py-2 rounded-lg text-sm text-gray-800"
                          style={{ backgroundColor: config.secondaryColor }}
                        >
                          ¡Hola! ¿En qué puedo ayudarte?
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div
                          className="max-w-xs px-3 py-2 rounded-lg text-sm text-white"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          Me gustaría saber más sobre sus servicios
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <div
                          className="max-w-xs px-3 py-2 rounded-lg text-sm text-gray-800"
                          style={{ backgroundColor: config.secondaryColor }}
                        >
                          Claro, tenemos varios servicios disponibles. ¿Te interesa algo en particular?
                        </div>
                      </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Escribe tu mensaje..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          style={{ '--tw-ring-color': config.primaryColor } as any}
                        />
                        <button
                          className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                          style={{ backgroundColor: config.primaryColor }}
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Integración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Código de Integración:</h4>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                &lt;script src=&quot;https://tu-dominio.com/widget.js&quot; data-api-key=&quot;TU_API_KEY&quot;&gt;&lt;/script&gt;
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Integración Programática:</h4>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`window.ChatWidget.init({
  apiKey: 'TU_API_KEY',
  position: '${position}',
  primaryColor: '${config.primaryColor}',
  secondaryColor: '${config.secondaryColor}'
});`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}