'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Copy, Key } from 'lucide-react';
import { WidgetApiKey } from '@/types/widget';

export function WidgetApiKeysManager() {
  const [apiKeys, setApiKeys] = useState<WidgetApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<WidgetApiKey | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rateLimit: 100
  });

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/widget/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/admin/widget/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadApiKeys();
        setIsCreateDialogOpen(false);
        setFormData({ name: '', rateLimit: 100 });
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const updateApiKey = async () => {
    if (!selectedApiKey) return;

    try {
      const response = await fetch(`/api/admin/widget/api-keys/${selectedApiKey.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          rateLimit: formData.rateLimit,
          isActive: selectedApiKey.isActive
        })
      });

      if (response.ok) {
        await loadApiKeys();
        setIsEditDialogOpen(false);
        setSelectedApiKey(null);
      }
    } catch (error) {
      console.error('Error updating API key:', error);
    }
  };

  const toggleApiKeyStatus = async (apiKey: WidgetApiKey) => {
    try {
      const response = await fetch(`/api/admin/widget/api-keys/${apiKey.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...apiKey,
          isActive: !apiKey.isActive
        })
      });

      if (response.ok) {
        await loadApiKeys();
      }
    } catch (error) {
      console.error('Error toggling API key status:', error);
    }
  };

  const deleteApiKey = async (apiKeyId: string) => {
    try {
      const response = await fetch(`/api/admin/widget/api-keys/${apiKeyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadApiKeys();
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openEditDialog = (apiKey: WidgetApiKey) => {
    setSelectedApiKey(apiKey);
    setFormData({
      name: apiKey.name,
      rateLimit: apiKey.rateLimit
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando claves API...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Claves API del Widget</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona las claves de acceso para integrar el widget en sitios web externos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Clave API
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Clave API</DialogTitle>
              <DialogDescription>
                Crea una nueva clave API para integrar el widget de chat
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Sitio Web Principal"
                />
              </div>
              <div>
                <Label htmlFor="rateLimit">Límite de Tasa (solicitudes/minuto)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createApiKey}>Crear Clave</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Key className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <h4 className="font-semibold">{apiKey.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {apiKey.key.substring(0, 20)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Límite: {apiKey.rateLimit} req/min • Creada: {new Date(apiKey.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                    {apiKey.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Switch
                    checked={apiKey.isActive}
                    onCheckedChange={() => toggleApiKeyStatus(apiKey)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(apiKey)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar clave API?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. La clave API será eliminada permanentemente
                          y cualquier sitio web que la use dejará de funcionar.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteApiKey(apiKey.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {apiKeys.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay claves API</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera clave API para comenzar a integrar el widget de chat
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Clave
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Clave API</DialogTitle>
            <DialogDescription>
              Modifica la configuración de la clave API
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-rateLimit">Límite de Tasa (solicitudes/minuto)</Label>
              <Input
                id="edit-rateLimit"
                type="number"
                value={formData.rateLimit}
                onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateApiKey}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}