import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

/**
 * Schema de validación para actualizar turno laboral
 */
const updateWorkShiftSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)').optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)').optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/work-shifts/[id]
 * Obtiene un turno laboral específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    const workShift = await prisma.workShift.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roomPricing: {
          select: {
            id: true,
            room: {
              select: {
                id: true,
                name: true,
              },
            },
            priceList: {
              select: {
                id: true,
                name: true,
              },
            },
            price: true,
          },
        },
      },
    });

    if (!workShift) {
      return ApiResponses.notFound('Turno laboral no encontrado');
    }

    // Formatear respuesta
    const formattedShift = {
      ...workShift,
      startTime: new Date(workShift.startTime).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      endTime: new Date(workShift.endTime).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
    };

    return ApiResponses.success(formattedShift);
  } catch (error) {
    console.error('Error al obtener turno:', error);
    return ApiResponses.internalError('Error al obtener el turno laboral');
  }
}

/**
 * PUT /api/work-shifts/[id]
 * Actualiza un turno laboral
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden actualizar turnos
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para actualizar turnos laborales');
    }

    // Verificar que el turno existe y pertenece al tenant
    const existingShift = await prisma.workShift.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingShift) {
      return ApiResponses.notFound('Turno laboral no encontrado');
    }

    const body = await request.json();
    const validatedData = updateWorkShiftSchema.parse(body);

    // Si se actualizan los horarios, validar que no se solapen
    if (validatedData.startTime || validatedData.endTime) {
      const newStartTime = validatedData.startTime 
        ? new Date(`1970-01-01T${validatedData.startTime}:00`)
        : existingShift.startTime;
      
      const newEndTime = validatedData.endTime 
        ? new Date(`1970-01-01T${validatedData.endTime}:00`)
        : existingShift.endTime;

      // Validar que startTime < endTime
      if (newStartTime >= newEndTime) {
        return ApiResponses.badRequest('La hora de inicio debe ser anterior a la hora de fin');
      }

      // Validar solapamiento con otros turnos activos
      const overlappingShift = await prisma.workShift.findFirst({
        where: {
          id: { not: params.id }, // Excluir el turno actual
          tenantId: session.user.tenantId,
          isActive: true,
          OR: [
            {
              AND: [
                { startTime: { lte: newStartTime } },
                { endTime: { gt: newStartTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: newEndTime } },
                { endTime: { gte: newEndTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: newStartTime } },
                { endTime: { lte: newEndTime } },
              ],
            },
          ],
        },
      });

      if (overlappingShift) {
        return ApiResponses.badRequest(
          `Este horario se solapa con el turno "${overlappingShift.name}"`
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.startTime !== undefined) {
      updateData.startTime = new Date(`1970-01-01T${validatedData.startTime}:00`);
    }
    if (validatedData.endTime !== undefined) {
      updateData.endTime = new Date(`1970-01-01T${validatedData.endTime}:00`);
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    const updatedShift = await prisma.workShift.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        description: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Formatear respuesta
    const formattedShift = {
      ...updatedShift,
      startTime: new Date(updatedShift.startTime).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      endTime: new Date(updatedShift.endTime).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
    };

    return ApiResponses.success(formattedShift, 'Turno laboral actualizado exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0]?.message || 'Error de validación');
    }
    
    console.error('Error al actualizar turno:', error);
    return ApiResponses.internalError('Error al actualizar el turno laboral');
  }
}

/**
 * DELETE /api/work-shifts/[id]
 * Elimina un turno laboral
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden eliminar turnos
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para eliminar turnos laborales');
    }

    // Verificar que el turno existe y pertenece al tenant
    const existingShift = await prisma.workShift.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            roomPricing: true,
          },
        },
      },
    });

    if (!existingShift) {
      return ApiResponses.notFound('Turno laboral no encontrado');
    }

    // Verificar si hay precios de salas asociados
    if (existingShift._count.roomPricing > 0) {
      return ApiResponses.badRequest(
        `No se puede eliminar este turno porque tiene ${existingShift._count.roomPricing} precio(s) de salas asociados. Desactívalo en lugar de eliminarlo.`
      );
    }

    await prisma.workShift.delete({
      where: { id: params.id },
    });

    return ApiResponses.success(
      { id: params.id },
      'Turno laboral eliminado exitosamente'
    );
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    return ApiResponses.internalError('Error al eliminar el turno laboral');
  }
}
