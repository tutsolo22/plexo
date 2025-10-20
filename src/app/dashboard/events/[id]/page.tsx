'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EventQuoteManager from '@/components/events/EventQuoteManager';
import {
  Calendar,
  User,
  MapPin,
  Clock,
  FileText,
  Edit,
  Trash2,
  ArrowLeft,
  DollarSign,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'RESERVED' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  isFullVenue: boolean;
  colorCode?: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  room?: {
    id: string;
    name: string;
    capacity: number;
  };
  venue?: {
    id: string;
    name: string;
    address: string;
  };
  quote?: {
    id: string;
    quoteNumber: string;
    status: string;
    total: number;
    validUntil: string;
  };
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [params.id]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setEvent(data.data);
      } else {
        setError(data.error || 'Evento no encontrado');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/events/${params.id}/edit`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/events/${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard/events');
      } else {
        alert(data.error || 'Error al eliminar el evento');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      RESERVED: { color: 'bg-yellow-100 text-yellow-800', label: 'Reservado' },
      QUOTED: { color: 'bg-blue-100 text-blue-800', label: 'Cotizado' },
      CONFIRMED: { color: 'bg-green-100 text-green-800', label: 'Confirmado' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
    };

    const variant = variants[status as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver
          </Button>
        </div>

        <Card>
          <CardContent className='flex items-center justify-center p-8'>
            <div className='text-center'>
              <Loader2 className='mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground' />
              <p className='text-muted-foreground'>Cargando evento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver
          </Button>
        </div>

        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error || 'Evento no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver
          </Button>

          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{event.title}</h1>
            <div className='mt-2 flex items-center gap-2'>
              {getStatusBadge(event.status)}
              <span className='text-muted-foreground'>•</span>
              <span className='text-muted-foreground'>
                {new Date(event.startDate).toLocaleDateString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button onClick={handleEdit}>
            <Edit className='mr-2 h-4 w-4' />
            Editar
          </Button>
          <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className='mr-2 h-4 w-4' />
                Eliminar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Información principal */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Detalles del evento */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Detalles del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                    <Clock className='h-4 w-4' />
                    Fecha y Hora de Inicio
                  </div>
                  <p className='text-lg'>{new Date(event.startDate).toLocaleString('es-CL')}</p>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                    <Clock className='h-4 w-4' />
                    Fecha y Hora de Fin
                  </div>
                  <p className='text-lg'>{new Date(event.endDate).toLocaleString('es-CL')}</p>
                </div>
              </div>

              {/* Duración del evento */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                  <Clock className='h-4 w-4' />
                  Duración
                </div>
                <p>
                  {Math.round(
                    (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) /
                      (1000 * 60 * 60)
                  )}{' '}
                  horas
                </p>
              </div>

              {/* Notas */}
              {event.notes && (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                    <FileText className='h-4 w-4' />
                    Notas
                  </div>
                  <p className='rounded-md bg-muted p-3 text-sm'>{event.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.room || event.venue ? (
                <div className='space-y-4'>
                  {event.room && (
                    <div>
                      <h4 className='font-medium'>Sala</h4>
                      <p className='text-muted-foreground'>
                        {event.room.name} (Capacidad: {event.room.capacity} personas)
                      </p>
                    </div>
                  )}

                  {event.venue && (
                    <div>
                      <h4 className='font-medium'>Venue</h4>
                      <p className='text-muted-foreground'>{event.venue.name}</p>
                      <p className='text-sm text-muted-foreground'>{event.venue.address}</p>
                    </div>
                  )}

                  {event.isFullVenue && <Badge variant='outline'>Reserva de venue completo</Badge>}
                </div>
              ) : (
                <p className='text-muted-foreground'>No se ha especificado una ubicación</p>
              )}
            </CardContent>
          </Card>

          {/* Cotizaciones del evento */}
          <EventQuoteManager
            eventId={event.id}
            event={{
              id: event.id,
              title: event.title,
              startDate: event.startDate,
              endDate: event.endDate,
              client: {
                id: event.client.id,
                firstName: event.client.firstName,
                lastName: event.client.lastName,
                email: event.client.email,
                ...(event.client.phone && { phone: event.client.phone }),
              },
              ...(event.venue && { venue: { name: event.venue.name } }),
              ...(event.room && { room: { name: event.room.name } }),
            }}
            onQuoteCreated={quote => {
              // Opcional: actualizar la vista del evento si es necesario
              console.log('Nueva cotización creada:', quote);
            }}
          />
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h4 className='text-lg font-medium'>
                  {event.client.firstName} {event.client.lastName}
                </h4>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <a
                    href={`mailto:${event.client.email}`}
                    className='text-blue-600 hover:underline'
                  >
                    {event.client.email}
                  </a>
                </div>

                {event.client.phone && (
                  <div className='flex items-center gap-2 text-sm'>
                    <Phone className='h-4 w-4 text-muted-foreground' />
                    <a href={`tel:${event.client.phone}`} className='text-blue-600 hover:underline'>
                      {event.client.phone}
                    </a>
                  </div>
                )}
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() => router.push(`/dashboard/clients/${event.client.id}`)}
                className='w-full'
              >
                Ver Perfil del Cliente
              </Button>
            </CardContent>
          </Card>

          {/* Cotización asociada */}
          {event.quote && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <DollarSign className='h-5 w-5' />
                  Cotización
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='font-medium'>#{event.quote.quoteNumber}</p>
                  <Badge variant='outline' className='mt-1'>
                    {event.quote.status}
                  </Badge>
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-muted-foreground'>Total:</span>
                    <span className='font-medium'>
                      ${event.quote.total.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='text-sm text-muted-foreground'>Válida hasta:</span>
                    <span className='text-sm'>
                      {new Date(event.quote.validUntil).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => event.quote && router.push(`/dashboard/quotes/${event.quote.id}`)}
                  className='w-full'
                >
                  Ver Cotización
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Estado del evento */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5' />
                Estado del Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span>Estado actual:</span>
                  {getStatusBadge(event.status)}
                </div>

                {event.status === 'CONFIRMED' && new Date(event.startDate) > new Date() && (
                  <Alert>
                    <CheckCircle className='h-4 w-4' />
                    <AlertDescription>Evento confirmado y programado</AlertDescription>
                  </Alert>
                )}

                {event.status === 'CANCELLED' && (
                  <Alert>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>Este evento ha sido cancelado</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
