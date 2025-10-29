import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetApiKeysManager } from './components/WidgetApiKeysManager';
import { WidgetConfigManager } from './components/WidgetConfigManager';
import { WidgetAnalytics } from './components/WidgetAnalytics';
import { WidgetPreview } from './components/WidgetPreview';

export default function WidgetAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Administración del Widget de Chat</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las claves API, configura la apariencia y monitorea el uso de tu widget de chat
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="api-keys">Claves API</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Widget</CardTitle>
              <CardDescription>
                Personaliza la apariencia y comportamiento de tu widget de chat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Cargando configuración...</div>}>
                <WidgetConfigManager />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Claves API</CardTitle>
              <CardDescription>
                Crea y administra las claves API necesarias para integrar el widget en sitios web
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Cargando claves API...</div>}>
                <WidgetApiKeysManager />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics del Widget</CardTitle>
              <CardDescription>
                Monitorea el uso y rendimiento de tu widget de chat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Cargando analytics...</div>}>
                <WidgetAnalytics />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa del Widget</CardTitle>
              <CardDescription>
                Visualiza cómo se verá tu widget con la configuración actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Cargando vista previa...</div>}>
                <WidgetPreview />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}