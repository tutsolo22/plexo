import { NextRequest, NextResponse } from 'next/server'
// import { auth } from '@/lib/auth' // Temporarily disabled
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Schema de validación para salas
const createRoomSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  capacity: z.number().min(1, 'La capacidad debe ser mayor a 0').optional(),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  isActive: z.boolean().default(true),
  locationId: z.string().min(1, 'La ubicación es requerida')
})

// GET /api/rooms - Listar salas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const businessIdentityId = searchParams.get('businessIdentityId')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {
      location: {
        businessIdentity: {
          tenantId: session.user.tenantId
        }
      }
    }

    if (locationId) where.locationId = locationId
    if (businessIdentityId) where.location.businessIdentityId = businessIdentityId
    if (isActive !== null) where.isActive = isActive === 'true'

    const rooms = await prisma.room.findMany({
      where,
      include: {
        location: {
          include: {
            businessIdentity: {
              select: { id: true, name: true }
            }
          }
        },
        roomPricing: {
          include: {
            workShift: true,
            priceList: true
          }
        },
        _count: {
          select: {
            events: {
              where: {
                status: { in: ['RESERVED', 'QUOTED', 'CONFIRMED'] }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: rooms
    })

  } catch (error) {
    console.error('Error al obtener salas:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/rooms - Crear sala
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear salas
    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createRoomSchema.parse(body)

    // Verificar que la ubicación existe y pertenece al tenant
    const location = await prisma.location.findFirst({
      where: {
        id: validatedData.locationId,
        businessIdentity: {
          tenantId: session.user.tenantId
        }
      }
    })

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Ubicación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar nombre único en la misma ubicación
    const existingRoom = await prisma.room.findFirst({
      where: {
        name: validatedData.name,
        locationId: validatedData.locationId
      }
    })

    if (existingRoom) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una sala con ese nombre en esta ubicación' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: validatedData,
      include: {
        location: {
          include: {
            businessIdentity: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: room,
      message: 'Sala creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear sala:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}