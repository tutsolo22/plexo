import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { $Enums } from '@prisma/client'

// Schema de validación para crear evento
const createEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  roomId: z.string().min(1, 'La sala es requerida'),
  clientId: z.string().min(1, 'El cliente es requerido'),
  notes: z.string().optional(),
  status: z.enum(['RESERVED', 'QUOTED', 'CONFIRMED', 'CANCELLED']).default('RESERVED')
})

// Schema para búsqueda de eventos (para uso futuro)
// const searchEventsSchema = z.object({
//   page: z.number().default(1),
//   limit: z.number().default(10),
//   search: z.string().optional(),
//   status: z.enum(['RESERVED', 'QUOTED', 'CONFIRMED', 'CANCELLED']).optional(),
//   roomId: z.string().optional(),
//   clientId: z.string().optional(),
//   startDate: z.string().optional(),
//   endDate: z.string().optional()
// })

// GET /api/events - Listar eventos
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
    const status = searchParams.get('status')
    const roomId = searchParams.get('roomId')
    const clientId = searchParams.get('clientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId
    }

    if (search) {
      where["OR"] = [
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) where["status"] = status as $Enums.EventStatus
    if (roomId) where["roomId"] = roomId
    if (clientId) where["clientId"] = clientId

    if (startDate && endDate) {
      where["startDate"] = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // CLIENT_EXTERNAL solo puede ver sus propios eventos
    if (session.user.role?.roleId === $Enums.RoleType.CLIENT_EXTERNAL) {
      where["client"] = { userId: session.user.id }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          room: {
            include: {
              location: {
                include: {
                  businessIdentity: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          },
          quote: {
            select: { id: true, quoteNumber: true, status: true, total: true }
          }
        },
        orderBy: { startDate: 'desc' }
      }),
      prisma.event.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener eventos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/events - Crear evento
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear eventos
    const allowedRoles: $Enums.RoleType[] = [$Enums.RoleType.SUPER_ADMIN, $Enums.RoleType.TENANT_ADMIN, $Enums.RoleType.MANAGER, $Enums.RoleType.USER]
    if (!session.user.role?.roleId || !allowedRoles.includes(session.user.role.roleId as $Enums.RoleType)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createEventSchema.parse(body)

    // Validar fechas
    if (validatedData.endDate <= validatedData.startDate) {
      return NextResponse.json(
        { success: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      )
    }

    // Verificar que la sala existe y pertenece al tenant
    const room = await prisma.room.findFirst({
      where: {
        id: validatedData.roomId,
        location: {
          businessIdentity: {
            tenantId: session.user.tenantId
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Sala no encontrada' },
        { status: 404 }
      )
    }

    // Verificar conflictos de horario
    const conflictingEvent = await prisma.event.findFirst({
      where: {
        roomId: validatedData.roomId,
        status: { in: [$Enums.EventStatus.RESERVED, $Enums.EventStatus.QUOTED, $Enums.EventStatus.CONFIRMED] },
        OR: [
          {
            AND: [
              { startDate: { lte: validatedData.startDate } },
              { endDate: { gt: validatedData.startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lt: validatedData.endDate } },
              { endDate: { gte: validatedData.endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: validatedData.startDate } },
              { endDate: { lte: validatedData.endDate } }
            ]
          }
        ]
      }
    })

    if (conflictingEvent) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un evento confirmado en ese horario' },
        { status: 400 }
      )
    }

    // Verificar cliente si se proporciona
    if (validatedData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
          tenantId: session.user.tenantId
        }
      })

      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Cliente no encontrado' },
          { status: 404 }
        )
      }
    }

    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        notes: validatedData.notes ?? null,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        roomId: validatedData.roomId,
        clientId: validatedData.clientId,
        status: validatedData.status as $Enums.EventStatus,
        tenantId: session.user.tenantId
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true }
        },
        room: {
          include: {
            location: {
              include: {
                businessIdentity: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Evento creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear evento:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}