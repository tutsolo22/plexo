import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API para obtener datos de revenue del dashboard
 * GET /api/dashboard/revenue?period=30&granularity=daily
 * 
 * Parámetros de consulta:
 * - period: días hacia atrás (default: 30)
 * - granularity: 'daily', 'weekly', 'monthly' (default: 'daily')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30')
    const granularity = searchParams.get('granularity') || 'daily'

    // Calcular fechas
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Obtener eventos con revenue en el período
    const events = await prisma.event.findMany({
      where: {
        startDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['CONFIRMED', 'CANCELLED']
        }
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        status: true,
        client: {
          select: {
            name: true
          }
        },
        quote: {
          select: {
            total: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    // Agrupar datos según la granularidad
    const revenueData = groupRevenueByPeriod(events, granularity, startDate, endDate)

    // Calcular métricas adicionales
    const totalRevenue = events.reduce((sum, event) => sum + Number(event.quote?.total || 0), 0)
    const averageEventValue = events.length > 0 ? totalRevenue / events.length : 0

    // Comparar con período anterior
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - period)
    
    const previousEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: previousStartDate,
          lt: startDate
        },
        status: {
          in: ['CONFIRMED']
        }
      },
      select: {
        quote: {
          select: {
            total: true
          }
        }
      }
    })

    const previousRevenue = previousEvents.reduce((sum, event) => sum + Number(event.quote?.total || 0), 0)
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        revenueData,
        summary: {
          totalRevenue,
          averageEventValue: Math.round(averageEventValue * 100) / 100,
          totalEvents: events.length,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            days: period,
            granularity
          }
        },
        topEvents: events
          .sort((a, b) => Number(b.quote?.total || 0) - Number(a.quote?.total || 0))
          .slice(0, 5)
          .map(event => ({
            id: event.id,
            name: event.title,
            date: event.startDate,
            revenue: Number(event.quote?.total || 0),
            client: event.client.name,
            status: event.status
          }))
      }
    })

  } catch (error) {
    console.error('Error obteniendo datos de revenue:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los datos de revenue' 
      },
      { status: 500 }
    )
  }
}

/**
 * Agrupa los datos de revenue por período
 */
function groupRevenueByPeriod(
  events: any[], 
  granularity: string, 
  startDate: Date, 
  endDate: Date
) {
  const data: Array<{ date: string; revenue: number; events: number }> = []

  if (granularity === 'daily') {
    // Agrupar por día
    const current = new Date(startDate)
    while (current <= endDate) {
      const dayStart = new Date(current)
      const dayEnd = new Date(current)
      dayEnd.setHours(23, 59, 59, 999)

      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startDate)
        return eventDate >= dayStart && eventDate <= dayEnd
      })

      const dayRevenue = dayEvents.reduce((sum, event) => sum + Number(event.quote?.total || 0), 0)

      data.push({
        date: current.toISOString().split('T')[0]!,
        revenue: dayRevenue,
        events: dayEvents.length
      })

      current.setDate(current.getDate() + 1)
    }
  } else if (granularity === 'weekly') {
    // Agrupar por semana
    const current = new Date(startDate)
    current.setDate(current.getDate() - current.getDay()) // Inicio de semana

    while (current <= endDate) {
      const weekEnd = new Date(current)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekEvents = events.filter(event => {
        const eventDate = new Date(event.startDate)
        return eventDate >= current && eventDate <= weekEnd
      })

      const weekRevenue = weekEvents.reduce((sum, event) => sum + Number(event.quote?.total || 0), 0)

      data.push({
        date: `${current.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
        revenue: weekRevenue,
        events: weekEvents.length
      })

      current.setDate(current.getDate() + 7)
    }
  } else if (granularity === 'monthly') {
    // Agrupar por mes
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)

    while (current <= endDate) {
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)

      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.startDate)
        return eventDate >= current && eventDate <= monthEnd
      })

      const monthRevenue = monthEvents.reduce((sum, event) => sum + Number(event.quote?.total || 0), 0)

      data.push({
        date: current.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
        revenue: monthRevenue,
        events: monthEvents.length
      })

      current.setMonth(current.getMonth() + 1)
    }
  }

  return data
}