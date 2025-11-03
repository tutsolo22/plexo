/**
 * API para Analytics - Router Principal
 * Sistema de Gestión de Eventos V3
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redisCache, CacheKeys } from '@/lib/redis'

/**
 * GET /api/analytics - Obtener datos de analíticas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '6')

    // Verificar cache
    const cacheKey = CacheKeys.ANALYTICS_DASHBOARD(period.toString(), session.user.tenantId || 'system')
    const cachedData = await redisCache.get(cacheKey)
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: { ...cachedData, fromCache: true }
      })
    }

    // Calcular fechas
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - period)

    // Filtros por tenant  
    const tenantFilter = session.user.tenantId 
      ? { tenantId: session.user.tenantId }
      : {}

    const dateFilter = {
      startDate: { gte: startDate, lte: endDate }
    }

    // Consultas en paralelo
    const [
      totalEvents,
      totalClients,
      totalQuotes,
      totalEmails,
      eventsInPeriod,
      quoteAggregates,
      monthlyEvents
    ] = await Promise.all([
      prisma.event.count({
        where: { ...tenantFilter, ...dateFilter }
      }),
      prisma.client.count({
        where: tenantFilter
      }),
      prisma.quote.count({
        where: tenantFilter
      }),
      prisma.emailLog.count({
        where: session.user.tenantId ? {
          quote: {
            tenantId: session.user.tenantId
          }
        } : {}
      }),
      prisma.event.count({
        where: { ...tenantFilter, ...dateFilter }
      }),
      prisma.quote.aggregate({
        where: tenantFilter,
        _sum: { total: true }
      }),
      prisma.event.findMany({
        where: { ...tenantFilter, ...dateFilter },
        select: {
          startDate: true,
          title: true,
          status: true,
          client: { select: { name: true } },
          quote: {
            select: {
              total: true
            }
          }
        },
        orderBy: { startDate: 'asc' }
      })
    ])

    // Procesar datos mensuales
    const monthlyData = monthlyEvents.reduce((acc: any[], event) => {
      const month = event.startDate.toISOString().substring(0, 7)
      const existing = acc.find(item => item.month === month)
      const eventRevenue = event.quote ? Number(event.quote.total) : 0
      
      if (existing) {
        existing.events += 1
        existing.revenue += eventRevenue
      } else {
        acc.push({
          month,
          events: 1,
          revenue: eventRevenue
        })
      }
      
      return acc
    }, [])

    const analyticsData = {
      summary: {
        totalEvents,
        totalClients,
        totalQuotes,
        totalRevenue: Number(quoteAggregates._sum.total || 0),
        eventsInPeriod,
        totalEmails
      },
      monthlyData,
      generatedAt: new Date().toISOString()
    }

    // Guardar en cache por 15 minutos
    await redisCache.set(cacheKey, analyticsData, 900)

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error('Error en analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
