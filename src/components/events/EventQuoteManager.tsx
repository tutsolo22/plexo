'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useEventQuotes from '@/hooks/useEventQuotes';
import { Plus, FileText, Send, DollarSign, Calendar, User, MapPin, Trash2, Edit, AlertTriangle, Sync } from 'lucide-react';

interface EventQuoteManagerProps {
  eventId: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    venue?: { name: string };
    room?: { name: string };
  };
  onQuoteCreated?: (quote: any) => void;
}

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  description?: string;
  status: string;
  total: number;
  validUntil: string;
  createdAt: string;
  template?: {
    id: string;
    name: string;
    type: string;
  };
  packages: any[];
  adjustments: any[];
  _count: {
    packages: number;
    adjustments: number;
  };
}

interface QuoteStats {
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  averageValue: number;
}

const EventQuoteManager: React.FC<EventQuoteManagerProps> = ({ 
  eventId, 
  event, 
  onQuoteCreated 
}) => {
  const {
    quotes,
    stats,
    syncStatus,
    loading,
    error,
    createQuote,
    createQuickQuote,
    syncStatuses,
    needsSync,
    getSyncRecommendations,
    refresh
  } = useEventQuotes(eventId, { autoRefresh: true, refreshInterval: 30000 });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Formulario para nueva cotización
  const [formData, setFormData] = useState({
    title: `Cotización para ${event.title}`,
    description: '',
    templateId: '',
    validUntil: '',
    packages: [{
      name: 'Paquete Básico',
      description: '',
      price: 0,
      quantity: 1,
      items: []
    }],
    adjustments: [],
    autoSend: false,
    emailTemplate: 'professional' as 'basic' | 'professional' | 'custom'
  });

  useEffect(() => {
    fetchTemplates();
    
    // Establecer fecha de validez por defecto (30 días)
    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      validUntil: defaultValidUntil.toISOString().split('T')[0]
    }));
  }, [eventId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates?type=quote&limit=50');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateQuote = async () => {
    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }

    if (formData.packages.length === 0 || formData.packages[0].price <= 0) {
      alert('Debe incluir al menos un paquete con precio');
      return;
    }

    setCreating(true);
    try {
      const quote = await createQuote({
        ...formData,
        validUntil: new Date(formData.validUntil).toISOString()
      });

      setShowCreateForm(false);
      onQuoteCreated?.(quote);
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        title: `Cotización para ${event.title}`,
        description: '',
        templateId: '',
        packages: [{
          name: 'Paquete Básico',
          description: '',
          price: 0,
          quantity: 1,
          items: []
        }],
        adjustments: [],
        autoSend: false
      }));
      
      alert('Cotización creada exitosamente');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error creando cotización');
    } finally {
      setCreating(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncStatuses({ syncDirection: 'both' });
      alert('Sincronización completada');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error en sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const updatePackage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => 
        i === index ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const addAdjustment = () => {
    setFormData(prev => ({
      ...prev,
      adjustments: [...prev.adjustments, {
        type: 'discount' as 'discount' | 'surcharge',
        description: '',
        amount: 0
      }]
    }));
  };

  const updateAdjustment = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      adjustments: prev.adjustments.map((adj, i) => 
        i === index ? { ...adj, [field]: value } : adj
      )
    }));
  };

  const removeAdjustment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      adjustments: prev.adjustments.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'VIEWED': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'SENT': return 'Enviada';
      case 'VIEWED': return 'Vista';
      case 'ACCEPTED': return 'Aceptada';
      case 'REJECTED': return 'Rechazada';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  const calculateTotal = () => {
    const packagesTotal = formData.packages.reduce((sum, pkg) => sum + (pkg.price * pkg.quantity), 0);
    const adjustmentsTotal = formData.adjustments.reduce((sum, adj) => 
      sum + (adj.type === 'discount' ? -adj.amount : adj.amount), 0
    );
    return Math.max(0, packagesTotal + adjustmentsTotal);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cotizaciones del Evento</h3>
          <p className="text-sm text-gray-600">
            {event.title} • {new Date(event.startDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          {needsSync() && (
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Sync className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          )}
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </div>
      </div>

      {/* Alertas de sincronización */}
      {needsSync() && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="font-medium mb-1">Se requiere sincronización:</div>
            <ul className="text-sm space-y-1">
              {getSyncRecommendations().map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Error state */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-semibold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-lg font-semibold">${stats.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Send className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Enviadas</p>
                  <p className="text-lg font-semibold">{stats.byStatus.SENT || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Aceptadas</p>
                  <p className="text-lg font-semibold">{stats.byStatus.ACCEPTED || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Cotización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título de la Cotización</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Cotización para Boda Juan y María"
                />
              </div>

              <div>
                <Label htmlFor="validUntil">Válida Hasta</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional de la cotización"
                rows={3}
              />
            </div>

            {templates.length > 0 && (
              <div>
                <Label htmlFor="template">Plantilla (Opcional)</Label>
                <select
                  id="template"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.templateId}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                >
                  <option value="">Sin plantilla</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paquete principal */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">Paquete Principal</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nombre del Paquete</Label>
                  <Input
                    value={formData.packages[0]?.name || ''}
                    onChange={(e) => updatePackage(0, 'name', e.target.value)}
                    placeholder="Ej: Paquete Completo"
                  />
                </div>
                <div>
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.packages[0]?.price || 0}
                    onChange={(e) => updatePackage(0, 'price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.packages[0]?.quantity || 1}
                    onChange={(e) => updatePackage(0, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label>Descripción del Paquete</Label>
                <Textarea
                  value={formData.packages[0]?.description || ''}
                  onChange={(e) => updatePackage(0, 'description', e.target.value)}
                  placeholder="Describe lo que incluye este paquete"
                  rows={2}
                />
              </div>
            </div>

            {/* Ajustes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Ajustes (Descuentos/Recargos)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAdjustment}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              {formData.adjustments.map((adjustment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={adjustment.type}
                      onChange={(e) => updateAdjustment(index, 'type', e.target.value)}
                    >
                      <option value="discount">Descuento</option>
                      <option value="surcharge">Recargo</option>
                    </select>
                    <Input
                      placeholder="Descripción"
                      value={adjustment.description}
                      onChange={(e) => updateAdjustment(index, 'description', e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Monto"
                      value={adjustment.amount}
                      onChange={(e) => updateAdjustment(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAdjustment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total calculado */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total de la Cotización:</span>
                <span className="text-lg font-bold text-green-600">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Opciones de envío */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.autoSend}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoSend: e.target.checked }))}
                  className="mr-2"
                />
                Enviar automáticamente por email
              </label>
              
              {formData.autoSend && (
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.emailTemplate}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailTemplate: e.target.value as any }))}
                >
                  <option value="basic">Plantilla Básica</option>
                  <option value="professional">Plantilla Profesional</option>
                  <option value="custom">Plantilla Personalizada</option>
                </select>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateQuote}
                disabled={creating || !formData.title.trim()}
              >
                {creating ? 'Creando...' : 'Crear Cotización'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de cotizaciones */}
      <div className="space-y-4">
        {quotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cotizaciones
              </h3>
              <p className="text-gray-600 mb-4">
                Este evento aún no tiene cotizaciones asociadas.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Cotización
              </Button>
            </CardContent>
          </Card>
        ) : (
          quotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {quote.title}
                      </h4>
                      <Badge className={getStatusColor(quote.status)}>
                        {getStatusText(quote.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Número:</span> {quote.quoteNumber}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> ${quote.total.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Válida hasta:</span>{' '}
                        {new Date(quote.validUntil).toLocaleDateString()}
                      </div>
                    </div>

                    {quote.description && (
                      <p className="text-sm text-gray-600 mt-2">{quote.description}</p>
                    )}

                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                      <span>{quote._count.packages} paquete(s)</span>
                      <span>{quote._count.adjustments} ajuste(s)</span>
                      <span>Creada: {new Date(quote.createdAt).toLocaleDateString()}</span>
                      {quote.template && (
                        <span>Plantilla: {quote.template.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/dashboard/quotes/${quote.id}`, '_blank')}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EventQuoteManager;