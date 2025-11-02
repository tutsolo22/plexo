'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface WorkShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  isActive: boolean;
  roomsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkingDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

const DAYS_LABELS: Record<keyof WorkingDays, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export default function WorkShiftsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [workingDays, setWorkingDays] = useState<WorkingDays>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingDays, setSavingDays] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchWorkShifts();
    fetchWorkingDays();
  }, []);

  const fetchWorkShifts = async () => {
    try {
      const res = await fetch('/api/work-shifts');
      const data = await res.json();
      
      if (data.success) {
        setWorkShifts(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los turnos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching work shifts:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar los turnos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkingDays = async () => {
    try {
      const res = await fetch('/api/work-shifts/config/working-days');
      const data = await res.json();
      
      if (data.success) {
        setWorkingDays(data.data);
      }
    } catch (error) {
      console.error('Error fetching working days:', error);
    }
  };

  const handleSaveWorkingDays = async () => {
    setSavingDays(true);
    try {
      const res = await fetch('/api/work-shifts/config/working-days', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workingDays),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Días laborables actualizados',
          description: 'La configuración se guardó correctamente',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo guardar la configuración',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving working days:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setSavingDays(false);
    }
  };

  const handleOpenDialog = (shift?: WorkShift) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        description: shift.description || '',
        isActive: shift.isActive,
      });
    } else {
      setEditingShift(null);
      setFormData({
        name: '',
        startTime: '',
        endTime: '',
        description: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingShift(null);
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingShift
        ? `/api/work-shifts/${editingShift.id}`
        : '/api/work-shifts';
      
      const method = editingShift ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: editingShift ? 'Turno actualizado' : 'Turno creado',
          description: data.message,
        });
        handleCloseDialog();
        fetchWorkShifts();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo guardar el turno',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving shift:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar el turno',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este turno?')) return;

    try {
      const res = await fetch(`/api/work-shifts/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Turno eliminado',
          description: data.message,
        });
        fetchWorkShifts();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo eliminar el turno',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el turno',
        variant: 'destructive',
      });
    }
  };

  const handleToggleDay = (day: keyof WorkingDays) => {
    setWorkingDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Turnos Laborales</h1>
          <p className="text-muted-foreground">
            Configura los horarios y días de trabajo
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Turno
        </Button>
      </div>

      {/* Días Laborables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Días Laborables
          </CardTitle>
          <CardDescription>
            Selecciona los días de la semana en que operas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(DAYS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={workingDays[key as keyof WorkingDays]}
                  onCheckedChange={() => handleToggleDay(key as keyof WorkingDays)}
                />
                <Label htmlFor={key} className="cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
          <Button onClick={handleSaveWorkingDays} disabled={savingDays}>
            {savingDays ? 'Guardando...' : 'Guardar Días Laborables'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Turnos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Turnos Configurados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workShifts.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay turnos configurados
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear primer turno
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workShifts.map((shift) => (
                <Card key={shift.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{shift.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="w-4 h-4" />
                          {shift.startTime} - {shift.endTime}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(shift)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(shift.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {shift.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {shift.description}
                      </p>
                    </CardContent>
                  )}
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {shift.roomsCount} sala(s) con precio
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          shift.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {shift.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Crear/Editar Turno */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingShift ? 'Editar Turno' : 'Nuevo Turno'}
              </DialogTitle>
              <DialogDescription>
                {editingShift
                  ? 'Modifica los datos del turno laboral'
                  : 'Crea un nuevo turno laboral'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Turno *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Turno Matutino"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora Inicio *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora Fin *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción opcional"
                />
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
                {editingShift ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
