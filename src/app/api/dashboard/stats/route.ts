import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API para obtener estadísticas generales del dashboard
 * GET /api/dashboard/stats?period=30
 */
export async function GET(request: NextRequest) {
  try {
    // TEMPORALMENTE DESHABILITADO PARA PRUEBAS
    /*
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    */

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // días

    // Calcular fechas para el período
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Obtener métricas en paralelo para mejor performance
    const [
      totalEvents,
      totalClients,
      activeClients,
      totalQuotes,
      pendingQuotes,
      completedEvents,
      recentEvents,
      monthlyRevenue
    ] = await Promise.all([
      // Total de eventos
      prisma.event.count(),
      
      // Total de clientes
      prisma.client.count(),
      
      // Clientes activos (con eventos en el período)
      prisma.client.count({
        where: {
          events: {
            some: {
              eventDate: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      }),
      
      // Total cotizaciones
      prisma.quote.count(),
      
      // Cotizaciones pendientes
      prisma.quote.count({
        where: {
          status: 'PENDING'
        }
      }),
      
      // Eventos completados
      prisma.event.count({
        where: {
          status: 'COMPLETED'
        }
      }),
      
      // Eventos próximos (siguiente semana)
      prisma.event.findMany({
        where: {
          eventDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // próximos 7 días
          }
        },
        include: {
          client: {
            select: { name: true }
          }
        },
        orderBy: {
          eventDate: 'asc'
        },
        take: 5
      }),
      
      // Revenue del mes actual
      prisma.event.aggregate({
        where: {
          eventDate: {
            gte: new Date(endDate.getFullYear(), endDate.getMonth(), 1),
            lte: endDate
          },
          status: {
            in: ['CONFIRMED', 'COMPLETED']
          }
        },
        _sum: {
          totalAmount: true
        }
      })
    ])

    // Calcular métricas adicionales
    const eventsThisPeriod = await prisma.event.count({
      where: {
        eventDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const newClientsThisPeriod = await prisma.client.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calcular tasa de conversión de cotizaciones
    const approvedQuotes = await prisma.quote.count({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const totalQuotesInPeriod = await prisma.quote.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const conversionRate = totalQuotesInPeriod > 0 
      ? (approvedQuotes / totalQuotesInPeriod) * 100 
      : 0

    const stats = {
      // Métricas generales
      totalEvents,
      totalClients,
      activeClients,
      newClientsThisPeriod,
      
      // Eventos
      eventsThisPeriod,
      completedEvents,
      upcomingEvents: recentEvents,
      
      // Cotizaciones
      totalQuotes,
      pendingQuotes,
      conversionRate: Math.round(conversionRate * 100) / 100,
      
      // Revenue
      monthlyRevenue: Number(monthlyRevenue._sum.totalAmount || 0),
      
      // Período de consulta
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(period)
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las estadísticas' 
      },
      { status: 500 }
    )
  }
}
