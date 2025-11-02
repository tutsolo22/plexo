'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash2, DollarSign, FileText } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface PriceList {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  clientsCount: number;
  roomPricingCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PriceListsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<PriceList | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchPriceLists();
  }, []);

  const fetchPriceLists = async () => {
    try {
      const res = await fetch('/api/price-lists');
      const data = await res.json();
      
      if (data.success) {
        setPriceLists(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las listas de precios',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching price lists:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar las listas de precios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (list?: PriceList) => {
    if (list) {
      setEditingList(list);
      setFormData({
        name: list.name,
        description: list.description || '',
        isActive: list.isActive,
      });
    } else {
      setEditingList(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingList(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingList
        ? `/api/price-lists/${editingList.id}`
        : '/api/price-lists';
      
      const method = editingList ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: editingList ? 'Lista actualizada' : 'Lista creada',
          description: data.message,
        });
        handleCloseDialog();
        fetchPriceLists();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo guardar la lista',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving price list:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar la lista',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta lista de precios?')) return;

    try {
      const res = await fetch(`/api/price-lists/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Lista eliminada',
          description: data.message,
        });
        fetchPriceLists();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo eliminar la lista',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting price list:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar la lista',
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Listas de Precios</h1>
          <p className="text-muted-foreground">
            Gestiona diferentes listas de precios para tus salas
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Lista
        </Button>
      </div>

      {priceLists.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay listas de precios configuradas
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Las listas de precios te permiten tener diferentes tarifas para
              <br />
              distintos tipos de clientes (Público General, Friends & Family, etc.)
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primera lista
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {priceLists.map((list) => (
            <Card key={list.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    {list.description && (
                      <CardDescription className="mt-1">
                        {list.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(list)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(list.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clientes:</span>
                  <span className="font-medium">{list.clientsCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Precios configurados:</span>
                  <span className="font-medium">{list.roomPricingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      list.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {list.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                  <Link href={`/dashboard/settings/price-lists/${list.id}`}>
                    <Button variant="outline" size="sm">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Configurar Precios
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para Crear/Editar Lista */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingList ? 'Editar Lista' : 'Nueva Lista de Precios'}
              </DialogTitle>
              <DialogDescription>
                {editingList
                  ? 'Modifica los datos de la lista de precios'
                  : 'Crea una nueva lista de precios'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Lista *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Público General, Friends & Family"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplos: Público General, Friends & Family, Cliente Externo, Corporativo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción opcional de la lista"
                  rows={3}
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
                <Label htmlFor="isActive">Activa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingList ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
