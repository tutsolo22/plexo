'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, CreditCard, Save, Eye, EyeOff } from 'lucide-react';

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [showTokens, setShowTokens] = useState({
    whatsapp: false,
    mercadopago: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/configurations', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setConfig(json.data || {});
      } else {
        toast({
          type: 'error',
          title: 'Error',
          description: json.error || 'Error cargando configuraciones',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/configurations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      
      if (json.success) {
        setConfig((prev) => ({ ...prev, [key]: value }));
        toast({
          type: 'success',
          title: 'Guardado',
          description: 'Configuración guardada exitosamente',
        });
      } else {
        toast({
          type: 'error',
          title: 'Error',
          description: json.error || 'No se pudo guardar la configuración',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'No se pudo guardar la configuración',
      });
    }
  };

  const saveAllWhatsApp = async () => {
    try {
      await saveConfig('whatsapp_number', config['whatsapp_number'] || '');
      await saveConfig('whatsapp_token', config['whatsapp_token'] || '');
      await saveConfig('whatsapp_id', config['whatsapp_id'] || '');
      toast({
        type: 'success',
        title: 'Éxito',
        description: 'Configuración de WhatsApp guardada',
      });
    } catch (e) {
      toast({
        type: 'error',
        title: 'Error',
        description: 'Error al guardar configuración de WhatsApp',
      });
    }
  };

  const saveAllMercadoPago = async () => {
    try {
      await saveConfig('mercadopago_access_token', config['mercadopago_access_token'] || '');
      await saveConfig('mercadopago_sandbox', config['mercadopago_sandbox'] || 'false');
      toast({
        type: 'success',
        title: 'Éxito',
        description: 'Configuración de MercadoPago guardada',
      });
    } catch (e) {
      toast({
        type: 'error',
        title: 'Error',
        description: 'Error al guardar configuración de MercadoPago',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando configuraciones...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integraciones</h1>
        <p className="text-muted-foreground">
          Configura las credenciales de WhatsApp y pasarelas de pago
        </p>
      </div>

      {/* WhatsApp Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            WhatsApp Business API
          </CardTitle>
          <CardDescription>
            Configura las credenciales de WhatsApp para enviar mensajes y notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">
                Número de WhatsApp
                <span className="text-xs text-muted-foreground ml-2">
                  (formato internacional)
                </span>
              </Label>
              <Input
                id="whatsapp_number"
                placeholder="+52 55 1234 5678"
                value={config['whatsapp_number'] || ''}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, whatsapp_number: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_id">WhatsApp ID</Label>
              <Input
                id="whatsapp_id"
                placeholder="ID de WhatsApp Business"
                value={config['whatsapp_id'] || ''}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, whatsapp_id: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_token">Token de Acceso</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp_token"
                type={showTokens.whatsapp ? 'text' : 'password'}
                placeholder="Token de WhatsApp Business API"
                value={config['whatsapp_token'] || ''}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, whatsapp_token: e.target.value }))
                }
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setShowTokens((prev) => ({ ...prev, whatsapp: !prev.whatsapp }))
                }
              >
                {showTokens.whatsapp ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveAllWhatsApp}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración de WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MercadoPago Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            MercadoPago
          </CardTitle>
          <CardDescription>
            Configura las credenciales de MercadoPago para procesar pagos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mercadopago_access_token">Access Token</Label>
            <div className="flex gap-2">
              <Input
                id="mercadopago_access_token"
                type={showTokens.mercadopago ? 'text' : 'password'}
                placeholder="Access Token de MercadoPago"
                value={config['mercadopago_access_token'] || ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    mercadopago_access_token: e.target.value,
                  }))
                }
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setShowTokens((prev) => ({ ...prev, mercadopago: !prev.mercadopago }))
                }
              >
                {showTokens.mercadopago ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Obtén tu Access Token desde el{' '}
              <a
                href="https://www.mercadopago.com.mx/developers/panel/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                panel de desarrolladores de MercadoPago
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mercadopago_sandbox">Entorno</Label>
            <Select
              value={config['mercadopago_sandbox'] || 'false'}
              onValueChange={(value) =>
                setConfig((prev) => ({ ...prev, mercadopago_sandbox: value }))
              }
            >
              <SelectTrigger id="mercadopago_sandbox">
                <SelectValue placeholder="Seleccionar entorno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Producción (pagos reales)</SelectItem>
                <SelectItem value="true">Sandbox (modo prueba)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              En modo Sandbox podrás realizar pruebas sin procesar pagos reales
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveAllMercadoPago}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración de MercadoPago
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
