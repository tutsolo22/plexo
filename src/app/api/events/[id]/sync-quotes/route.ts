import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SyncEventQuoteSchema = z.object({
  eventStatus: z.enum(['RESERVED', 'QUOTED', 'CONFIRMED', 'CANCELLED']).optional(),
  quoteStatus: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  syncDirection: z.enum(['event-to-quotes', 'quote-to-event', 'both']).default('both')
});

/**
 * POST /api/events/[id]/sync-quotes - Sincronizar estados entre evento y cotizaciones
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    const validatedData = SyncEventQuoteSchema.parse(body);

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        quote: {
          select: {
            id: true,
            status: true,
            total: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    const updates = {
      eventUpdated: false,
      quotesUpdated: 0,
      changes: [] as string[]
    };

    // Lógica de sincronización según la dirección
    if (validatedData.syncDirection === 'event-to-quotes' || validatedData.syncDirection === 'both') {
      // Sincronizar desde evento hacia cotizaciones
      if (validatedData.eventStatus) {
        let newQuoteStatus: string | null = null;

        switch (validatedData.eventStatus) {
          case 'CANCELLED':
            newQuoteStatus = 'EXPIRED';
            break;
          case 'CONFIRMED':
            // Solo marcar como aceptada la cotización que está en SENT_TO_CLIENT
            if (event.quote && ['SENT_TO_CLIENT'].includes(event.quote.status)) {
              await prisma.quote.update({
                where: { id: event.quote.id },
                data: { status: 'ACCEPTED_BY_CLIENT' }
              });
              updates.quotesUpdated = 1;
              updates.changes.push('Cotización marcada como aceptada por el cliente');
            }
            break;
        }

        if (newQuoteStatus && event.quote && event.quote.status !== newQuoteStatus) {
          await prisma.quote.update({
            where: { id: event.quote.id },
            data: { status: newQuoteStatus as any } // TODO: Fix enum types
          });
          updates.quotesUpdated = 1;
          updates.changes.push(`Cotización actualizada a ${newQuoteStatus}`);
        }

        // Actualizar el evento
        await prisma.event.update({
          where: { id: eventId },
          data: { status: validatedData.eventStatus }
        });
        updates.eventUpdated = true;
        updates.changes.push(`Evento actualizado a ${validatedData.eventStatus}`);
      }
    }

    if (validatedData.syncDirection === 'quote-to-event' || validatedData.syncDirection === 'both') {
      // Sincronizar desde cotización hacia evento
      if (validatedData.quoteStatus) {
        let newEventStatus: string | null = null;

        switch (validatedData.quoteStatus) {
          case 'ACCEPTED':
            // Si una cotización es aceptada y el evento no está confirmado, confirmarlo
            if (event.status !== 'CONFIRMED') {
              newEventStatus = 'CONFIRMED';
            }
            break;
          case 'REJECTED':
            // Si la cotización está rechazada, mantener como reservado
            if (event.quote && event.quote.status === 'REJECTED_BY_MANAGER' && event.status !== 'RESERVED') {
              newEventStatus = 'RESERVED';
            }
            break;
          case 'SENT':
            // Si se envía una cotización y el evento está solo reservado, marcarlo como cotizado
            if (event.status === 'RESERVED') {
              newEventStatus = 'QUOTED';
            }
            break;
        }

        if (newEventStatus) {
          await prisma.event.update({
            where: { id: eventId },
            data: { status: newEventStatus as any }
          });
          updates.eventUpdated = true;
          updates.changes.push(`Evento actualizado a ${newEventStatus}`);
        }
      }
    }

    // Lógica automática de sincronización inteligente
    if (validatedData.syncDirection === 'both') {
      // Verificar si la cotización está aceptada y el evento no está confirmado
      if (event.quote && event.quote.status === 'ACCEPTED_BY_CLIENT' && event.status !== 'CONFIRMED') {
        await prisma.event.update({
          where: { id: eventId },
          data: { status: 'CONFIRMED' }
        });
        updates.eventUpdated = true;
        updates.changes.push('Evento confirmado automáticamente por cotización aceptada');
      }

      // Verificar si la cotización está enviada y el evento no está cotizado
      if (event.quote && event.quote.status === 'SENT_TO_CLIENT' && event.status === 'RESERVED') {
        await prisma.event.update({
          where: { id: eventId },
          data: { status: 'QUOTED' }
        });
        updates.eventUpdated = true;
        updates.changes.push('Evento marcado como cotizado por cotización enviada');
      }
    }

    // Obtener el estado actualizado
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            validUntil: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        event: updatedEvent,
        updates
      },
      message: updates.changes.length > 0 ? 
        `Sincronización completada: ${updates.changes.join(', ')}` :
        'No se requirieron cambios'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Error sincronizando evento y cotizaciones:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/[id]/sync-quotes - Obtener estado de sincronización
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            validUntil: true,
            createdAt: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Analizar el estado de sincronización
    const syncStatus = {
      eventStatus: event.status,
      quotesCount: event.quote ? 1 : 0,
      quotesByStatus: event.quote ? { [event.quote.status]: 1 } : {},
      recommendations: [] as string[],
      needsSync: false
    };

    // Generar recomendaciones de sincronización
    const acceptedQuote = event.quote?.status === 'ACCEPTED_BY_CLIENT' ? event.quote : null;
    const sentQuote = event.quote && ['SENT_TO_CLIENT'].includes(event.quote.status) ? event.quote : null;
    const rejectedQuote = event.quote?.status === 'REJECTED_BY_MANAGER' ? event.quote : null;

    if (acceptedQuote && event.status !== 'CONFIRMED') {
      syncStatus.recommendations.push('Considerar confirmar el evento (hay cotizaciones aceptadas)');
      syncStatus.needsSync = true;
    }

    if (sentQuote && event.status === 'RESERVED') {
      syncStatus.recommendations.push('Marcar evento como cotizado (hay cotizaciones enviadas)');
      syncStatus.needsSync = true;
    }

    if (rejectedQuote && event.status !== 'RESERVED') {
      syncStatus.recommendations.push('Todas las cotizaciones están rechazadas, considerar volver a reservado');
      syncStatus.needsSync = true;
    }

    if (event.status === 'CANCELLED') {
      const nonExpiredQuote = event.quote?.status !== 'EXPIRED' ? event.quote : null;
      if (nonExpiredQuote) {
        syncStatus.recommendations.push('Marcar cotizaciones como expiradas (evento cancelado)');
        syncStatus.needsSync = true;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        event,
        syncStatus
      }
    });

  } catch (error) {
    console.error('Error obteniendo estado de sincronización:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}