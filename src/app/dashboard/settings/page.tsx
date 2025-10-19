'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Save, User, Building, Bell, Shield, Palette } from 'lucide-react'

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
    timezone: 'America/Mexico_City'
  })

  const handleSave = () => {
    // Aquí iría la lógica para guardar las configuraciones
    console.log('Guardando configuraciones:', settings)
    alert('Configuraciones guardadas exitosamente')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuraciones</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Gestiona las configuraciones de tu cuenta y preferencias del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Información de la Empresa
            </CardTitle>
            <CardDescription>
              Datos básicos de tu empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nombre de la Empresa</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Email de Contacto</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings({...settings, companyEmail: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Teléfono</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone}
                onChange={(e) => setSettings({...settings, companyPhone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="companyAddress">Dirección</Label>
              <Input
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil de Usuario
            </CardTitle>
            <CardDescription>
              Tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userName">Nombre Completo</Label>
              <Input
                id="userName"
                value={settings.userName}
                onChange={(e) => setSettings({...settings, userName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="userEmail">Email Personal</Label>
              <Input
                id="userEmail"
                type="email"
                value={settings.userEmail}
                onChange={(e) => setSettings({...settings, userEmail: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Configura cómo quieres recibir notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="smsNotifications">Notificaciones por SMS</Label>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="browserNotifications">Notificaciones del Navegador</Label>
              <Switch
                id="browserNotifications"
                checked={settings.browserNotifications}
                onCheckedChange={(checked) => setSettings({...settings, browserNotifications: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Preferencias del Sistema
            </CardTitle>
            <CardDescription>
              Personaliza la apariencia y comportamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode">Modo Oscuro</Label>
              <Switch
                id="darkMode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
              />
            </div>
            <div>
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                className="w-full mt-1 p-2 border rounded-md"
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
              >
                <option value="es-MX">Español (México)</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="currency">Moneda</Label>
              <select
                id="currency"
                className="w-full mt-1 p-2 border rounded-md"
                value={settings.currency}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
              >
                <option value="MXN">Peso Mexicano (MXN)</option>
                <option value="USD">Dólar Americano (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="timezone">Zona Horaria</Label>
              <select
                id="timezone"
                className="w-full mt-1 p-2 border rounded-md"
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
              >
                <option value="America/Mexico_City">Ciudad de México</option>
                <option value="America/Cancun">Cancún</option>
                <option value="America/Monterrey">Monterrey</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-plexo-purple hover:bg-plexo-purple/90">
          <Save className="h-4 w-4 mr-2" />
          Guardar Configuraciones
        </Button>
      </div>
    </div>
  )
}