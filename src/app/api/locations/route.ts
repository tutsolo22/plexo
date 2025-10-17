import { NextRequest, NextResponse } from 'next/server'
// import { auth } from '@/lib/auth' // Temporarily disabled
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Schema de validación para ubicaciones
const createLocationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  address: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  businessIdentityId: z.string().min(1, 'La identidad de negocio es requerida')
})

// GET /api/locations - Listar ubicaciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessIdentityId = searchParams.get('businessIdentityId')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {
      businessIdentity: {
        tenantId: session.user.tenantId
      }
    }

    if (businessIdentityId) where.businessIdentityId = businessIdentityId
    if (isActive !== null) where.isActive = isActive === 'true'

    const locations = await prisma.location.findMany({
      where,
      include: {
        businessIdentity: {
          select: { id: true, name: true }
        },
        rooms: {
          where: { isActive: true },
          select: { 
            id: true, 
            name: true, 
            capacity: true, 
            color: true,
            _count: {
              select: {
                events: {
                  where: {
                    status: { in: ['RESERVED', 'QUOTED', 'CONFIRMED'] }
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            rooms: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: locations
    })

  } catch (error) {
    console.error('Error al obtener ubicaciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Crear ubicación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear ubicaciones
    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createLocationSchema.parse(body)

    // Verificar que la identidad de negocio existe y pertenece al tenant
    const businessIdentity = await prisma.businessIdentity.findFirst({
      where: {
        id: validatedData.businessIdentityId,
        tenantId: session.user.tenantId
      }
    })

    if (!businessIdentity) {
      return NextResponse.json(
        { success: false, error: 'Identidad de negocio no encontrada' },
        { status: 404 }
      )
    }

    const location = await prisma.location.create({
      data: validatedData,
      include: {
        businessIdentity: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            rooms: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Ubicación creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear ubicación:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}