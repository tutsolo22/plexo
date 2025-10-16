import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Schema de validación para servicios
const createServiceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('hora'),
  isActive: z.boolean().default(true)
})

const updateServiceSchema = createServiceSchema.partial()

// GET /api/services - Listar servicios
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
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      tenantId: session.user.tenantId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === 'true'

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          servicePrices: {
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear servicios
    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createServiceSchema.parse(body)

    const service = await prisma.service.create({
      data: {
        ...validatedData,
        tenantId: session.user.tenantId
      },
      include: {
        servicePrices: {
          include: {
            priceList: true
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