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
        quotes: {
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
            // Solo marcar como aceptadas las cotizaciones que están en SENT o VIEWED
            const quotesToAccept = event.quotes.filter(q => 
              ['SENT', 'VIEWED'].includes(q.status)
            );
            if (quotesToAccept.length > 0) {
              await prisma.quote.updateMany({
                where: {
                  id: { in: quotesToAccept.map(q => q.id) },
                },
                data: { status: 'ACCEPTED' }
              });
              updates.quotesUpdated = quotesToAccept.length;
              updates.changes.push(`${quotesToAccept.length} cotizaciones marcadas como aceptadas`);
            }
            break;
        }

        if (newQuoteStatus) {
          const quotesToUpdate = event.quotes.filter(q => q.status !== newQuoteStatus);
          if (quotesToUpdate.length > 0) {
            await prisma.quote.updateMany({
              where: {
                eventId: eventId,
                id: { in: quotesToUpdate.map(q => q.id) }
              },
              data: { status: newQuoteStatus }
            });
            updates.quotesUpdated = quotesToUpdate.length;
            updates.changes.push(`${quotesToUpdate.length} cotizaciones actualizadas a ${newQuoteStatus}`);
          }
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
            // Si todas las cotizaciones están rechazadas, mantener como reservado
            const allRejected = event.quotes.every(q => q.status === 'REJECTED');
            if (allRejected && event.status !== 'RESERVED') {
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
      // Verificar si hay cotizaciones aceptadas y el evento no está confirmado
      const acceptedQuotes = event.quotes.filter(q => q.status === 'ACCEPTED');
      if (acceptedQuotes.length > 0 && event.status !== 'CONFIRMED') {
        await prisma.event.update({
          where: { id: eventId },
          data: { status: 'CONFIRMED' }
        });
        updates.eventUpdated = true;
        updates.changes.push('Evento confirmado automáticamente por cotización aceptada');
      }

      // Verificar si hay cotizaciones enviadas y el evento no está cotizado
      const sentQuotes = event.quotes.filter(q => ['SENT', 'VIEWED'].includes(q.status));
      if (sentQuotes.length > 0 && event.status === 'RESERVED') {
        await prisma.event.update({
          where: { id: eventId },
          data: { status: 'QUOTED' }
        });
        updates.eventUpdated = true;
        updates.changes.push('Evento marcado como cotizado por cotizaciones enviadas');
      }
    }

    // Obtener el estado actualizado
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        quotes: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            validUntil: true
          },
          orderBy: { createdAt: 'desc' }
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
        quotes: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            validUntil: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
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
      quotesCount: event.quotes.length,
      quotesByStatus: event.quotes.reduce((acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recommendations: [] as string[],
      needsSync: false
    };

    // Generar recomendaciones de sincronización
    const acceptedQuotes = event.quotes.filter(q => q.status === 'ACCEPTED');
    const sentQuotes = event.quotes.filter(q => ['SENT', 'VIEWED'].includes(q.status));
    const rejectedQuotes = event.quotes.filter(q => q.status === 'REJECTED');

    if (acceptedQuotes.length > 0 && event.status !== 'CONFIRMED') {
      syncStatus.recommendations.push('Considerar confirmar el evento (hay cotizaciones aceptadas)');
      syncStatus.needsSync = true;
    }

    if (sentQuotes.length > 0 && event.status === 'RESERVED') {
      syncStatus.recommendations.push('Marcar evento como cotizado (hay cotizaciones enviadas)');
      syncStatus.needsSync = true;
    }

    if (event.quotes.length === rejectedQuotes.length && rejectedQuotes.length > 0 && event.status !== 'RESERVED') {
      syncStatus.recommendations.push('Todas las cotizaciones están rechazadas, considerar volver a reservado');
      syncStatus.needsSync = true;
    }

    if (event.status === 'CANCELLED') {
      const nonExpiredQuotes = event.quotes.filter(q => q.status !== 'EXPIRED');
      if (nonExpiredQuotes.length > 0) {
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