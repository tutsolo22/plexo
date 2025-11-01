'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

interface Location {
  id: string;
  name: string;
  address?: string;
  description?: string;
  isActive: boolean;
  businessIdentityId: string;
  businessIdentity: {
    id: string;
    name: string;
  };
  _count: {
    rooms: number;
  };
  rooms?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [businessIdentityId, setBusinessIdentityId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    isActive: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessIdentity();
    loadLocations();
  }, []);

  const loadBusinessIdentity = async () => {
    try {
      const res = await fetch('/api/business-identity');
      const json = await res.json();
      if (json.success && json.data) {
        setBusinessIdentityId(json.data.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/locations');
      const json = await res.json();
      if (json.success) {
        setLocations(json.data || []);
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'No se pudieron cargar las ubicaciones',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address || '',
        description: location.description || '',
        isActive: location.isActive,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        description: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        type: 'error',
        title: 'Error',
        description: 'El nombre es requerido',
      });
      return;
    }

    if (!businessIdentityId && !editingLocation) {
      toast({
        type: 'error',
        title: 'Error',
        description: 'No se encontró información del negocio',
      });
      return;
    }

    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : '/api/locations';
      const method = editingLocation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessIdentityId: editingLocation
            ? editingLocation.businessIdentityId
            : businessIdentityId,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast({
          type: 'success',
          title: 'Éxito',
          description: editingLocation
            ? 'Ubicación actualizada exitosamente'
            : 'Ubicación creada exitosamente',
        });
        handleCloseDialog();
        loadLocations();
      } else {
        toast({
          type: 'error',
          title: 'Error',
          description: json.error || 'No se pudo guardar la ubicación',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'Error al guardar la ubicación',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ubicación?')) return;

    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (json.success) {
        toast({
          type: 'success',
          title: 'Éxito',
          description: 'Ubicación eliminada exitosamente',
        });
        loadLocations();
      } else {
        toast({
          type: 'error',
          title: 'Error',
          description: json.error || 'No se pudo eliminar la ubicación',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'Error al eliminar la ubicación',
      });
    }
  };

  const handleToggleActive = async (location: Location) => {
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...location,
          isActive: !location.isActive,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast({
          type: 'success',
          title: 'Éxito',
          description: 'Estado actualizado',
        });
        loadLocations();
      } else {
        toast({
          type: 'error',
          title: 'Error',
          description: json.error || 'No se pudo actualizar',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'Error al actualizar',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando ubicaciones...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lugares y Ubicaciones</h1>
          <p className="text-muted-foreground">
            Gestiona los diferentes lugares donde se realizan tus eventos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Ubicación
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay ubicaciones</h3>
            <p className="text-muted-foreground mb-4">
              Comienza creando tu primera ubicación
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Ubicación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-plexo-purple" />
                      {location.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {location.address || 'Sin dirección'}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={location.isActive}
                    onCheckedChange={() => handleToggleActive(location)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {location.description && (
                  <p className="text-sm text-muted-foreground">
                    {location.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {location._count.rooms}{' '}
                    {location._count.rooms === 1 ? 'sala' : 'salas'}
                  </span>
                  <Link href={`/dashboard/settings/locations/${location.id}/rooms`}>
                    <Button variant="outline" size="sm">
                      <Building2 className="w-4 h-4 mr-2" />
                      Ver Salas
                    </Button>
                  </Link>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(location)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(location.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Modifica los datos de la ubicación'
                : 'Crea una nueva ubicación para tus eventos'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Jardín Principal"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Calle, Colonia, Ciudad"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Descripción breve del lugar"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Ubicación activa</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingLocation ? 'Guardar Cambios' : 'Crear Ubicación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
