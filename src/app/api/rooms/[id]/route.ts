import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

const updateRoomSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  capacity: z.number().min(1, 'La capacidad debe ser mayor a 0').optional(),
  minCapacity: z.number().min(0).optional(),
  maxCapacity: z.number().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/rooms/[id] - Obtener una sala específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return ApiResponses.unauthorized();
    }

    const room = await prisma.room.findFirst({
      where: {
        id: params.id,
        location: {
          businessIdentity: {
            tenantId: session.user.tenantId,
          },
        },
      },
      include: {
        location: {
          include: {
            businessIdentity: {
              select: { id: true, name: true },
            },
          },
        },
        roomPricing: {
          include: {
            workShift: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
              },
            },
            priceList: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            events: {
              where: {
                status: { in: ['RESERVED', 'QUOTED', 'CONFIRMED'] },
              },
            },
          },
        },
      },
    });

    if (!room) {
      return ApiResponses.notFound('Sala no encontrada');
    }

    return ApiResponses.success(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return ApiResponses.internalError('Error al obtener sala');
  }
}

// PUT /api/rooms/[id] - Actualizar sala
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return ApiResponses.unauthorized();
    }

    // Verificar que la sala existe y pertenece al tenant
    const existingRoom = await prisma.room.findFirst({
      where: {
        id: params.id,
        location: {
          businessIdentity: {
            tenantId: session.user.tenantId,
          },
        },
      },
    });

    if (!existingRoom) {
      return ApiResponses.notFound('Sala no encontrada');
    }

    const body = await req.json();
    const validatedData = updateRoomSchema.parse(body);

    // Filtrar propiedades undefined
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    ) as Partial<typeof validatedData>;

    // Si se actualiza capacity, actualizar maxCapacity
    if (updateData.capacity !== undefined) {
      updateData.maxCapacity = updateData.capacity;
    }

    const updatedRoom = await prisma.room.update({
      where: { id: params.id },
      data: updateData as any,
      include: {
        location: {
          include: {
            businessIdentity: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    return ApiResponses.success(updatedRoom, 'Sala actualizada exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest('Datos inválidos', error.errors);
    }
    
    console.error('Error updating room:', error);
    return ApiResponses.internalError('Error al actualizar sala');
  }
}

// DELETE /api/rooms/[id] - Eliminar sala
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return ApiResponses.unauthorized();
    }

    // Verificar que la sala existe y pertenece al tenant
    const room = await prisma.room.findFirst({
      where: {
        id: params.id,
        location: {
          businessIdentity: {
            tenantId: session.user.tenantId,
          },
        },
      },
      include: {
        _count: {
          select: {
            events: true,
            roomPricing: true,
          },
        },
      },
    });

    if (!room) {
      return ApiResponses.notFound('Sala no encontrada');
    }

    // Verificar que no tenga eventos o precios asociados
    if (room._count.events > 0) {
      return ApiResponses.badRequest(
        'No se puede eliminar una sala con eventos asociados.'
      );
    }

    if (room._count.roomPricing > 0) {
      return ApiResponses.badRequest(
        'No se puede eliminar una sala con precios configurados. Elimina primero los precios.'
      );
    }

    await prisma.room.delete({
      where: { id: params.id },
    });

    return ApiResponses.success(
      { id: params.id },
      'Sala eliminada exitosamente'
    );
  } catch (error) {
    console.error('Error deleting room:', error);
    return ApiResponses.internalError('Error al eliminar sala');
  }
}
