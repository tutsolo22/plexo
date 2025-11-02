'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, ArrowLeft, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface Room {
  id: string;
  name: string;
  maxCapacity: number;
  minCapacity: number;
}

interface WorkShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface RoomPricing {
  id: string;
  price: number;
  isActive: boolean;
  room: Room;
  workShift: WorkShift;
}

interface PriceList {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  roomPricing: RoomPricing[];
}

export default function PriceListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const priceListId = params['id'] as string;

  const [priceList, setPriceList] = useState<PriceList | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<RoomPricing | null>(null);
  const [formData, setFormData] = useState({
    roomId: '',
    workShiftId: '',
    price: '',
    isActive: true,
  });

  useEffect(() => {
    fetchPriceList();
    fetchRooms();
    fetchWorkShifts();
  }, [priceListId]);

  const fetchPriceList = async () => {
    try {
      const res = await fetch(`/api/price-lists/${priceListId}`);
      const data = await res.json();
      
      if (data.success) {
        setPriceList(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo cargar la lista de precios',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching price list:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar la lista de precios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchWorkShifts = async () => {
    try {
      const res = await fetch('/api/work-shifts?isActive=true');
      const data = await res.json();
      
      if (data.success) {
        setWorkShifts(data.data);
      }
    } catch (error) {
      console.error('Error fetching work shifts:', error);
    }
  };

  const handleOpenDialog = (pricing?: RoomPricing) => {
    if (pricing) {
      setEditingPricing(pricing);
      setFormData({
        roomId: pricing.room.id,
        workShiftId: pricing.workShift.id,
        price: pricing.price.toString(),
        isActive: pricing.isActive,
      });
    } else {
      setEditingPricing(null);
      setFormData({
        roomId: '',
        workShiftId: '',
        price: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPricing(null);
    setFormData({
      roomId: '',
      workShiftId: '',
      price: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let url: string;
      let method: string;
      let body: any;

      if (editingPricing) {
        // Actualizar precio existente
        url = `/api/price-lists/${priceListId}/room-pricing/${editingPricing.id}`;
        method = 'PUT';
        body = {
          price: parseFloat(formData.price),
          isActive: formData.isActive,
        };
      } else {
        // Crear nuevo precio
        url = `/api/price-lists/${priceListId}/room-pricing`;
        method = 'POST';
        body = {
          roomId: formData.roomId,
          workShiftId: formData.workShiftId,
          price: parseFloat(formData.price),
          isActive: formData.isActive,
        };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: editingPricing ? 'Precio actualizado' : 'Precio asignado',
          description: data.message,
        });
        handleCloseDialog();
        fetchPriceList();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo guardar el precio',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar el precio',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (pricingId: string) => {
    if (!confirm('¿Estás seguro de eliminar este precio?')) return;

    try {
      const res = await fetch(
        `/api/price-lists/${priceListId}/room-pricing/${pricingId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Precio eliminado',
          description: data.message,
        });
        fetchPriceList();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo eliminar el precio',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting pricing:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el precio',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Lista de precios no encontrada</p>
      </div>
    );
  }

  // Agrupar precios por sala
  const pricingByRoom = priceList.roomPricing.reduce((acc, pricing) => {
    const roomId = pricing.room.id;
    if (!acc[roomId]) {
      acc[roomId] = {
        room: pricing.room,
        prices: [],
      };
    }
    acc[roomId].prices.push(pricing);
    return acc;
  }, {} as Record<string, { room: Room; prices: RoomPricing[] }>);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings/price-lists">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{priceList.name}</h1>
          {priceList.description && (
            <p className="text-muted-foreground">{priceList.description}</p>
          )}
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Asignar Precio
        </Button>
      </div>

      {priceList.roomPricing.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay precios configurados para esta lista
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Asigna precios a diferentes salas y turnos laborales
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Asignar primer precio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(pricingByRoom).map(({ room, prices }) => (
            <Card key={room.id}>
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
                <CardDescription>
                  Capacidad: {room.minCapacity} - {room.maxCapacity} personas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {prices.map((pricing) => (
                    <Card key={pricing.id} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {pricing.workShift.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {pricing.workShift.startTime} - {pricing.workShift.endTime}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenDialog(pricing)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(pricing.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">
                              ${pricing.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              por evento
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              pricing.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {pricing.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para Asignar/Editar Precio */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPricing ? 'Editar Precio' : 'Asignar Precio'}
              </DialogTitle>
              <DialogDescription>
                {editingPricing
                  ? 'Modifica el precio para esta sala y turno'
                  : 'Asigna un precio a una sala en un turno específico'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!editingPricing && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="roomId">Sala *</Label>
                    <Select
                      value={formData.roomId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, roomId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sala" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} ({room.minCapacity}-{room.maxCapacity} personas)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workShiftId">Turno *</Label>
                    <Select
                      value={formData.workShiftId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, workShiftId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un turno" />
                      </SelectTrigger>
                      <SelectContent>
                        {workShifts.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.name} ({shift.startTime} - {shift.endTime})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {editingPricing && (
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p className="text-sm font-medium">
                    {editingPricing.room.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {editingPricing.workShift.name} ({editingPricing.workShift.startTime} -{' '}
                    {editingPricing.workShift.endTime})
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="pl-7"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Activo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingPricing ? 'Actualizar' : 'Asignar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
