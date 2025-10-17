'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  MoreHorizontal,
  ArrowLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  type: 'GENERAL' | 'COLABORADOR' | 'EXTERNO';
  isActive: boolean;
  eventCounter: number;
  discountPercent?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  priceList?: {
    id: string;
    name: string;
  };
  _count?: {
    events: number;
    quotes: number;
    clientCredits: number;
    loyaltyPoints: number;
  };
}

interface Event {
  id: string;
  name: string;
  date: string;
  endDate: string;
  status: 'RESERVED' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED';
  totalAmount?: number;
  venue?: {
    id: string;
    name: string;
  };
  room?: {
    id: string;
    name: string;
    venue: {
      id: string;
      name: string;
    };
  };
  quote?: {
    id: string;
    subtotal: number;
    totalAmount: number;
    status: string;
  };
  notes?: string;
}

interface Quote {
  id: string;
  name: string;
  quoteNumber: string;
  totalAmount: number;
  subtotal: number;
  status:
    | 'DRAFT'
    | 'PENDING_MANAGER'
    | 'REJECTED_BY_MANAGER'
    | 'APPROVED_BY_MANAGER'
    | 'SENT_TO_CLIENT'
    | 'CLIENT_REQUESTED_CHANGES'
    | 'ACCEPTED_BY_CLIENT'
    | 'EXPIRED'
    | 'CANCELLED';
  validUntil?: string;
  event?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  itemsCount: number;
  createdAt: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params['id'] as string;

  const [client, setClient] = useState<Client | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Fetch client details
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (!clientResponse.ok) {
        throw new Error('Error al cargar los datos del cliente');
      }
      const clientResult = await clientResponse.json();
      setClient(clientResult.data);

      // Fetch client events
      const eventsResponse = await fetch(`/api/clients/${clientId}/events`);
      if (eventsResponse.ok) {
        const eventsResult = await eventsResponse.json();
        setEvents(eventsResult.data || []);
      }

      // Fetch client quotes
      const quotesResponse = await fetch(`/api/clients/${clientId}/quotes`);
      if (quotesResponse.ok) {
        const quotesResult = await quotesResponse.json();
        setQuotes(quotesResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Event statuses
      RESERVED: { label: 'Reservado', variant: 'secondary' as const },
      QUOTED: { label: 'Cotizado', variant: 'default' as const },
      CONFIRMED: { label: 'Confirmado', variant: 'default' as const },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' as const },

      // Quote statuses
      DRAFT: { label: 'Borrador', variant: 'secondary' as const },
      PENDING_MANAGER: { label: 'Pendiente Manager', variant: 'secondary' as const },
      REJECTED_BY_MANAGER: { label: 'Rechazado', variant: 'destructive' as const },
      APPROVED_BY_MANAGER: { label: 'Aprobado', variant: 'default' as const },
      SENT_TO_CLIENT: { label: 'Enviado', variant: 'default' as const },
      CLIENT_REQUESTED_CHANGES: { label: 'Cambios Solicitados', variant: 'secondary' as const },
      ACCEPTED_BY_CLIENT: { label: 'Aceptado', variant: 'default' as const },
      EXPIRED: { label: 'Expirado', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? (
      <Badge variant={config.variant}>{config.label}</Badge>
    ) : (
      <Badge>{status}</Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='mb-6 flex items-center space-x-4'>
          <div className='h-8 w-8 animate-pulse rounded bg-gray-200' />
          <div className='h-8 w-64 animate-pulse rounded bg-gray-200' />
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='h-32 animate-pulse rounded-lg bg-gray-200' />
          ))}
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className='container mx-auto p-6'>
        <div className='py-12 text-center'>
          <h2 className='mb-4 text-2xl font-bold text-gray-900'>Error</h2>
          <p className='mb-4 text-gray-600'>{error || 'Cliente no encontrado'}</p>
          <Button onClick={() => router.push('/dashboard/clients')}>Volver a Clientes</Button>
        </div>
      </div>
    );
  }

  const totalRevenue = events.reduce((sum, event) => sum + (event.totalAmount || 0), 0);
  const totalQuoteValue = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);
  const activeQuotes = quotes.filter(
    quote => quote.status === 'SENT_TO_CLIENT' || quote.status === 'APPROVED_BY_MANAGER'
  ).length;
  const confirmedEvents = events.filter(event => event.status === 'CONFIRMED').length;

  return (
    <div className='container mx-auto p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button variant='ghost' size='sm' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver
          </Button>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>{client.name}</h1>
            <div className='mt-1 flex items-center space-x-2'>
              <Badge variant={client.type === 'EXTERNO' ? 'default' : 'secondary'}>
                {client.type === 'GENERAL'
                  ? 'General'
                  : client.type === 'COLABORADOR'
                    ? 'Colaborador'
                    : 'Externo'}
              </Badge>
              <Badge variant={client.isActive ? 'default' : 'destructive'}>
                {client.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <Button onClick={() => router.push(`/dashboard/clients/${clientId}/edit`)}>
            <Edit className='mr-2 h-4 w-4' />
            Editar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/events/new?clientId=${clientId}`)}
              >
                Crear Evento
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/quotes/new?clientId=${clientId}`)}
              >
                Crear Cotización
              </DropdownMenuItem>
              <DropdownMenuItem>Enviar Email</DropdownMenuItem>
              <DropdownMenuItem className='text-red-600'>
                {client.isActive ? 'Desactivar' : 'Activar'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Eventos Completados</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{confirmedEvents}</div>
            <p className='text-xs text-muted-foreground'>de {events.length} eventos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Ingresos Totales</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(totalRevenue)}</div>
            <p className='text-xs text-muted-foreground'>de eventos completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Cotizaciones Activas</CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeQuotes}</div>
            <p className='text-xs text-muted-foreground'>por {formatCurrency(totalQuoteValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Cliente desde</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-lg font-bold'>{formatDate(client.createdAt)}</div>
            <p className='text-xs text-muted-foreground'>
              hace{' '}
              {Math.floor(
                (new Date().getTime() - new Date(client.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Information */}
      <div className='mb-6 grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <Mail className='h-5 w-5 text-gray-400' />
              <div>
                <p className='text-sm font-medium'>Email</p>
                <p className='text-sm text-gray-600'>{client.email}</p>
              </div>
            </div>

            {client.phone && (
              <div className='flex items-center space-x-3'>
                <Phone className='h-5 w-5 text-gray-400' />
                <div>
                  <p className='text-sm font-medium'>Teléfono</p>
                  <p className='text-sm text-gray-600'>{client.phone}</p>
                </div>
              </div>
            )}

            {client.notes && (
              <div className='flex items-center space-x-3'>
                <FileText className='h-5 w-5 text-gray-400' />
                <div>
                  <p className='text-sm font-medium'>Notas</p>
                  <p className='text-sm text-gray-600'>{client.notes}</p>
                </div>
              </div>
            )}

            {client.address && (
              <div className='flex items-center space-x-3'>
                <MapPin className='h-5 w-5 text-gray-400' />
                <div>
                  <p className='text-sm font-medium'>Dirección</p>
                  <p className='text-sm text-gray-600'>{client.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Eventos totales</span>
              <span className='text-sm font-bold'>{events.length}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Cotizaciones enviadas</span>
              <span className='text-sm font-bold'>{quotes.length}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Valor promedio por evento</span>
              <span className='text-sm font-bold'>
                {confirmedEvents > 0 ? formatCurrency(totalRevenue / confirmedEvents) : 'N/A'}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Última actualización</span>
              <span className='text-sm font-bold'>{formatDate(client.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className='mb-6'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Eventos Recientes</CardTitle>
              <CardDescription>Últimos eventos del cliente</CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push(`/dashboard/events/new?clientId=${clientId}`)}
            >
              Nuevo Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className='text-right'>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 5).map(event => (
                  <TableRow key={event.id}>
                    <TableCell className='font-medium'>{event.name}</TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell className='text-right'>
                      {event.totalAmount ? formatCurrency(event.totalAmount) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='py-8 text-center'>
              <p className='mb-4 text-gray-500'>No hay eventos registrados</p>
              <Button
                variant='outline'
                onClick={() => router.push(`/dashboard/events/new?clientId=${clientId}`)}
              >
                Crear Primer Evento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Cotizaciones Recientes</CardTitle>
              <CardDescription>Últimas cotizaciones enviadas</CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push(`/dashboard/quotes/new?clientId=${clientId}`)}
            >
              Nueva Cotización
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className='text-right'>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.slice(0, 5).map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell className='font-medium'>{quote.name}</TableCell>
                    <TableCell>{formatDate(quote.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className='text-right'>
                      {formatCurrency(quote.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='py-8 text-center'>
              <p className='mb-4 text-gray-500'>No hay cotizaciones registradas</p>
              <Button
                variant='outline'
                onClick={() => router.push(`/dashboard/quotes/new?clientId=${clientId}`)}
              >
                Crear Primera Cotización
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
