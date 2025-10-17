/**
 * API para Verificación de Disponibilidad - Fase 2C
 * Verificar conflictos de fechas y disponibilidad de venues/rooms
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { EventStatus } from '@prisma/client'

// Esquema de validación
const AvailabilitySchema = z.object({
  startDate: z.string().datetime('Fecha de inicio inválida'),
  endDate: z.string().datetime('Fecha de fin inválida'),
  roomId: z.string().cuid().optional(),
  venueId: z.string().cuid().optional(),
  excludeEventId: z.string().cuid().optional() // Para edición de eventos existentes
})

/**
 * POST /api/events/availability - Verificar disponibilidad
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = AvailabilitySchema.parse(body)

    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    // Validar fechas
    if (startDate >= endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La fecha de inicio debe ser anterior a la fecha de fin' 
        },
        { status: 400 }
      )
    }

    // Verificar que se especifica al menos room o venue
    if (!validatedData.roomId && !validatedData.venueId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Debe especificar roomId o venueId' 
        },
        { status: 400 }
      )
    }

    // Construir consulta de conflictos
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

    // Excluir evento específico si se proporciona (para edición)
    if (validatedData.excludeEventId) {
      conflictWhere.id = { not: validatedData.excludeEventId }
    }

    // Agregar filtro de ubicación
    if (validatedData.roomId) {
      conflictWhere.roomId = validatedData.roomId
    }

    if (validatedData.venueId) {
      conflictWhere.venueId = validatedData.venueId
    }

    // Buscar eventos en conflicto
    const conflictingEvents = await prisma.event.findMany({
      where: conflictWhere,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        room: {
          select: {
            id: true,
            name: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    const isAvailable = conflictingEvents.length === 0

    // Información adicional sobre la ubicación
    let locationInfo = null

    if (validatedData.roomId) {
      locationInfo = await prisma.room.findUnique({
        where: { id: validatedData.roomId },
        select: {
          id: true,
          name: true,
          capacity: true
        }
      })
    } else if (validatedData.venueId) {
      locationInfo = await prisma.venue.findUnique({
        where: { id: validatedData.venueId },
        select: {
          id: true,
          name: true,
          address: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        available: isAvailable,
        conflicts: conflictingEvents,
        location: locationInfo,
        requestedPeriod: {
          startDate: validatedData.startDate,
          endDate: validatedData.endDate
        }
      }
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
 * GET /api/events/availability - Buscar slots disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const roomId = searchParams.get('roomId')
    const venueId = searchParams.get('venueId')
    const date = searchParams.get('date') // Fecha específica para buscar slots
    const duration = parseInt(searchParams.get('duration') || '120') // Duración en minutos

    if (!roomId && !venueId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Debe especificar roomId o venueId' 
        },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Debe especificar una fecha' 
        },
        { status: 400 }
      )
    }

    const targetDate = new Date(date)
    
    // Obtener todos los eventos del día
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const whereClause: any = {
      AND: [
        {
          OR: [
            {
              startDate: { gte: startOfDay, lte: endOfDay }
            },
            {
              endDate: { gte: startOfDay, lte: endOfDay }
            },
            {
              startDate: { lte: startOfDay },
              endDate: { gte: endOfDay }
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
      whereClause.roomId = roomId
    }

    if (venueId) {
      whereClause.venueId = venueId
    }

    const eventsOfDay = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    // Generar slots disponibles
    const businessHours = {
      start: 8, // 8 AM
      end: 22   // 10 PM
    }

    const availableSlots = []
    let currentTime = new Date(targetDate)
    currentTime.setHours(businessHours.start, 0, 0, 0)

    const endTime = new Date(targetDate)
    endTime.setHours(businessHours.end, 0, 0, 0)

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + (duration * 60 * 1000))
      
      if (slotEnd > endTime) break

      // Verificar si este slot está en conflicto con algún evento
      const hasConflict = eventsOfDay.some(event => {
        return (currentTime < event.endDate && slotEnd > event.startDate)
      })

      if (!hasConflict) {
        availableSlots.push({
          startTime: new Date(currentTime),
          endTime: new Date(slotEnd),
          duration: duration
        })
      }

      // Avanzar 30 minutos para el siguiente slot
      currentTime = new Date(currentTime.getTime() + (30 * 60 * 1000))
    }

    return NextResponse.json({
      success: true,
      data: {
        date: date,
        duration: duration,
        availableSlots,
        existingEvents: eventsOfDay,
        businessHours
      }
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