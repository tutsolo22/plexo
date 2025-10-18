import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { $Enums } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Schema de validación para servicios
const createServiceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0').transform(val => new Decimal(val)),
  itemType: z.enum(['VENTA', 'COMBO']).default('VENTA'),
  unit: z.string().default('servicio'),
  isActive: z.boolean().default(true)
})

// const updateServiceSchema = createServiceSchema.partial() // Para uso futuro

// GET /api/services - Listar servicios
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId
    }

    if (search) {
      where["OR"] = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null) where["isActive"] = isActive === 'true'

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplierServices: {
            include: {
              supplier: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: {
              packageItems: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.service.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener servicios:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/services - Crear servicio
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear servicios
    const allowedRoles: $Enums.RoleType[] = [$Enums.RoleType.SUPER_ADMIN, $Enums.RoleType.TENANT_ADMIN, $Enums.RoleType.MANAGER]
    if (!session.user.role || !allowedRoles.includes(session.user.role as $Enums.RoleType)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createServiceSchema.parse(body)

    const service = await prisma.service.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        price: validatedData.price,
        itemType: validatedData.itemType as $Enums.ItemType,
        unit: validatedData.unit,
        isActive: validatedData.isActive,
        tenantId: session.user.tenantId
      },
      include: {
        supplierServices: {
          include: {
            supplier: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: service,
      message: 'Servicio creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear servicio:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}