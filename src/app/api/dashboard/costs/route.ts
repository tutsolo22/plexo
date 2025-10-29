/**
 * API para Costos - Sistema de Gestión de Eventos V3
 * Calcula costos totales incluyendo proveedores y gastos operativos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redisCache, CacheKeys } from '@/lib/redis'

/**
 * GET /api/dashboard/costs - Obtener datos de costos
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
    const includeSupplierCosts = searchParams.get('includeSuppliers') !== 'false'

    // Verificar cache
    const cacheKey = CacheKeys.ANALYTICS_DASHBOARD(`costs_${period}_${includeSupplierCosts}`, session.user.tenantId || 'system')
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
      operationalExpenses,
      supplierCosts,
      monthlyExpenses,
      categoryBreakdown
    ] = await Promise.all([
      // Gastos operativos totales
      prisma.expense.aggregate({
        where: {
          ...tenantFilter,
          ...dateFilter,
          isActive: true
        },
        _sum: { amount: true },
        _count: true
      }),

      // Costos de proveedores (si se incluyen)
      includeSupplierCosts ? Promise.all([
        // Costos de productos en eventos
        prisma.packageItem.aggregate({
          where: {
            package: {
              quote: {
                ...tenantFilter,
                event: {
                  startDate: { gte: startDate, lte: endDate }
                }
              }
            },
            product: {
              cost: { not: null }
            }
          },
          _sum: {
            totalPrice: true
          }
        }),
        // Costos de servicios en eventos
        prisma.packageItem.aggregate({
          where: {
            package: {
              quote: {
                ...tenantFilter,
                event: {
                  startDate: { gte: startDate, lte: endDate }
                }
              }
            },
            service: {
              price: { gt: 0 } // Usamos price como proxy de costo para servicios
            }
          },
          _sum: {
            totalPrice: true
          }
        })
      ]) : [null, null],

      // Gastos mensuales
      prisma.expense.findMany({
        where: {
          ...tenantFilter,
          ...dateFilter,
          isActive: true
        },
        select: {
          date: true,
          amount: true,
          category: true
        },
        orderBy: { date: 'asc' }
      }),

      // Desglose por categoría
      prisma.expense.groupBy({
        by: ['category'],
        where: {
          ...tenantFilter,
          ...dateFilter,
          isActive: true
        },
        _sum: { amount: true },
        _count: true
      })
    ])

    // Procesar costos de proveedores
    let supplierTotalCost = 0
    if (includeSupplierCosts && supplierCosts) {
      const [productCosts, serviceCosts] = supplierCosts
      supplierTotalCost = Number(productCosts?._sum.totalPrice || 0) + Number(serviceCosts?._sum.totalPrice || 0)
    }

    // Procesar datos mensuales
    const monthlyData = monthlyExpenses.reduce((acc: any[], expense) => {
      const month = expense.date.toISOString().substring(0, 7)
      const existing = acc.find(item => item.month === month)

      if (existing) {
        existing.expenses += Number(expense.amount)
      } else {
        acc.push({
          month,
          expenses: Number(expense.amount)
        })
      }

      return acc
    }, [])

    // Procesar desglose por categoría
    const categoryData = categoryBreakdown.map(cat => ({
      category: cat.category,
      amount: Number(cat._sum.amount),
      count: cat._count
    }))

    const totalOperationalExpenses = Number(operationalExpenses._sum.amount || 0)
    const totalCosts = totalOperationalExpenses + supplierTotalCost

    const costsData = {
      summary: {
        totalOperationalExpenses,
        supplierCosts: supplierTotalCost,
        totalCosts,
        expenseCount: operationalExpenses._count
      },
      monthlyData,
      categoryBreakdown: categoryData,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        months: period
      },
      generatedAt: new Date().toISOString()
    }

    // Guardar en cache por 15 minutos
    await redisCache.set(cacheKey, costsData, 900)

    return NextResponse.json({
      success: true,
      data: costsData
    })

  } catch (error) {
    console.error('Error en costs API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}