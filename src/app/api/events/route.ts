/**
 * API para Gestión de Eventos - Fase 2C
 * CRUD completo para el sistema de eventos y calendario
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { EventStatus } from '@prisma/client'

// Esquemas de validación
const CreateEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  startDate: z.string().datetime('Fecha de inicio inválida'),
  endDate: z.string().datetime('Fecha de fin inválida'),
  clientId: z.string().cuid('ID de cliente inválido'),
  roomId: z.string().cuid().optional(),
  venueId: z.string().cuid().optional(),
  status: z.nativeEnum(EventStatus).optional().default(EventStatus.RESERVED),
  notes: z.string().optional(),
  isFullVenue: z.boolean().optional().default(false),
  colorCode: z.string().optional()
})

const UpdateEventSchema = CreateEventSchema.partial()

const QuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.nativeEnum(EventStatus).optional(),
  clientId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  calendar: z.string().optional() // Para vista de calendario
})

/**
 * GET /api/events - Obtener lista de eventos con filtros avanzados
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = QuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      calendar: searchParams.get('calendar') || undefined
    })

    const page = parseInt(query.page)
    const limit = parseInt(query.limit)
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (query.status) {
      where.status = query.status
    }

    if (query.clientId) {
      where.clientId = query.clientId
    }

    // Manejo de fechas
    if (query.startDate && query.endDate) {
      where.AND = [
        { startDate: { gte: new Date(query.startDate) } },
        { endDate: { lte: new Date(query.endDate) } }
      ]
    } else if (query.startDate) {
      where.startDate = { gte: new Date(query.startDate) }
    } else if (query.endDate) {
      where.endDate = { lte: new Date(query.endDate) }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    // Si es vista de calendario, obtener todos los eventos sin paginación
    const isCalendarView = query.calendar === 'true'
    
    const queryOptions: any = {
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    }

    if (!isCalendarView) {
      queryOptions.skip = skip
      queryOptions.take = limit
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany(queryOptions),
      prisma.event.count({ where })
    ])

    const response: any = {
      success: true,
      data: {
        events
      }
    }

    if (!isCalendarView) {
      response.data.pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetros de consulta inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/events - Crear nuevo evento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateEventSchema.parse(body)

    // Validaciones de negocio
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    if (startDate >= endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La fecha de inicio debe ser anterior a la fecha de fin' 
        },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId }
    })

    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cliente no encontrado' 
        },
        { status: 404 }
      )
    }

    // Verificar disponibilidad de room/venue si se especifica
    if (validatedData.roomId || validatedData.venueId) {
      const conflictWhere: any = {
        AND: [
          {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate }
              }
            ]
          },
          {
            status: {
              not: EventStatus.CANCELLED
            }
          }
        ]
      }

      if (validatedData.roomId) {
        conflictWhere.roomId = validatedData.roomId
      }

      if (validatedData.venueId) {
        conflictWhere.venueId = validatedData.venueId
      }

      const conflictingEvent = await prisma.event.findFirst({
        where: conflictWhere
      })

      if (conflictingEvent) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ya existe un evento en esa fecha y ubicación' 
          },
          { status: 409 }
        )
      }
    }

    // Generar color por defecto según estado
    const statusColors = {
      [EventStatus.RESERVED]: '#f59e0b',
      [EventStatus.QUOTED]: '#3b82f6',
      [EventStatus.CONFIRMED]: '#10b981',
      [EventStatus.CANCELLED]: '#ef4444'
    }

    const eventData = {
      title: validatedData.title,
      startDate,
      endDate,
      clientId: validatedData.clientId,
      roomId: validatedData.roomId || null,
      venueId: validatedData.venueId || null,
      status: validatedData.status || EventStatus.RESERVED,
      notes: validatedData.notes || null,
      isFullVenue: validatedData.isFullVenue || false,
      colorCode: validatedData.colorCode || statusColors[validatedData.status || EventStatus.RESERVED],
      tenantId: 'default' // TODO: Obtener del contexto de autenticación
    }

    const event = await prisma.event.create({
      data: eventData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            minCapacity: true,
            maxCapacity: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            description: true
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
        { 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}