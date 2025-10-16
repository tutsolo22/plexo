import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { $Enums } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Schema de validación para productos
const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  cost: z.number().optional().transform(val => val ? new Decimal(val) : undefined),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0').transform(val => new Decimal(val)),
  itemType: z.enum(['VENTA', 'COMBO']).default('VENTA'),
  unit: z.string().default('pieza'),
  isActive: z.boolean().default(true)
})

// const updateProductSchema = createProductSchema.partial() // Para uso futuro

// GET /api/products - Listar productos
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
    const type = searchParams.get('type')
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

    if (type) where["itemType"] = type as $Enums.ItemType
    if (isActive !== null) where["isActive"] = isActive === 'true'

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplierProducts: {
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
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/products - Crear producto
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear productos
    const allowedRoles: $Enums.RoleType[] = [$Enums.RoleType.SUPER_ADMIN, $Enums.RoleType.TENANT_ADMIN, $Enums.RoleType.MANAGER]
    if (!session.user.role?.roleId || !allowedRoles.includes(session.user.role.roleId as $Enums.RoleType)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Verificar nombre único
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: validatedData.name,
        tenantId: session.user.tenantId
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un producto con ese nombre' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        cost: validatedData.cost ?? null,
        price: validatedData.price,
        itemType: validatedData.itemType as $Enums.ItemType,
        unit: validatedData.unit,
        isActive: validatedData.isActive,
        tenantId: session.user.tenantId
      },
      include: {
        supplierProducts: {
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
      data: product,
      message: 'Producto creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}