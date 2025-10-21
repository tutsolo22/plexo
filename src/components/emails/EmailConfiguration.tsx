'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  Save,
  TestTube,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface SMTPConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  provider: string;
  isActive: boolean;
}

interface TestEmailData {
  to: string;
  subject: string;
  template: 'basic' | 'professional' | 'custom';
}

const EmailConfiguration: React.FC = () => {
  const [config, setConfig] = useState<SMTPConfig>({
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    provider: 'smtp',
    isActive: false,
  });

  const [testEmail, setTestEmail] = useState<TestEmailData>({
    to: '',
    subject: 'Prueba de configuración de email - Gestión de Eventos',
    template: 'professional',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/emails/config');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const handleConfigChange = (field: keyof SMTPConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestEmailChange = (field: keyof TestEmailData, value: string) => {
    setTestEmail(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveConfiguration = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/emails/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar la configuración' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/emails/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testEmail,
          config,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Email de prueba enviado exitosamente' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al enviar el email de prueba' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión al enviar el email de prueba' });
    } finally {
      setTesting(false);
    }
  };

  const isFormValid = () => {
    return (
      config.smtpHost &&
      config.smtpPort &&
      config.smtpUser &&
      config.smtpPassword &&
      config.fromEmail
    );
  };

  const isTestEmailValid = () => {
    return testEmail.to && testEmail.subject && isFormValid();
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Configuración de Email</h1>
          <p className='text-gray-600'>Configure el servidor SMTP para el envío de emails</p>
        </div>
        <div className='flex items-center space-x-2'>
          <Settings className='h-5 w-5 text-gray-500' />
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <Card
          className={`border-l-4 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
        >
          <CardContent className='p-4'>
            <div
              className={`flex items-center ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}
            >
              {message.type === 'success' ? (
                <CheckCircle className='mr-2 h-5 w-5' />
              ) : (
                <AlertCircle className='mr-2 h-5 w-5' />
              )}
              {message.text}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuración SMTP */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Mail className='mr-2 h-5 w-5' />
            Configuración SMTP
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='smtpHost'>Servidor SMTP *</Label>
              <Input
                id='smtpHost'
                type='text'
                placeholder='smtp.gmail.com'
                value={config.smtpHost}
                onChange={e => handleConfigChange('smtpHost', e.target.value)}
              />
              <p className='mt-1 text-xs text-gray-500'>Ej: smtp.gmail.com, smtp.outlook.com</p>
            </div>

            <div>
              <Label htmlFor='smtpPort'>Puerto *</Label>
              <Input
                id='smtpPort'
                type='number'
                placeholder='587'
                value={config.smtpPort}
                onChange={e => handleConfigChange('smtpPort', parseInt(e.target.value) || 587)}
              />
              <p className='mt-1 text-xs text-gray-500'>587 (TLS), 465 (SSL), 25 (no seguro)</p>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='smtpSecure'
              checked={config.smtpSecure}
              onChange={e => handleConfigChange('smtpSecure', e.target.checked)}
              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <Label htmlFor='smtpSecure' className='text-sm'>
              Usar conexión segura (SSL/TLS)
            </Label>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='smtpUser'>Usuario/Email *</Label>
              <Input
                id='smtpUser'
                type='email'
                placeholder='tu-email@empresa.com'
                value={config.smtpUser}
                onChange={e => handleConfigChange('smtpUser', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='smtpPassword'>Contraseña *</Label>
              <div className='relative'>
                <Input
                  id='smtpPassword'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='************'
                  value={config.smtpPassword}
                  onChange={e => handleConfigChange('smtpPassword', e.target.value)}
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 flex items-center pr-3'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 text-gray-400' />
                  ) : (
                    <Eye className='h-4 w-4 text-gray-400' />
                  )}
                </button>
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                Para Gmail, use una contraseña de aplicación
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='fromName'>Nombre del remitente</Label>
              <Input
                id='fromName'
                type='text'
                placeholder='Gestión de Eventos'
                value={config.fromName}
                onChange={e => handleConfigChange('fromName', e.target.value)}
              />
              <p className='mt-1 text-xs text-gray-500'>Nombre que aparecerá en el remitente</p>
            </div>

            <div>
              <Label htmlFor='fromEmail'>Email remitente *</Label>
              <Input
                id='fromEmail'
                type='email'
                placeholder='noreply@gestion-eventos.com'
                value={config.fromEmail}
                onChange={e => handleConfigChange('fromEmail', e.target.value)}
              />
              <p className='mt-1 text-xs text-gray-500'>Este email aparecerá como remitente</p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='replyToEmail'>Email de respuesta</Label>
              <Input
                id='replyToEmail'
                type='email'
                placeholder='contacto@gestion-eventos.com'
                value={config.replyToEmail}
                onChange={e => handleConfigChange('replyToEmail', e.target.value)}
              />
              <p className='mt-1 text-xs text-gray-500'>Email para recibir respuestas (opcional)</p>
            </div>

            <div>
              <Label htmlFor='provider'>Proveedor</Label>
              <select
                id='provider'
                value={config.provider}
                onChange={e => handleConfigChange('provider', e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='smtp'>SMTP Personalizado</option>
                <option value='gmail'>Gmail</option>
                <option value='outlook'>Outlook</option>
              </select>
              <p className='mt-1 text-xs text-gray-500'>Selecciona el proveedor de email</p>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button onClick={saveConfiguration} disabled={!isFormValid() || saving}>
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prueba de Email */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <TestTube className='mr-2 h-5 w-5' />
            Probar Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='testTo'>Email de destino *</Label>
              <Input
                id='testTo'
                type='email'
                placeholder='prueba@ejemplo.com'
                value={testEmail.to}
                onChange={e => handleTestEmailChange('to', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='testTemplate'>Plantilla</Label>
              <select
                id='testTemplate'
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={testEmail.template}
                onChange={e => handleTestEmailChange('template', e.target.value)}
              >
                <option value='basic'>Básica</option>
                <option value='professional'>Profesional</option>
                <option value='custom'>Personalizada</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor='testSubject'>Asunto</Label>
            <Input
              id='testSubject'
              type='text'
              value={testEmail.subject}
              onChange={e => handleTestEmailChange('subject', e.target.value)}
            />
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={sendTestEmail}
              disabled={!isTestEmailValid() || testing}
              variant='outline'
            >
              {testing ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Enviando...
                </>
              ) : (
                <>
                  <TestTube className='mr-2 h-4 w-4' />
                  Enviar Email de Prueba
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guía de configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Guía de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4 text-sm'>
            <div>
              <h4 className='mb-2 font-medium text-gray-900'>Gmail</h4>
              <ul className='list-inside list-disc space-y-1 text-gray-600'>
                <li>Host: smtp.gmail.com</li>
                <li>Puerto: 587 (TLS) o 465 (SSL)</li>
                <li>Seguro: Activado</li>
                <li>Genere una contraseña de aplicación en su cuenta de Gmail</li>
              </ul>
            </div>

            <div>
              <h4 className='mb-2 font-medium text-gray-900'>Outlook/Hotmail</h4>
              <ul className='list-inside list-disc space-y-1 text-gray-600'>
                <li>Host: smtp-mail.outlook.com</li>
                <li>Puerto: 587</li>
                <li>Seguro: Activado</li>
                <li>Use sus credenciales normales de Outlook</li>
              </ul>
            </div>

            <div>
              <h4 className='mb-2 font-medium text-gray-900'>Otros proveedores</h4>
              <p className='text-gray-600'>
                Consulte la documentación de su proveedor de email para obtener la configuración
                SMTP correcta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfiguration;
