import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/events/[id]/quotes - Obtener cotizaciones de un evento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true }
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Obtener todas las cotizaciones del evento
    const quotes = await prisma.quote.findMany({
      where: { eventId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        packages: true,
        template: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        _count: {
          select: {
            packages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular estadísticas
    const stats = {
      total: quotes.length,
      byStatus: quotes.reduce((acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalValue: quotes.reduce((sum, quote) => sum + Number(quote.total), 0),
      averageValue: quotes.length > 0 ? 
        quotes.reduce((sum, quote) => sum + Number(quote.total), 0) / quotes.length : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        event,
        quotes,
        stats
      }
    });

  } catch (error) {
    console.error('Error obteniendo cotizaciones del evento:', error);
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