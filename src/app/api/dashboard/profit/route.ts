/**
 * API para Ganancias/Pérdidas - Sistema de Gestión de Eventos V3
 * Calcula rentabilidad combinando ingresos y costos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redisCache, CacheKeys } from '@/lib/redis'

/**
 * GET /api/dashboard/profit - Obtener datos de rentabilidad
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
    const cacheKey = CacheKeys.ANALYTICS_DASHBOARD(`profit_${period}`, session.user.tenantId || 'system')
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

    // Consultas en paralelo para ingresos y costos
    const [
      revenueData,
      costData,
      monthlyProfitData
    ] = await Promise.all([
      // Datos de ingresos
      Promise.all([
        prisma.quote.aggregate({
          where: {
            ...tenantFilter,
            event: {
              startDate: { gte: startDate, lte: endDate }
            },
            status: { in: ['ACCEPTED_BY_CLIENT'] }
          },
          _sum: { total: true }
        }),
        prisma.event.findMany({
          where: {
            ...tenantFilter,
            ...dateFilter
          },
          include: {
            quote: { select: { total: true } },
            client: { select: { name: true } }
          }
        })
      ]),

      // Datos de costos
      Promise.all([
        // Gastos operativos
        prisma.expense.aggregate({
          where: {
            ...tenantFilter,
            date: { gte: startDate, lte: endDate },
            isActive: true
          },
          _sum: { amount: true }
        }),
        // Costos de productos/servicios
        prisma.packageItem.aggregate({
          where: {
            package: {
              quote: {
                ...tenantFilter,
                event: {
                  startDate: { gte: startDate, lte: endDate }
                },
                status: { in: ['ACCEPTED_BY_CLIENT'] }
              }
            }
          },
          _sum: { totalPrice: true }
        })
      ]),

      // Datos mensuales de ganancias
      prisma.event.findMany({
        where: {
          ...tenantFilter,
          ...dateFilter,
          quote: { status: { in: ['ACCEPTED_BY_CLIENT'] } }
        },
        include: {
          quote: { select: { total: true } }
        },
        orderBy: { startDate: 'asc' }
      }),

      // Ganancias por tipo de evento (no utilizado por ahora)
      // const profitByEventType = ...
    ])

    // Procesar ingresos
    const [revenueAgg, eventsWithRevenue] = revenueData
    const totalRevenue = Number(revenueAgg._sum.total || 0)

    // Procesar costos
    const [operationalExpenses, supplierCosts] = costData
    const totalOperationalCosts = Number(operationalExpenses._sum.amount || 0)
    const totalSupplierCosts = Number(supplierCosts._sum.totalPrice || 0)
    const totalCosts = totalOperationalCosts + totalSupplierCosts

    // Calcular ganancia neta
    const netProfit = totalRevenue - totalCosts
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Procesar datos mensuales
    const monthlyData = monthlyProfitData.reduce((acc: any[], event) => {
      const month = event.startDate.toISOString().substring(0, 7)
      const revenue = Number(event.quote?.total || 0)

      const existing = acc.find(item => item.month === month)
      if (existing) {
        existing.revenue += revenue
        existing.events += 1
      } else {
        acc.push({
          month,
          revenue,
          events: 1,
          costs: 0 // Se calculará después si es necesario
        })
      }

      return acc
    }, [])

    // Calcular costos mensuales aproximados (distribuir costos totales)
    const totalMonths = period
    const monthlyOperationalCost = totalOperationalCosts / totalMonths

    monthlyData.forEach(month => {
      // Distribuir costos operativos proporcionalmente
      const revenueRatio = totalRevenue > 0 ? month.revenue / totalRevenue : 1 / monthlyData.length
      month.operationalCosts = monthlyOperationalCost * revenueRatio

      // Costos de proveedores (estimación proporcional)
      month.supplierCosts = totalSupplierCosts * revenueRatio
      month.totalCosts = month.operationalCosts + month.supplierCosts
      month.netProfit = month.revenue - month.totalCosts
      month.profitMargin = month.revenue > 0 ? (month.netProfit / month.revenue) * 100 : 0
    })

    const profitData = {
      summary: {
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        totalOperationalCosts,
        totalSupplierCosts,
        eventCount: eventsWithRevenue.length
      },
      monthlyData,
      breakdown: {
        revenue: totalRevenue,
        operationalCosts: totalOperationalCosts,
        supplierCosts: totalSupplierCosts,
        netProfit
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        months: period
      },
      generatedAt: new Date().toISOString()
    }

    // Guardar en cache por 15 minutos
    await redisCache.set(cacheKey, profitData, 900)

    return NextResponse.json({
      success: true,
      data: profitData
    })

  } catch (error) {
    console.error('Error en profit API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
