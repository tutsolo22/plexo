'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Key, 
  TestTube, 
  Settings,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProviderInfo {
  name: string;
  configured: boolean;
  keyPreview: string;
  envVar: string;
  models: string[];
  status: string;
}

interface ProviderTestResult {
  provider: string;
  status: 'success' | 'error' | 'not_configured';
  configured: boolean;
  keyVisible: string;
  response?: string;
  error?: string;
  responseTime?: number;
  details?: any;
}

interface ProvidersInfo {
  providers: {
    google: ProviderInfo;
    openai: ProviderInfo;
  };
  summary: {
    totalProviders: number;
    configured: number;
    missing: number;
    allConfigured: boolean;
  };
  recommendations: string[];
}

interface TestResults {
  summary: {
    total: number;
    success: number;
    errors: number;
    notConfigured: number;
    allWorking: boolean;
  };
  results: ProviderTestResult[];
  testMessage: string;
}

export default function APIKeyTestPanel() {
  const [providersInfo, setProvidersInfo] = useState<ProvidersInfo | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('Hola, este es un test de conexión');
  const [customGoogleKey, setCustomGoogleKey] = useState('');
  const [customOpenAIKey, setCustomOpenAIKey] = useState('');
  const [showCustomKeys, setShowCustomKeys] = useState(false);

  // Cargar información inicial
  useEffect(() => {
    loadProvidersInfo();
  }, []);

  const loadProvidersInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/test/providers');
      const data = await response.json();
      
      if (data.success) {
        setProvidersInfo(data.data);
      }
    } catch (error) {
      console.error('Error cargando información de proveedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (provider: 'google' | 'openai' | 'both') => {
    try {
      setTestingProvider(provider);
      
      const testBody: any = {
        provider,
        testMessage: customMessage
      };

      // Agregar keys personalizadas si están configuradas
      if (showCustomKeys) {
        if (provider === 'google' && customGoogleKey) {
          testBody.customKey = customGoogleKey;
        }
        if (provider === 'openai' && customOpenAIKey) {
          testBody.customKey = customOpenAIKey;
        }
      }

      const response = await fetch('/api/ai/test/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testBody)
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResults(data.data);
      } else {
        console.error('Error en test:', data.message);
      }
    } catch (error) {
      console.error('Error probando proveedor:', error);
    } finally {
      setTestingProvider(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'not_configured':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Funcionando</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'not_configured':
        return <Badge variant="secondary">No configurado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (loading && !providersInfo) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando información de proveedores...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel de Verificación de API Keys</h2>
          <p className="text-muted-foreground">
            Verifica y prueba las claves de API de tus proveedores de IA
          </p>
        </div>
        <Button 
          onClick={loadProvidersInfo} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Resumen General */}
      {providersInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Estado de Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{providersInfo.summary.totalProviders}</div>
                <div className="text-sm text-muted-foreground">Total Proveedores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{providersInfo.summary.configured}</div>
                <div className="text-sm text-muted-foreground">Configurados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{providersInfo.summary.missing}</div>
                <div className="text-sm text-muted-foreground">Faltantes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {providersInfo.summary.allConfigured ? (
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Estado General</div>
              </div>
            </div>

            {/* Recomendaciones */}
            {providersInfo.recommendations.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Recomendaciones</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {providersInfo.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="test">Probar APIs</TabsTrigger>
          <TabsTrigger value="custom">Keys Personalizadas</TabsTrigger>
        </TabsList>

        {/* Vista General */}
        <TabsContent value="overview" className="space-y-4">
          {providersInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Gemini */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Key className="h-5 w-5 mr-2" />
                      Google Gemini AI
                    </span>
                    {getStatusBadge(providersInfo.providers.google.status)}
                  </CardTitle>
                  <CardDescription>
                    Variable: {providersInfo.providers.google.envVar}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <strong>Estado:</strong> {providersInfo.providers.google.configured ? 'Configurado' : 'No configurado'}
                    </div>
                    <div>
                      <strong>Clave:</strong> <code className="bg-muted px-2 py-1 rounded text-sm">{providersInfo.providers.google.keyPreview}</code>
                    </div>
                    <div>
                      <strong>Modelos:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {providersInfo.providers.google.models.map(model => (
                          <Badge key={model} variant="outline" className="text-xs">{model}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* OpenAI */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Key className="h-5 w-5 mr-2" />
                      OpenAI GPT
                    </span>
                    {getStatusBadge(providersInfo.providers.openai.status)}
                  </CardTitle>
                  <CardDescription>
                    Variable: {providersInfo.providers.openai.envVar}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <strong>Estado:</strong> {providersInfo.providers.openai.configured ? 'Configurado' : 'No configurado'}
                    </div>
                    <div>
                      <strong>Clave:</strong> <code className="bg-muted px-2 py-1 rounded text-sm">{providersInfo.providers.openai.keyPreview}</code>
                    </div>
                    <div>
                      <strong>Modelos:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {providersInfo.providers.openai.models.map(model => (
                          <Badge key={model} variant="outline" className="text-xs">{model}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Probar APIs */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Probar Conexiones
              </CardTitle>
              <CardDescription>
                Envía un mensaje de prueba a los proveedores para verificar que funcionan correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mensaje personalizado */}
              <div>
                <Label htmlFor="testMessage">Mensaje de prueba</Label>
                <Input
                  id="testMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Mensaje para enviar a los proveedores"
                />
              </div>

              {/* Botones de prueba */}
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => testProvider('google')}
                  disabled={testingProvider !== null}
                  variant="outline"
                >
                  {testingProvider === 'google' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Probar Google
                </Button>
                <Button 
                  onClick={() => testProvider('openai')}
                  disabled={testingProvider !== null}
                  variant="outline"
                >
                  {testingProvider === 'openai' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Probar OpenAI
                </Button>
                <Button 
                  onClick={() => testProvider('both')}
                  disabled={testingProvider !== null}
                >
                  {testingProvider === 'both' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Probar Ambos
                </Button>
              </div>

              {/* Resultados de pruebas */}
              {testResults && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Resultados de Pruebas</h3>
                    <Badge 
                      variant={testResults.summary.allWorking ? "default" : "destructive"}
                      className={testResults.summary.allWorking ? "bg-green-100 text-green-800" : ""}
                    >
                      {testResults.summary.allWorking ? 'Todos funcionando' : 'Errores encontrados'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testResults.results.map((result, index) => (
                      <Card key={index} className={`${
                        result.status === 'success' ? 'border-green-200' : 
                        result.status === 'error' ? 'border-red-200' : 'border-yellow-200'
                      }`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between text-base">
                            <span className="flex items-center">
                              {getStatusIcon(result.status)}
                              <span className="ml-2">{result.provider}</span>
                            </span>
                            {result.responseTime && (
                              <Badge variant="outline" className="text-xs">
                                {result.responseTime}ms
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Clave:</strong> <code className="text-xs">{result.keyVisible}</code>
                            </div>
                            
                            {result.response && (
                              <div>
                                <strong>Respuesta:</strong>
                                <div className="bg-muted p-2 rounded text-xs mt-1">
                                  {result.response}
                                </div>
                              </div>
                            )}
                            
                            {result.error && (
                              <div>
                                <strong>Error:</strong>
                                <div className="bg-red-50 text-red-700 p-2 rounded text-xs mt-1">
                                  {result.error}
                                </div>
                              </div>
                            )}
                            
                            {result.details && (
                              <div>
                                <strong>Detalles:</strong>
                                <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                                  {JSON.stringify(result.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keys Personalizadas */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Probar Keys Personalizadas
              </CardTitle>
              <CardDescription>
                Prueba diferentes API keys sin cambiar la configuración del servidor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowCustomKeys(!showCustomKeys)}
                  variant="outline"
                  size="sm"
                >
                  {showCustomKeys ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {showCustomKeys ? 'Ocultar' : 'Mostrar'} campos
                </Button>
              </div>

              {showCustomKeys && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customGoogleKey">Google API Key (personalizada)</Label>
                    <Input
                      id="customGoogleKey"
                      type="password"
                      value={customGoogleKey}
                      onChange={(e) => setCustomGoogleKey(e.target.value)}
                      placeholder="AIzaSy..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="customOpenAIKey">OpenAI API Key (personalizada)</Label>
                    <Input
                      id="customOpenAIKey"
                      type="password"
                      value={customOpenAIKey}
                      onChange={(e) => setCustomOpenAIKey(e.target.value)}
                      placeholder="sk-..."
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nota de Seguridad</AlertTitle>
                    <AlertDescription>
                      Las keys personalizadas solo se usan para esta prueba y no se guardan en el servidor.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}