/**
 * API para Proveedores - Sistema de Gestión de Eventos V3
 * Analiza costos y rendimiento de proveedores
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redisCache, CacheKeys } from '@/lib/redis'

/**
 * GET /api/dashboard/suppliers - Obtener datos de proveedores
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
    const cacheKey = CacheKeys.ANALYTICS_DASHBOARD(`suppliers_${period}`, session.user.tenantId || 'system')
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

    // Consultas en paralelo
    const [
      suppliers,
      supplierCosts,
      topSuppliersByCost,
      supplierPerformance
    ] = await Promise.all([
      // Lista de proveedores activos
      prisma.supplier.findMany({
        where: {
          ...tenantFilter,
          isActive: true
        },
        include: {
          products: {
            include: { product: true },
            where: { isActive: true }
          },
          services: {
            include: { service: true },
            where: { isActive: true }
          }
        }
      }),

      // Costos totales por proveedor
      prisma.supplierProduct.groupBy({
        by: ['supplierId'],
        where: {
          supplier: tenantFilter,
          isActive: true
        },
        _sum: { cost: true },
        _count: true
      }),

      // Top proveedores por costo en eventos
      prisma.supplierProduct.findMany({
        where: {
          supplier: tenantFilter,
          isActive: true
        },
        include: {
          supplier: true,
          product: {
            include: {
              packageItems: {
                include: {
                  package: {
                    include: {
                      quote: {
                        include: {
                          event: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),

      // Rendimiento de proveedores (entregas a tiempo, etc.)
      prisma.supplierProduct.findMany({
        where: {
          supplier: tenantFilter,
          isActive: true
        },
        select: {
          supplierId: true,
          deliveryDays: true,
          supplier: {
            select: { name: true, type: true }
          }
        }
      })
    ])

    // Procesar costos por proveedor
    const supplierCostMap = supplierCosts.reduce((acc: any, cost) => {
      acc[cost.supplierId] = {
        totalCost: Number(cost._sum.cost || 0),
        productCount: cost._count
      }
      return acc
    }, {})

    // Procesar top proveedores por uso en eventos
    const supplierUsageMap = new Map()

    topSuppliersByCost.forEach(sp => {
      const supplierId = sp.supplierId
      let totalUsed = 0
      let eventCount = 0

      sp.product.packageItems.forEach(item => {
        if (item.package.quote?.event?.startDate &&
            item.package.quote.event.startDate >= startDate &&
            item.package.quote.event.startDate <= endDate) {
          totalUsed += Number(item.totalPrice)
          eventCount += 1
        }
      })

      if (supplierUsageMap.has(supplierId)) {
        const existing = supplierUsageMap.get(supplierId)
        existing.totalUsed += totalUsed
        existing.eventCount += eventCount
      } else {
        supplierUsageMap.set(supplierId, {
          supplier: sp.supplier,
          totalUsed,
          eventCount
        })
      }
    })

    const topSuppliers = Array.from(supplierUsageMap.values())
      .sort((a, b) => b.totalUsed - a.totalUsed)
      .slice(0, 10)

    // Procesar rendimiento de proveedores
    const performanceData = supplierPerformance.reduce((acc: any[], perf) => {
      const existing = acc.find(p => p.supplierId === perf.supplierId)

      if (existing) {
        existing.totalProducts += 1
        existing.avgDeliveryDays = (existing.avgDeliveryDays + perf.deliveryDays) / 2
      } else {
        acc.push({
          supplierId: perf.supplierId,
          supplierName: perf.supplier.name,
          supplierType: perf.supplier.type,
          totalProducts: 1,
          avgDeliveryDays: perf.deliveryDays
        })
      }

      return acc
    }, [])

    // Combinar datos de proveedores
    const suppliersData = suppliers.map(supplier => ({
      ...supplier,
      totalCost: supplierCostMap[supplier.id]?.totalCost || 0,
      productCount: supplierCostMap[supplier.id]?.productCount || 0,
      serviceCount: supplier.services.length
    }))

    const suppliersAnalyticsData = {
      summary: {
        totalSuppliers: suppliers.length,
        totalSupplierCost: suppliersData.reduce((sum, s) => sum + s.totalCost, 0),
        avgCostPerSupplier: suppliers.length > 0 ?
          suppliersData.reduce((sum, s) => sum + s.totalCost, 0) / suppliers.length : 0
      },
      suppliers: suppliersData,
      topSuppliers,
      performance: performanceData,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        months: period
      },
      generatedAt: new Date().toISOString()
    }

    // Guardar en cache por 15 minutos
    await redisCache.set(cacheKey, suppliersAnalyticsData, 900)

    return NextResponse.json({
      success: true,
      data: suppliersAnalyticsData
    })

  } catch (error) {
    console.error('Error en suppliers API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
