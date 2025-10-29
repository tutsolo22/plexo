/**
 * API Financiera Completa - Sistema de Gestión de Eventos V3
 * Reporte financiero integral con ingresos, costos, ganancias y KPIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redisCache, CacheKeys } from '@/lib/redis'

/**
 * GET /api/dashboard/financial - Obtener reporte financiero completo
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
    const cacheKey = CacheKeys.ANALYTICS_DASHBOARD(`financial_${period}`, session.user.tenantId || 'system')
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

    // Consultas en paralelo para todas las métricas financieras
    const [
      revenueMetrics,
      costMetrics,
      eventMetrics,
      supplierMetrics,
      monthlyTrends
    ] = await Promise.all([
      // Métricas de ingresos
      Promise.all([
        prisma.quote.aggregate({
          where: {
            ...tenantFilter,
            event: {
              startDate: { gte: startDate, lte: endDate }
            },
            status: { in: ['ACCEPTED_BY_CLIENT'] }
          },
          _sum: { total: true, discount: true },
          _count: true
        }),
        prisma.quote.groupBy({
          by: ['status'],
          where: {
            ...tenantFilter,
            event: {
              startDate: { gte: startDate, lte: endDate }
            }
          },
          _sum: { total: true },
          _count: true
        })
      ]),

      // Métricas de costos
      Promise.all([
        // Gastos operativos
        prisma.expense.aggregate({
          where: {
            ...tenantFilter,
            date: { gte: startDate, lte: endDate },
            isActive: true
          },
          _sum: { amount: true },
          _count: true
        }),
        // Costos de proveedores
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
        }),
        // Desglose de gastos por categoría
        prisma.expense.groupBy({
          by: ['category'],
          where: {
            ...tenantFilter,
            date: { gte: startDate, lte: endDate },
            isActive: true
          },
          _sum: { amount: true },
          _count: true
        })
      ]),

      // Métricas de eventos
      Promise.all([
        prisma.event.count({
          where: {
            ...tenantFilter,
            ...dateFilter
          }
        }),
        prisma.event.groupBy({
          by: ['status'],
          where: {
            ...tenantFilter,
            ...dateFilter
          },
          _count: true
        })
      ]),

      // Métricas de proveedores
      Promise.all([
        prisma.supplier.count({
          where: {
            ...tenantFilter,
            isActive: true
          }
        }),
        prisma.supplierProduct.aggregate({
          where: {
            supplier: tenantFilter,
            isActive: true
          },
          _sum: { cost: true },
          _count: true
        })
      ]),

      // Tendencias mensuales
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
      })
    ])

    // Procesar métricas de ingresos
    const [revenueAgg, revenueByStatus] = revenueMetrics
    const totalRevenue = Number(revenueAgg._sum.total || 0)
    const totalDiscounts = Number(revenueAgg._sum.discount || 0)
    const netRevenue = totalRevenue - totalDiscounts

    // Procesar métricas de costos
    const [operationalExpenses, supplierCosts, expenseCategories] = costMetrics
    const totalOperationalCosts = Number(operationalExpenses._sum.amount || 0)
    const totalSupplierCosts = Number(supplierCosts._sum.totalPrice || 0)
    const totalCosts = totalOperationalCosts + totalSupplierCosts

    // Procesar métricas de eventos
    const [totalEvents, eventsByStatus] = eventMetrics

    // Procesar métricas de proveedores
    const [totalSuppliers] = supplierMetrics

    // Calcular ganancias y KPIs
    const grossProfit = netRevenue - totalCosts
    const netProfit = grossProfit // Simplificado, sin impuestos
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0
    const avgRevenuePerEvent = totalEvents > 0 ? netRevenue / totalEvents : 0
    const avgCostPerEvent = totalEvents > 0 ? totalCosts / totalEvents : 0

    // Procesar tendencias mensuales
    interface MonthlyDataItem {
      month: string;
      revenue: number;
      events: number;
      operationalCosts?: number;
      supplierCosts?: number;
      totalCosts?: number;
      grossProfit?: number;
      profitMargin?: number;
    }

    const monthlyData = monthlyTrends.reduce((acc: MonthlyDataItem[], event) => {
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
          events: 1
        })
      }

      return acc
    }, [] as MonthlyDataItem[])

    // Calcular métricas mensuales
    const monthlyOperationalCost = totalOperationalCosts / Math.max(period, 1)
    const monthlySupplierCost = totalSupplierCosts / Math.max(period, 1)

    monthlyData.forEach((month: MonthlyDataItem) => {
      month.operationalCosts = monthlyOperationalCost
      month.supplierCosts = monthlySupplierCost
      month.totalCosts = month.operationalCosts + month.supplierCosts
      month.grossProfit = month.revenue - month.totalCosts
      month.profitMargin = month.revenue > 0 ? (month.grossProfit / month.revenue) * 100 : 0
    })

    // Estructurar respuesta completa
    const financialReport = {
      summary: {
        // Ingresos
        totalRevenue,
        totalDiscounts,
        netRevenue,

        // Costos
        totalOperationalCosts,
        totalSupplierCosts,
        totalCosts,

        // Ganancias
        grossProfit,
        netProfit,
        profitMargin,

        // KPIs
        totalEvents,
        avgRevenuePerEvent,
        avgCostPerEvent,
        totalSuppliers
      },

      breakdown: {
        revenueByStatus: revenueByStatus.map((status: { status: string; _sum: { total: any }; _count: number }) => ({
          status: status.status,
          amount: Number(status._sum.total || 0),
          count: status._count
        })),

        costsByCategory: expenseCategories.map((cat: { category: string; _sum: { amount: any }; _count: number }) => ({
          category: cat.category,
          amount: Number(cat._sum.amount || 0),
          count: cat._count
        })),

        eventsByStatus: eventsByStatus.map((status: { status: string; _count: number }) => ({
          status: status.status,
          count: status._count
        }))
      },

      trends: {
        monthly: monthlyData,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          months: period
        }
      },

      kpis: {
        profitability: {
          grossMargin: netRevenue > 0 ? ((netRevenue - totalCosts) / netRevenue) * 100 : 0,
          netMargin: profitMargin,
          roi: totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0
        },

        efficiency: {
          costToRevenueRatio: netRevenue > 0 ? (totalCosts / netRevenue) * 100 : 0,
          avgProfitPerEvent: avgRevenuePerEvent - avgCostPerEvent,
          supplierCostRatio: totalCosts > 0 ? (totalSupplierCosts / totalCosts) * 100 : 0
        }
      },

      generatedAt: new Date().toISOString()
    }

    // Guardar en cache por 15 minutos
    await redisCache.set(cacheKey, financialReport, 900)

    return NextResponse.json({
      success: true,
      data: financialReport
    })

  } catch (error) {
    console.error('Error en financial API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}