'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Building2, Plus, Pencil, Trash2, ArrowLeft, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  minCapacity: number;
  maxCapacity: number;
  description?: string;
  color: string;
  isActive: boolean;
  locationId: string;
  _count?: {
    events: number;
  };
  roomPricing?: Array<{
    id: string;
    price: number;
    workShift: {
      name: string;
    };
    priceList: {
      name: string;
    };
  }>;
}

interface Location {
  id: string;
  name: string;
  address?: string;
}

export default function LocationRoomsPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = params.id as string;
  
  const [location, setLocation] = useState<Location | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    minCapacity: 1,
    maxCapacity: 50,
    description: '',
    color: '#3B82F6',
    isActive: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadLocation();
    loadRooms();
  }, [locationId]);

  const loadLocation = async () => {
    try {
      const res = await fetch(`/api/locations/${locationId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLocation(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms?locationId=${locationId}`);
      const json = await res.json();
      if (json.success) {
        setRooms(json.data || []);
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'No se pudieron cargar las salas',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        minCapacity: room.minCapacity,
        maxCapacity: room.maxCapacity,
        description: room.description || '',
        color: room.color,
        isActive: room.isActive,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        minCapacity: 1,
        maxCapacity: 50,
        description: '',
        color: '#3B82F6',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoom(null);
    setFormData({
      name: '',
      minCapacity: 1,
      maxCapacity: 50,
      description: '',
      color: '#3B82F6',
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

    if (formData.maxCapacity < formData.minCapacity) {
      toast({
        type: 'error',
        title: 'Error',
        description: 'La capacidad máxima debe ser mayor o igual a la mínima',
      });
      return;
    }

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: formData.maxCapacity,
          locationId: editingRoom ? editingRoom.locationId : locationId,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast({
          type: 'success',
          title: 'Éxito',
          description: editingRoom
            ? 'Sala actualizada exitosamente'
            : 'Sala creada exitosamente',
        });
        handleCloseDialog();
        loadRooms();
      } else {
        toast({
          type: 'error',
          title: 'Error',
          description: json.error || 'No se pudo guardar la sala',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'Error al guardar la sala',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sala?')) return;

    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (json.success) {
        toast({
          type: 'success',
          title: 'Éxito',
          description: 'Sala eliminada exitosamente',
        });
        loadRooms();
      } else {
        toast({
          type: 'error',
          title: 'Error',
          description: json.error || 'No se pudo eliminar la sala',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'Error al eliminar la sala',
      });
    }
  };

  const handleToggleActive = async (room: Room) => {
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !room.isActive,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast({
          type: 'success',
          title: 'Éxito',
          description: 'Estado actualizado',
        });
        loadRooms();
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
        <p>Cargando salas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings/locations">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            Salas - {location?.name || 'Ubicación'}
          </h1>
          <p className="text-muted-foreground">
            {location?.address || 'Gestiona las salas de esta ubicación'}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Sala
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay salas</h3>
            <p className="text-muted-foreground mb-4">
              Comienza creando tu primera sala en esta ubicación
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Sala
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: room.color }}
                      />
                      {room.name}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {room.minCapacity === room.maxCapacity
                        ? `${room.maxCapacity} personas`
                        : `${room.minCapacity}-${room.maxCapacity} personas`}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={room.isActive}
                    onCheckedChange={() => handleToggleActive(room)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {room.description && (
                  <p className="text-sm text-muted-foreground">
                    {room.description}
                  </p>
                )}

                {room._count && (
                  <div className="text-sm text-muted-foreground">
                    {room._count.events}{' '}
                    {room._count.events === 1 ? 'evento' : 'eventos'} activos
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(room)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(room.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Editar Sala' : 'Nueva Sala'}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? 'Modifica los datos de la sala'
                : 'Crea una nueva sala en esta ubicación'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Salón Principal"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minCapacity">Capacidad Mínima</Label>
                <Input
                  id="minCapacity"
                  type="number"
                  min="1"
                  value={formData.minCapacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minCapacity: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCapacity">
                  Capacidad Máxima <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min="1"
                  value={formData.maxCapacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxCapacity: parseInt(e.target.value) || 50,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Descripción breve de la sala"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Este color se usará en el calendario de eventos
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Sala activa</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingRoom ? 'Guardar Cambios' : 'Crear Sala'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
