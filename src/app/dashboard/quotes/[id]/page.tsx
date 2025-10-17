'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QuoteForm from '@/components/quotes/QuoteForm';
import { Edit, Send, Copy, Download, ArrowLeft, MoreVertical, User, Calendar, MapPin, Phone, Mail, DollarSign } from 'lucide-react';

interface QuoteDetails {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: string;
  total: number;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  event?: {
    id: string;
    name: string;
    date: string;
    location?: string;
  };
  packages: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    items: Array<{
      id: string;
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
    }>;
  }>;
  adjustments: Array<{
    id: string;
    type: 'discount' | 'surcharge';
    description: string;
    amount: number;
    percentage?: number;
  }>;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const quoteId = params.id as string;

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
      } else {
        console.error('Error loading quote');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'send':
          const sendResponse = await fetch(`/api/quotes/${quoteId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template: 'professional' })
          });
          if (sendResponse.ok) {
            alert('Cotización enviada exitosamente');
            fetchQuote(); // Actualizar estado
          }
          break;
        
        case 'duplicate':
          const duplicateResponse = await fetch(`/api/quotes/${quoteId}/duplicate`, {
            method: 'POST'
          });
          if (duplicateResponse.ok) {
            const newQuote = await duplicateResponse.json();
            router.push(`/dashboard/quotes/${newQuote.id}`);
          }
          break;
        
        case 'download':
          window.open(`/api/quotes/${quoteId}/pdf`, '_blank');
          break;
        
        case 'delete':
          if (confirm('¿Estás seguro de que quieres eliminar esta cotización?')) {
            const deleteResponse = await fetch(`/api/quotes/${quoteId}`, {
              method: 'DELETE'
            });
            if (deleteResponse.ok) {
              router.push('/dashboard/quotes');
            }
          }
          break;
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      alert(`Error al ${action === 'send' ? 'enviar' : action === 'duplicate' ? 'duplicar' : action === 'download' ? 'descargar' : 'eliminar'} la cotización`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviada';
      case 'viewed': return 'Vista';
      case 'accepted': return 'Aceptada';
      case 'rejected': return 'Rechazada';
      case 'expired': return 'Expirada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cotización no encontrada</h2>
            <Button onClick={() => router.push('/dashboard/quotes')}>
              Volver a Cotizaciones
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <QuoteForm 
            quote={quote}
            onSuccess={() => {
              setIsEditing(false);
              fetchQuote();
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  const subtotal = quote.packages.reduce((sum, pkg) => sum + (pkg.price * pkg.quantity), 0);
  const adjustmentTotal = quote.adjustments.reduce((sum, adj) => {
    return sum + (adj.type === 'discount' ? -adj.amount : adj.amount);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Cotización {quote.number}
                </h1>
                <p className="text-gray-600">{quote.title}</p>
              </div>
              <Badge className={getStatusColor(quote.status)}>
                {getStatusText(quote.status)}
              </Badge>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={actionLoading !== null}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('send')}
                disabled={actionLoading !== null}
              >
                <Send className="h-4 w-4 mr-2" />
                {actionLoading === 'send' ? 'Enviando...' : 'Enviar'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('duplicate')}
                disabled={actionLoading !== null}
              >
                <Copy className="h-4 w-4 mr-2" />
                {actionLoading === 'duplicate' ? 'Duplicando...' : 'Duplicar'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('download')}
                disabled={actionLoading !== null}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Cotización</CardTitle>
              </CardHeader>
              <CardContent>
                {quote.description && (
                  <p className="text-gray-700 mb-4">{quote.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Fecha de Creación:</span>
                    <p>{new Date(quote.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Válida hasta:</span>
                    <p>{new Date(quote.validUntil).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Última Actualización:</span>
                    <p>{new Date(quote.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Total:</span>
                    <p className="text-lg font-bold text-green-600">
                      ${quote.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Packages */}
            <Card>
              <CardHeader>
                <CardTitle>Paquetes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quote.packages.map((pkg) => (
                    <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                          {pkg.description && (
                            <p className="text-sm text-gray-600">{pkg.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${pkg.price.toLocaleString()} x {pkg.quantity}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: ${(pkg.price * pkg.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {pkg.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Items incluidos:</h5>
                          <div className="space-y-1">
                            {pkg.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>${item.unitPrice.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  
                  {quote.adjustments.map((adj) => (
                    <div key={adj.id} className="flex justify-between text-sm">
                      <span className={adj.type === 'discount' ? 'text-green-600' : 'text-red-600'}>
                        {adj.description}:
                      </span>
                      <span className={adj.type === 'discount' ? 'text-green-600' : 'text-red-600'}>
                        {adj.type === 'discount' ? '-' : '+'}${adj.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${quote.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{quote.client.name}</h4>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {quote.client.email}
                  </div>
                  
                  {quote.client.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {quote.client.phone}
                    </div>
                  )}
                  
                  {quote.client.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                      {quote.client.address}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Info */}
            {quote.event && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{quote.event.name}</h4>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(quote.event.date).toLocaleDateString()}
                    </div>
                    
                    {quote.event.location && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                        {quote.event.location}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAction('send')}
                    disabled={actionLoading !== null}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Reenviar por Email
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAction('duplicate')}
                    disabled={actionLoading !== null}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Crear Copia
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAction('download')}
                    disabled={actionLoading !== null}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAction('delete')}
                    disabled={actionLoading !== null}
                  >
                    <MoreVertical className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}