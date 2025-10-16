import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Schema de validación para productos
const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().default('pieza'),
  isActive: z.boolean().default(true),
  type: z.enum(['PRODUCT', 'SERVICE', 'PACKAGE']).default('PRODUCT')
})

const updateProductSchema = createProductSchema.partial()

// GET /api/products - Listar productos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      tenantId: session.user.tenantId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) where.category = category
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          productPrices: {
            include: {
              priceList: true
            }
          },
          _count: {
            select: {
              quoteItems: true,
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear productos
    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Verificar SKU único si se proporciona
    if (validatedData.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          sku: validatedData.sku,
          tenantId: session.user.tenantId
        }
      })

      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un producto con ese SKU' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        tenantId: session.user.tenantId
      },
      include: {
        productPrices: {
          include: {
            priceList: true
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