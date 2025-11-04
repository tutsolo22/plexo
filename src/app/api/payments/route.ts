import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { $Enums } from '@prisma/client'

// GET /api/payments - Listar pagos
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const quoteId = searchParams.get('quoteId')
    const clientId = searchParams.get('clientId')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId
    }

    if (status) where["status"] = status as $Enums.PaymentStatus
    if (quoteId) where["quoteId"] = quoteId

    // Verificar permisos y filtros adicionales
    const isClientExternal = session.user.role === $Enums.RoleType.CLIENT_EXTERNAL
    const isStaff = [
      $Enums.RoleType.SUPER_ADMIN, 
      $Enums.RoleType.TENANT_ADMIN, 
      $Enums.RoleType.MANAGER, 
      $Enums.RoleType.USER,
      $Enums.RoleType.FINANCE,
      $Enums.RoleType.SALES,
      $Enums.RoleType.COORDINATOR,
      $Enums.RoleType.CLIENT_EXTERNAL
    ].includes(session.user.role as $Enums.RoleType)

    if (isClientExternal) {
      // Cliente externo solo puede ver sus propios pagos
      const clientUser = await prisma.client.findFirst({
        where: {
          userId: session.user.id,
          tenantId: session.user.tenantId
        }
      })

      if (!clientUser) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        )
      }

      where["quote"] = {
        clientId: clientUser.id
      }
    } else if (!isStaff) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    } else if (clientId) {
      // Staff puede filtrar por cliente específico
      where["quote"] = {
        clientId: clientId
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              status: true,
              total: true,
              client: {
                select: { id: true, name: true, email: true }
              },
              event: {
                select: { id: true, title: true, startDate: true, status: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error obteniendo pagos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
