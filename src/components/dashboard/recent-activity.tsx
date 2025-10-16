import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Decimal } from '@prisma/client/runtime/library';

interface RecentEvent {
  id: string;
  title: string;
  startDate: Date;
  client: { name: string };
  venue: { name: string } | null;
}

interface RecentQuote {
  id: string;
  number: string;
  total: Decimal | number;
  client: { name: string };
  status: string;
}

interface RecentActivityProps {
  events: RecentEvent[];
  quotes: RecentQuote[];
  className?: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  SENT_TO_CLIENT: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

const statusLabels = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente',
  APPROVED: 'Aprobado',
  SENT_TO_CLIENT: 'Enviado',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  EXPIRED: 'Expirado',
};

export function RecentActivity({ events, quotes, className }: RecentActivityProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {/* Eventos Recientes */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <div>
            <CardTitle className='text-base font-semibold'>Eventos Recientes</CardTitle>
            <CardDescription>Últimos eventos creados o modificados</CardDescription>
          </div>
          <Calendar className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent className='space-y-3'>
          {events.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No hay eventos recientes</p>
          ) : (
            events.map(event => (
              <div
                key={event.id}
                className='flex items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50'
              >
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium leading-none'>{event.title}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>{event.client.name}</p>
                  <div className='mt-2 flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      {format(new Date(event.startDate), 'dd MMM yyyy', { locale: es })}
                    </Badge>
                    {event.venue && (
                      <Badge variant='secondary' className='text-xs'>
                        {event.venue.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Cotizaciones Recientes */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <div>
            <CardTitle className='text-base font-semibold'>Cotizaciones Recientes</CardTitle>
            <CardDescription>Últimas cotizaciones generadas</CardDescription>
          </div>
          <FileText className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent className='space-y-3'>
          {quotes.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No hay cotizaciones recientes</p>
          ) : (
            quotes.map(quote => (
              <div
                key={quote.id}
                className='flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50'
              >
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium leading-none'>{quote.number}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>{quote.client.name}</p>
                  <div className='mt-2 flex items-center gap-2'>
                    <Badge
                      className={`text-xs ${statusColors[quote.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {statusLabels[quote.status as keyof typeof statusLabels] || quote.status}
                    </Badge>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold'>
                    Q
                    {typeof quote.total === 'number'
                      ? quote.total.toFixed(2)
                      : quote.total.toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
