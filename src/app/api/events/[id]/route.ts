/**
 * API para Gestión de Eventos Individuales - Fase 2C
 * Operaciones GET, PUT, DELETE para eventos específicos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { EventStatus } from '@prisma/client'

// Esquema de validación para actualización
const UpdateEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido').optional(),
  startDate: z.string().datetime('Fecha de inicio inválida').optional(),
  endDate: z.string().datetime('Fecha de fin inválida').optional(),
  clientId: z.string().cuid('ID de cliente inválido').optional(),
  roomId: z.string().cuid().optional().nullable(),
  venueId: z.string().cuid().optional().nullable(),
  status: z.nativeEnum(EventStatus).optional(),
  notes: z.string().optional().nullable(),
  isFullVenue: z.boolean().optional(),
  colorCode: z.string().optional()
})

/**
 * GET /api/events/[id] - Obtener evento específico
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de evento requerido' },
        { status: 400 }
      )
    }

    const event = await prisma.event.findUnique({
      where: { id },
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
            capacity: true
          }
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            validUntil: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: event
    })

  } catch (error) {
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
 * PUT /api/events/[id] - Actualizar evento específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de evento requerido' },
        { status: 400 }
      )
    }

    // Verificar que el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateEventSchema.parse(body)

    // Validaciones de fechas si se proporcionan ambas
    if (validatedData.startDate && validatedData.endDate) {
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
    }

    // Verificar cliente si se cambia
    if (validatedData.clientId) {
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
    }

    // Verificar conflictos de horario si se cambian fechas o ubicación
    if (validatedData.startDate || validatedData.endDate || validatedData.roomId !== undefined || validatedData.venueId !== undefined) {
      const startDate = validatedData.startDate ? new Date(validatedData.startDate) : existingEvent.startDate
      const endDate = validatedData.endDate ? new Date(validatedData.endDate) : existingEvent.endDate
      const roomId = validatedData.roomId !== undefined ? validatedData.roomId : existingEvent.roomId
      const venueId = validatedData.venueId !== undefined ? validatedData.venueId : existingEvent.venueId

      if (roomId || venueId) {
        const conflictWhere: any = {
          id: { not: id }, // Excluir el evento actual
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

        if (roomId) {
          conflictWhere.roomId = roomId
        }

        if (venueId) {
          conflictWhere.venueId = venueId
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
    }

    // Preparar datos para actualización
    const updateData: any = {}

    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate)
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate)
    if (validatedData.clientId !== undefined) updateData.clientId = validatedData.clientId
    if (validatedData.roomId !== undefined) updateData.roomId = validatedData.roomId
    if (validatedData.venueId !== undefined) updateData.venueId = validatedData.venueId
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.isFullVenue !== undefined) updateData.isFullVenue = validatedData.isFullVenue
    if (validatedData.colorCode !== undefined) updateData.colorCode = validatedData.colorCode

    // Actualizar color según estado si se cambia el estado
    if (validatedData.status && !validatedData.colorCode) {
      const statusColors = {
        [EventStatus.RESERVED]: '#f59e0b',
        [EventStatus.QUOTED]: '#3b82f6',
        [EventStatus.CONFIRMED]: '#10b981',
        [EventStatus.CANCELLED]: '#ef4444'
      }
      updateData.colorCode = statusColors[validatedData.status]
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
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
            capacity: true
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
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Evento actualizado exitosamente'
    })

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

/**
 * DELETE /api/events/[id] - Eliminar evento específico
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de evento requerido' },
        { status: 400 }
      )
    }

    // Verificar que el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        quote: true
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el evento puede ser eliminado
    if (existingEvent.status === EventStatus.CONFIRMED && existingEvent.startDate > new Date()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede eliminar un evento confirmado. Considere cancelarlo en su lugar.' 
        },
        { status: 400 }
      )
    }

    await prisma.event.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    })

  } catch (error) {
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