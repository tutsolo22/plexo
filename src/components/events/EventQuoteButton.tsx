'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, DollarSign, Send, Calendar, User, MapPin, Clock } from 'lucide-react';

interface EventQuoteButtonProps {
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    venue?: { name: string };
    room?: { name: string };
  };
  existingQuotes?: number;
  onQuoteCreated?: (quote: any) => void;
}

const EventQuoteButton: React.FC<EventQuoteButtonProps> = ({
  event,
  existingQuotes = 0,
  onQuoteCreated
}) => {
  const [creating, setCreating] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);

  // Quick quote data
  const [quickQuote, setQuickQuote] = useState({
    price: 0,
    description: '',
    autoSend: false
  });

  const handleQuickCreate = async () => {
    if (!quickQuote.price || quickQuote.price <= 0) {
      alert('Debe ingresar un precio válido');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/events/${event.id}/create-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: quickQuote.description,
          packages: [{
            name: 'Paquete Principal',
            description: quickQuote.description || `Servicios para ${event.title}`,
            price: quickQuote.price,
            quantity: 1,
            items: []
          }],
          adjustments: [],
          autoSend: quickQuote.autoSend,
          emailTemplate: 'professional'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowQuickForm(false);
        setQuickQuote({
          price: 0,
          description: '',
          autoSend: false
        });
        onQuoteCreated?.(data.data);
        alert(data.message);
      } else {
        const error = await response.json();
        alert(error.error || 'Error creando cotización');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creando cotización');
    } finally {
      setCreating(false);
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventStatusText = (status: string) => {
    switch (status) {
      case 'RESERVED': return 'Reservado';
      case 'CONFIRMED': return 'Confirmado';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  if (showQuickForm) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Crear Cotización Rápida</h4>
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            <Calendar className="h-4 w-4" />
            <span>{event.title}</span>
            <span>•</span>
            <User className="h-4 w-4" />
            <span>{event.client.firstName} {event.client.lastName}</span>
            <Badge className={getEventStatusColor(event.status)}>
              {getEventStatusText(event.status)}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Base
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={quickQuote.price}
                onChange={(e) => setQuickQuote(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              value={quickQuote.description}
              onChange={(e) => setQuickQuote(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Breve descripción de los servicios incluidos"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoSend"
              checked={quickQuote.autoSend}
              onChange={(e) => setQuickQuote(prev => ({ ...prev, autoSend: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="autoSend" className="text-sm text-gray-700">
              Enviar automáticamente por email al cliente
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickForm(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleQuickCreate}
            disabled={creating || quickQuote.price <= 0}
          >
            {creating ? 'Creando...' : (quickQuote.autoSend ? 'Crear y Enviar' : 'Crear Cotización')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {existingQuotes > 0 && (
        <div className="flex items-center text-sm text-gray-600">
          <FileText className="h-4 w-4 mr-1" />
          <span>{existingQuotes} cotización{existingQuotes !== 1 ? 'es' : ''}</span>
        </div>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowQuickForm(true)}
        className="flex items-center"
      >
        <Plus className="h-4 w-4 mr-1" />
        {existingQuotes > 0 ? 'Nueva Cotización' : 'Crear Cotización'}
      </Button>
      
      {existingQuotes > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/dashboard/events/${event.id}?tab=quotes`, '_blank')}
          className="flex items-center"
        >
          <FileText className="h-4 w-4 mr-1" />
          Ver Todas
        </Button>
      )}
    </div>
  );
};

export default EventQuoteButton;