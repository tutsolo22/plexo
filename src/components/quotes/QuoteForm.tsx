'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Save, 
  Send, 
  User, 
  Calendar, 
  DollarSign, 
  Package,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  category: string;
}

interface PackageItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productId?: string;
  serviceId?: string;
}

interface QuotePackage {
  id: string;
  name: string;
  description?: string;
  subtotal: number;
  packageTemplateId?: string;
  items: PackageItem[];
}

interface QuoteFormProps {
  quoteId?: string; // Para edición
  clientId?: string; // Cliente pre-seleccionado
  eventId?: string; // Evento pre-seleccionado
  onSuccess?: (quote: any) => void;
  onCancel?: () => void;
  className?: string;
}

export default function QuoteForm({
  quoteId,
  clientId,
  eventId,
  onSuccess,
  onCancel,
  className = '',
}: QuoteFormProps) {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados de datos
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Estados del formulario
  const [formData, setFormData] = useState({
    clientId: clientId || '',
    eventId: eventId || '',
    templateId: '',
    subtotal: 0,
    discount: 0,
    total: 0,
    validUntil: '',
    notes: '',
    packages: [] as QuotePackage[],
  });

  // Estados de UI
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    subtotal: 0,
    items: [] as PackageItem[],
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    
    // Configurar fecha de validez por defecto (30 días)
    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      validUntil: defaultValidUntil.toISOString().split('T')[0],
    }));
  }, []);

  // Cargar eventos cuando cambie el cliente
  useEffect(() => {
    if (formData.clientId) {
      loadClientEvents(formData.clientId);
    }
  }, [formData.clientId]);

  // Recalcular totales cuando cambien los paquetes
  useEffect(() => {
    const subtotal = formData.packages.reduce((sum, pkg) => sum + pkg.subtotal, 0);
    const total = subtotal - formData.discount;
    setFormData(prev => ({
      ...prev,
      subtotal,
      total: Math.max(0, total),
    }));
  }, [formData.packages, formData.discount]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [clientsRes, templatesRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/templates'),
      ]);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.success ? clientsData.data : []);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.success ? templatesData.data : []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadClientEvents = async (clientId: string) => {
    try {
      const response = await fetch(`/api/events?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.success ? data.data : []);
      }
    } catch (error) {
      console.error('Error loading client events:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addPackage = () => {
    if (!newPackage.name) {
      setError('El nombre del paquete es requerido');
      return;
    }

    const packageId = `pkg-${Date.now()}`;
    const packageToAdd: QuotePackage = {
      id: packageId,
      name: newPackage.name,
      description: newPackage.description,
      subtotal: newPackage.subtotal,
      items: newPackage.items,
    };

    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, packageToAdd],
    }));

    // Resetear formulario de paquete
    setNewPackage({
      name: '',
      description: '',
      subtotal: 0,
      items: [],
    });
    setShowPackageForm(false);
  };

  const removePackage = (packageId: string) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter(pkg => pkg.id !== packageId),
    }));
  };

  const handleSubmit = async (status: 'DRAFT' | 'PENDING_MANAGER' = 'DRAFT') => {
    if (!formData.clientId) {
      setError('Debe seleccionar un cliente');
      return;
    }

    if (formData.total <= 0) {
      setError('El total debe ser mayor a cero');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = quoteId ? `/api/quotes/${quoteId}` : '/api/quotes';
      const method = quoteId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        status,
        // Mapear paquetes al formato esperado por la API
        packages: formData.packages.map(pkg => ({
          name: pkg.name,
          description: pkg.description,
          subtotal: pkg.subtotal,
          packageTemplateId: pkg.packageTemplateId,
          items: pkg.items.map(item => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            description: item.description,
            productId: item.productId,
            serviceId: item.serviceId,
          })),
        })),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Cotización ${quoteId ? 'actualizada' : 'creada'} exitosamente`);
        onSuccess?.(result.data);
      } else {
        setError(result.error || 'Error procesando la cotización');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando formulario...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {quoteId ? 'Editar Cotización' : 'Nueva Cotización'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancelar
            </Button>
          )}
          <Button
            onClick={() => handleSubmit('DRAFT')}
            disabled={saving}
            variant="outline"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar Borrador
          </Button>
          <Button
            onClick={() => handleSubmit('PENDING_MANAGER')}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar para Aprobación
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <select
                id="client"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event">Evento (Opcional)</Label>
              <select
                id="event"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.eventId}
                onChange={(e) => handleInputChange('eventId', e.target.value)}
                disabled={!formData.clientId}
              >
                <option value="">Sin evento asociado...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template (Opcional)</Label>
              <select
                id="template"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.templateId}
                onChange={(e) => handleInputChange('templateId', e.target.value)}
              >
                <option value="">Sin template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Válida hasta *</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleInputChange('validUntil', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre la cotización..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Paquetes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Paquetes ({formData.packages.length})
            </CardTitle>
            <Button
              onClick={() => setShowPackageForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Paquete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulario de nuevo paquete */}
          {showPackageForm && (
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Nuevo Paquete</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageName">Nombre del Paquete *</Label>
                  <Input
                    id="packageName"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Paquete Básico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageSubtotal">Subtotal *</Label>
                  <Input
                    id="packageSubtotal"
                    type="number"
                    step="0.01"
                    value={newPackage.subtotal}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Acciones</Label>
                  <div className="flex gap-2">
                    <Button onClick={addPackage} size="sm">
                      Agregar
                    </Button>
                    <Button
                      onClick={() => setShowPackageForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Label htmlFor="packageDescription">Descripción</Label>
                <textarea
                  id="packageDescription"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={2}
                  value={newPackage.description}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del paquete..."
                />
              </div>
            </div>
          )}

          {/* Lista de paquetes */}
          {formData.packages.length > 0 ? (
            <div className="space-y-3">
              {formData.packages.map((pkg) => (
                <div key={pkg.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{pkg.name}</h4>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      )}
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        {formatCurrency(pkg.subtotal)}
                      </p>
                    </div>
                    <Button
                      onClick={() => removePackage(pkg.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay paquetes agregados</p>
              <p className="text-sm">Haz clic en "Agregar Paquete" para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen Financiero */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal</Label>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(formData.subtotal)}
              </div>
              <p className="text-sm text-gray-600">
                Calculado automáticamente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Descuento</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-600">
                Descuento a aplicar
              </p>
            </div>

            <div className="space-y-2">
              <Label>Total</Label>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(formData.total)}
              </div>
              <p className="text-sm text-gray-600">
                Total final de la cotización
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}