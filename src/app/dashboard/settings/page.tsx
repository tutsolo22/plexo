'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, User, Building, Bell, Palette, Clock, DollarSign, ChevronRight, Plug, MapPin } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Configuración de empresa
    companyName: 'Plexo',
    companyEmail: 'info@plexo.mx',
    companyPhone: '+52 55 1234 5678',
    companyAddress: 'Ciudad de México, México',

    // Configuración de usuario
    userName: 'Usuario Plexo',
    userEmail: 'usuario@plexo.mx',

    // Notificaciones
    emailNotifications: true,
    smsNotifications: false,
    browserNotifications: true,

    // Configuración del sistema
    darkMode: false,
    language: 'es-MX',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
  });

  const handleSave = () => {
    // Aquí iría la lógica para guardar las configuraciones
    console.log('Guardando configuraciones:', settings);
    alert('Configuraciones guardadas exitosamente');
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Configuraciones</h1>
        <p className='mt-2 text-gray-600 dark:text-gray-300'>
          Gestiona las configuraciones de tu cuenta y preferencias del sistema
        </p>
      </div>

      {/* Navegación Rápida a Configuraciones Especiales */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Link href='/dashboard/settings/branding'>
          <Card className='cursor-pointer transition-all hover:border-plexo-purple hover:shadow-md'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Palette className='h-5 w-5 text-plexo-purple' />
                Personalización
                <ChevronRight className='ml-auto h-5 w-5 text-gray-400' />
              </CardTitle>
              <CardDescription>
                Logo, eslogan, colores y redes sociales de tu negocio
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href='/dashboard/settings/locations'>
          <Card className='cursor-pointer transition-all hover:border-plexo-purple hover:shadow-md'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <MapPin className='h-5 w-5 text-plexo-purple' />
                Lugares y Salas
                <ChevronRight className='ml-auto h-5 w-5 text-gray-400' />
              </CardTitle>
              <CardDescription>
                Gestiona las ubicaciones y salas disponibles para eventos
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href='/dashboard/settings/work-shifts'>
          <Card className='cursor-pointer transition-all hover:border-plexo-purple hover:shadow-md'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Clock className='h-5 w-5 text-plexo-purple' />
                Turnos Laborales
                <ChevronRight className='ml-auto h-5 w-5 text-gray-400' />
              </CardTitle>
              <CardDescription>
                Configura los horarios de trabajo, turnos y días laborables de tu negocio
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href='/dashboard/settings/price-lists'>
          <Card className='cursor-pointer transition-all hover:border-plexo-purple hover:shadow-md'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <DollarSign className='h-5 w-5 text-plexo-purple' />
                Listas de Precios
                <ChevronRight className='ml-auto h-5 w-5 text-gray-400' />
              </CardTitle>
              <CardDescription>
                Administra tus listas de precios y tarifas por turno y sala
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href='/dashboard/settings/integrations'>
          <Card className='cursor-pointer transition-all hover:border-plexo-purple hover:shadow-md'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Plug className='h-5 w-5 text-plexo-purple' />
                Integraciones
                <ChevronRight className='ml-auto h-5 w-5 text-gray-400' />
              </CardTitle>
              <CardDescription>
                Configura WhatsApp, MercadoPago y otras integraciones de servicios externos
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Separador */}
      <div className='border-t pt-6'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
          Configuración General
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Configuración de Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Building className='h-5 w-5' />
              Información de la Empresa
            </CardTitle>
            <CardDescription>Datos básicos de tu empresa</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='companyName'>Nombre de la Empresa</Label>
              <Input
                id='companyName'
                value={settings.companyName}
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor='companyEmail'>Email de Contacto</Label>
              <Input
                id='companyEmail'
                type='email'
                value={settings.companyEmail}
                onChange={e => setSettings({ ...settings, companyEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor='companyPhone'>Teléfono</Label>
              <Input
                id='companyPhone'
                value={settings.companyPhone}
                onChange={e => setSettings({ ...settings, companyPhone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor='companyAddress'>Dirección</Label>
              <Input
                id='companyAddress'
                value={settings.companyAddress}
                onChange={e => setSettings({ ...settings, companyAddress: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Perfil de Usuario
            </CardTitle>
            <CardDescription>Tu información personal</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='userName'>Nombre Completo</Label>
              <Input
                id='userName'
                value={settings.userName}
                onChange={e => setSettings({ ...settings, userName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor='userEmail'>Email Personal</Label>
              <Input
                id='userEmail'
                type='email'
                value={settings.userEmail}
                onChange={e => setSettings({ ...settings, userEmail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='emailNotifications'>Notificaciones por Email</Label>
              <Switch
                id='emailNotifications'
                checked={settings.emailNotifications}
                onCheckedChange={checked =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>
            <div className='flex items-center justify-between'>
              <Label htmlFor='smsNotifications'>Notificaciones por SMS</Label>
              <Switch
                id='smsNotifications'
                checked={settings.smsNotifications}
                onCheckedChange={checked => setSettings({ ...settings, smsNotifications: checked })}
              />
            </div>
            <div className='flex items-center justify-between'>
              <Label htmlFor='browserNotifications'>Notificaciones del Navegador</Label>
              <Switch
                id='browserNotifications'
                checked={settings.browserNotifications}
                onCheckedChange={checked =>
                  setSettings({ ...settings, browserNotifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Palette className='h-5 w-5' />
              Preferencias del Sistema
            </CardTitle>
            <CardDescription>Personaliza la apariencia y comportamiento</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='darkMode'>Modo Oscuro</Label>
              <Switch
                id='darkMode'
                checked={settings.darkMode}
                onCheckedChange={checked => setSettings({ ...settings, darkMode: checked })}
              />
            </div>
            <div>
              <Label htmlFor='language'>Idioma</Label>
              <select
                id='language'
                className='mt-1 w-full rounded-md border p-2'
                value={settings.language}
                onChange={e => setSettings({ ...settings, language: e.target.value })}
              >
                <option value='es-MX'>Español (México)</option>
                <option value='en-US'>English (US)</option>
              </select>
            </div>
            <div>
              <Label htmlFor='currency'>Moneda</Label>
              <select
                id='currency'
                className='mt-1 w-full rounded-md border p-2'
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value='MXN'>Peso Mexicano (MXN)</option>
                <option value='USD'>Dólar Americano (USD)</option>
                <option value='EUR'>Euro (EUR)</option>
              </select>
            </div>
            <div>
              <Label htmlFor='timezone'>Zona Horaria</Label>
              <select
                id='timezone'
                className='mt-1 w-full rounded-md border p-2'
                value={settings.timezone}
                onChange={e => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value='America/Mexico_City'>Ciudad de México</option>
                <option value='America/Cancun'>Cancún</option>
                <option value='America/Monterrey'>Monterrey</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de Guardar */}
      <div className='flex justify-end'>
        <Button onClick={handleSave} className='bg-plexo-purple hover:bg-plexo-purple/90'>
          <Save className='mr-2 h-4 w-4' />
          Guardar Configuraciones
        </Button>
      </div>
    </div>
  );
}
