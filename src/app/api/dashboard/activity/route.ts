import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API para obtener actividad reciente del sistema
 * GET /api/dashboard/activity?limit=10&type=all
 * 
 * Parámetros de consulta:
 * - limit: número de actividades a retornar (default: 10)
 * - type: 'all', 'events', 'clients', 'quotes' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || 'all'

    const activities: Array<{
      id: string
      type: 'event' | 'client' | 'quote' | 'payment'
      action: string
      title: string
      description: string
      timestamp: Date
      relatedEntity?: {
        id: string
        name: string
        type: string
      }
    }> = []

    // Obtener eventos recientes
    if (type === 'all' || type === 'events') {
      const recentEvents = await prisma.event.findMany({
        take: Math.ceil(limit / (type === 'all' ? 4 : 1)),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } }
        }
      })

      recentEvents.forEach(event => {
        activities.push({
          id: event.id,
          type: 'event',
          action: 'created',
          title: 'Nuevo evento creado',
          description: `Se creó el evento "${event.name}" para ${event.client.name}`,
          timestamp: event.createdAt,
          relatedEntity: {
            id: event.client.id,
            name: event.client.name,
            type: 'client'
          }
        })
      })
    }

    // Obtener clientes recientes
    if (type === 'all' || type === 'clients') {
      const recentClients = await prisma.client.findMany({
        take: Math.ceil(limit / (type === 'all' ? 4 : 1)),
        orderBy: { createdAt: 'desc' }
      })

      recentClients.forEach(client => {
        activities.push({
          id: client.id,
          type: 'client',
          action: 'created',
          title: 'Nuevo cliente registrado',
          description: `Se registró el cliente "${client.name}"`,
          timestamp: client.createdAt
        })
      })
    }

    // Obtener cotizaciones recientes
    if (type === 'all' || type === 'quotes') {
      const recentQuotes = await prisma.quote.findMany({
        take: Math.ceil(limit / (type === 'all' ? 4 : 1)),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } }
        }
      })

      recentQuotes.forEach(quote => {
        activities.push({
          id: quote.id,
          type: 'quote',
          action: getQuoteAction(quote.status),
          title: getQuoteTitle(quote.status),
          description: `Cotización ${quote.number} para ${quote.client.name} - ${formatCurrency(Number(quote.total))}`,
          timestamp: quote.updatedAt,
          relatedEntity: {
            id: quote.client.id,
            name: quote.client.name,
            type: 'client'
          }
        })
      })
    }

    // Obtener pagos recientes si existe la tabla
    if (type === 'all' || type === 'payments') {
      try {
        const recentPayments = await prisma.payment.findMany({
          take: Math.ceil(limit / (type === 'all' ? 4 : 1)),
          orderBy: { createdAt: 'desc' },
          include: {
            event: {
              include: {
                client: { select: { id: true, name: true } }
              }
            }
          }
        })

        recentPayments.forEach(payment => {
          activities.push({
            id: payment.id,
            type: 'payment',
            action: payment.status.toLowerCase(),
            title: getPaymentTitle(payment.status),
            description: `Pago de ${formatCurrency(Number(payment.amount))} para "${payment.event.name}"`,
            timestamp: payment.createdAt,
            relatedEntity: payment.event.client ? {
              id: payment.event.client.id,
              name: payment.event.client.name,
              type: 'client'
            } : undefined
          })
        })
      } catch (error) {
        // La tabla Payment puede no existir aún
        console.log('Tabla Payment no disponible, saltando pagos en actividad reciente')
      }
    }

    // Ordenar por timestamp y limitar
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        activities: sortedActivities,
        summary: {
          total: sortedActivities.length,
          limit,
          type
        }
      }
    })

  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la actividad reciente' 
      },
      { status: 500 }
    )
  }
}

/**
 * Helpers para formatear actividades
 */
function getQuoteAction(status: string): string {
  const actions: { [key: string]: string } = {
    'DRAFT': 'drafted',
    'PENDING': 'sent',
    'APPROVED': 'approved',
    'REJECTED': 'rejected',
    'EXPIRED': 'expired'
  }
  return actions[status] || 'updated'
}

function getQuoteTitle(status: string): string {
  const titles: { [key: string]: string } = {
    'DRAFT': 'Cotización creada',
    'PENDING': 'Cotización enviada',
    'APPROVED': 'Cotización aprobada',
    'REJECTED': 'Cotización rechazada',
    'EXPIRED': 'Cotización expirada'
  }
  return titles[status] || 'Cotización actualizada'
}

function getPaymentTitle(status: string): string {
  const titles: { [key: string]: string } = {
    'PENDING': 'Pago pendiente',
    'COMPLETED': 'Pago completado',
    'FAILED': 'Pago fallido',
    'REFUNDED': 'Pago reembolsado'
  }
  return titles[status] || 'Pago procesado'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ'
  }).format(amount)
}