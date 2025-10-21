'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, Upload } from 'lucide-react';
import { WidgetConfig } from '@/types/widget';

export function WidgetConfigManager() {
  const [, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    logoUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#F3F4F6',
    welcomeMessage: '¡Hola! Soy el asistente de tu negocio. ¿En qué puedo ayudarte hoy?',
    isActive: true
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/widget/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setFormData({
          businessName: data.businessName || '',
          logoUrl: data.logoUrl || '',
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#F3F4F6',
          welcomeMessage: data.welcomeMessage || '¡Hola! Soy el asistente de tu negocio. ¿En qué puedo ayudarte hoy?',
          isActive: data.isActive ?? true
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/widget/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setConfig(updatedConfig);
        // Mostrar mensaje de éxito
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Aquí iría la lógica para subir el logo a un servicio de almacenamiento
    // Por ahora, simulamos una URL
    const formDataUpload = new FormData();
    formDataUpload.append('logo', file);

    try {
      const response = await fetch('/api/admin/widget/upload-logo', {
        method: 'POST',
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, logoUrl: data.logoUrl });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información del Negocio */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Negocio</CardTitle>
            <CardDescription>
              Configura la información básica que se mostrará en el widget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Nombre del Negocio</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Mi Negocio"
              />
            </div>

            <div>
              <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
              <Textarea
                id="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                placeholder="Mensaje que verá el usuario al abrir el chat"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Widget Activo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Personalización Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Personalización Visual</CardTitle>
            <CardDescription>
              Personaliza los colores y logo del widget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo">Logo del Negocio</Label>
              <div className="flex items-center space-x-4 mt-2">
                {formData.logoUrl && (
                  <Image
                    src={formData.logoUrl}
                    alt="Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Label htmlFor="logo" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="primaryColor">Color Principal</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-16 h-10 border rounded cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Color Secundario</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-16 h-10 border rounded cursor-pointer"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#F3F4F6"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista Previa */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
          <CardDescription>
            Así se verá tu widget con la configuración actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="max-w-sm mx-auto">
              {/* Simulación del widget */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div
                  className="p-3 text-white flex items-center justify-between text-sm"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  <div className="flex items-center space-x-2">
                    {formData.logoUrl && (
                      <Image
                        src={formData.logoUrl}
                        alt={formData.businessName}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{formData.businessName || 'Tu Negocio'}</div>
                      <div className="text-xs opacity-80">En línea</div>
                    </div>
                  </div>
                  <div className="text-white cursor-pointer">×</div>
                </div>

                {/* Mensajes */}
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  <div className="text-center text-gray-500 text-xs">
                    {formData.welcomeMessage}
                  </div>
                  <div className="flex justify-start">
                    <div
                      className="max-w-xs px-2 py-1 rounded-lg text-xs text-gray-800"
                      style={{ backgroundColor: formData.secondaryColor }}
                    >
                      ¡Hola! ¿En qué puedo ayudarte?
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div className="p-3 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      disabled
                    />
                    <button
                      className="px-3 py-1 text-white rounded text-xs"
                      style={{ backgroundColor: formData.primaryColor }}
                      disabled
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}