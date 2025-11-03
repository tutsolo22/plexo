/**
 * API para Gestión de Eventos Individuales - Fase 2C
 * Operaciones GET, PUT, DELETE para eventos específicos
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@prisma/client';
import { ApiResponses } from '@/lib/api/responses';

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
  colorCode: z.string().optional(),
});

/**
 * GET /api/events/[id] - Obtener evento específico
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiResponses.unauthorized('No autenticado');
    }

    const { id } = params;
    const tenantId = session.user.tenantId;

    if (!id) {
      return ApiResponses.badRequest('ID de evento requerido');
    }

    const event = await prisma.event.findFirst({
      where: { 
        id,
        tenantId, // ✅ Autenticación habilitada
        status: { not: EventStatus.CANCELLED }, // Excluir cancelados (no hay deletedAt)
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            minCapacity: true,
            maxCapacity: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            validUntil: true,
          },
        },
      },
    });

    if (!event) {
      return ApiResponses.notFound('Evento no encontrado');
    }

    return ApiResponses.success({ event });
  } catch (error) {
    console.error('Error obteniendo evento:', error);
    return ApiResponses.internalError('Error obteniendo evento');
  }
}

/**
 * PUT /api/events/[id] - Actualizar evento específico
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiResponses.unauthorized('No autenticado');
    }

    const { id } = params;
    const tenantId = session.user.tenantId;

    if (!id) {
      return ApiResponses.badRequest('ID de evento requerido');
    }

    // Verificar que el evento existe y pertenece al tenant
    const existingEvent = await prisma.event.findFirst({
      where: { 
        id,
        tenantId, // ✅ Autenticación habilitada
        status: { not: EventStatus.CANCELLED }, // Excluir cancelados
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = UpdateEventSchema.parse(body);

    // Validaciones de fechas si se proporcionan ambas
    if (validatedData.startDate && validatedData.endDate) {
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);

      if (startDate >= endDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'La fecha de inicio debe ser anterior a la fecha de fin',
          },
          { status: 400 }
        );
      }
    }

    // Verificar cliente si se cambia
    if (validatedData.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: validatedData.clientId },
      });

      if (!client) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cliente no encontrado',
          },
          { status: 404 }
        );
      }
    }

    // Verificar conflictos de horario si se cambian fechas o ubicación
    if (
      validatedData.startDate ||
      validatedData.endDate ||
      validatedData.roomId !== undefined ||
      validatedData.venueId !== undefined
    ) {
      const startDate = validatedData.startDate
        ? new Date(validatedData.startDate)
        : existingEvent.startDate;
      const endDate = validatedData.endDate
        ? new Date(validatedData.endDate)
        : existingEvent.endDate;
      const roomId =
        validatedData.roomId !== undefined ? validatedData.roomId : existingEvent.roomId;
      const venueId =
        validatedData.venueId !== undefined ? validatedData.venueId : existingEvent.venueId;

      if (roomId || venueId) {
        const conflictWhere: any = {
          id: { not: id }, // Excluir el evento actual
          AND: [
            {
              OR: [
                {
                  startDate: { lte: endDate },
                  endDate: { gte: startDate },
                },
              ],
            },
            {
              status: {
                not: EventStatus.CANCELLED,
              },
            },
          ],
        };

        if (roomId) {
          conflictWhere.roomId = roomId;
        }

        if (venueId) {
          conflictWhere.venueId = venueId;
        }

        const conflictingEvent = await prisma.event.findFirst({
          where: conflictWhere,
        });

        if (conflictingEvent) {
          return NextResponse.json(
            {
              success: false,
              error: 'Ya existe un evento en esa fecha y ubicación',
            },
            { status: 409 }
          );
        }
      }
    }

    // Preparar datos para actualización
    const updateData: any = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.startDate !== undefined)
      updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.clientId !== undefined) updateData.clientId = validatedData.clientId;
    if (validatedData.roomId !== undefined) updateData.roomId = validatedData.roomId;
    if (validatedData.venueId !== undefined) updateData.venueId = validatedData.venueId;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.isFullVenue !== undefined) updateData.isFullVenue = validatedData.isFullVenue;
    if (validatedData.colorCode !== undefined) updateData.colorCode = validatedData.colorCode;

    // Actualizar color según estado si se cambia el estado
    if (validatedData.status && !validatedData.colorCode) {
      const statusColors = {
        [EventStatus.RESERVED]: '#f59e0b',
        [EventStatus.QUOTED]: '#3b82f6',
        [EventStatus.CONFIRMED]: '#10b981',
        [EventStatus.CANCELLED]: '#ef4444',
      };
      updateData.colorCode = statusColors[validatedData.status];
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
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            minCapacity: true,
            maxCapacity: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
          },
        },
      },
    });

    console.log('✅ Evento actualizado:', updatedEvent.id);

    return ApiResponses.success({
      event: updatedEvent,
      message: 'Evento actualizado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest('Datos de entrada inválidos', error.errors);
    }

    console.error('Error actualizando evento:', error);
    return ApiResponses.internalError('Error actualizando evento');
  }
}

/**
 * DELETE /api/events/[id] - Eliminar evento específico (soft delete)
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return ApiResponses.unauthorized('No autenticado');
    }

    const { id } = params;
    const tenantId = session.user.tenantId;

    if (!id) {
      return ApiResponses.badRequest('ID de evento requerido');
    }

    // Verificar que el evento existe y pertenece al tenant
    const existingEvent = await prisma.event.findFirst({
      where: { 
        id,
        tenantId, // ✅ Autenticación habilitada
        status: { not: EventStatus.CANCELLED }, // Excluir cancelados
      },
      include: {
        quote: true, // quote singular, no quotes
      },
    });

    if (!existingEvent) {
      return ApiResponses.notFound('Evento no encontrado o no tienes permisos');
    }

    // Verificar si el evento puede ser eliminado (cambiar a CANCELLED)
    if (existingEvent.status === EventStatus.CONFIRMED && existingEvent.startDate > new Date()) {
      return ApiResponses.badRequest(
        'No se puede eliminar un evento confirmado futuro. Considere cancelarlo.'
      );
    }

    // "Eliminar" cambiando status a CANCELLED (Event no tiene deletedAt)
    await prisma.event.update({
      where: { id },
      data: { status: EventStatus.CANCELLED },
    });

    console.log('🗑️ Evento cancelado:', id);

    return ApiResponses.success({
      message: 'Evento cancelado exitosamente',
    });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    return ApiResponses.internalError('Error eliminando evento');
  }
}
