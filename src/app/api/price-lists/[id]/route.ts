import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

/**
 * Schema de validación para actualizar lista de precios
 */
const updatePriceListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/price-lists/[id]
 * Obtiene una lista de precios específica con sus precios por sala y turno
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

    const priceList = await prisma.priceList.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        clients: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        roomPricing: {
          select: {
            id: true,
            price: true,
            isActive: true,
            room: {
              select: {
                id: true,
                name: true,
                maxCapacity: true,
              },
            },
            workShift: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
              },
            },
          },
          orderBy: [
            { room: { name: 'asc' } },
            { workShift: { startTime: 'asc' } },
          ],
        },
      },
    });

    if (!priceList) {
      return ApiResponses.notFound('Lista de precios no encontrada');
    }

    // Formatear respuesta
    const formattedList = {
      ...priceList,
      roomPricing: priceList.roomPricing.map(rp => ({
        ...rp,
        price: parseFloat(rp.price.toString()),
        workShift: {
          ...rp.workShift,
          startTime: new Date(rp.workShift.startTime).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          endTime: new Date(rp.workShift.endTime).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        },
      })),
    };

    return ApiResponses.success(formattedList);
  } catch (error) {
    console.error('Error al obtener lista de precios:', error);
    return ApiResponses.internalError('Error al obtener la lista de precios');
  }
}

/**
 * PUT /api/price-lists/[id]
 * Actualiza una lista de precios
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

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden actualizar listas de precios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para actualizar listas de precios');
    }

    // Verificar que la lista existe y pertenece al tenant
    const existingList = await prisma.priceList.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingList) {
      return ApiResponses.notFound('Lista de precios no encontrada');
    }

    const body = await request.json();
    const validatedData = updatePriceListSchema.parse(body);

    // Verificar nombre único si se está actualizando
    if (validatedData.name && validatedData.name !== existingList.name) {
      const duplicateName = await prisma.priceList.findFirst({
        where: {
          id: { not: params.id },
          tenantId: session.user.tenantId,
          name: validatedData.name,
        },
      });

      if (duplicateName) {
        return ApiResponses.badRequest('Ya existe una lista de precios con ese nombre');
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    const updatedList = await prisma.priceList.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return ApiResponses.success(updatedList, 'Lista de precios actualizada exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    
    console.error('Error al actualizar lista de precios:', error);
    return ApiResponses.internalError('Error al actualizar la lista de precios');
  }
}

/**
 * DELETE /api/price-lists/[id]
 * Elimina una lista de precios
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

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden eliminar listas de precios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para eliminar listas de precios');
    }

    // Verificar que la lista existe y pertenece al tenant
    const existingList = await prisma.priceList.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            clients: true,
            roomPricing: true,
          },
        },
      },
    });

    if (!existingList) {
      return ApiResponses.notFound('Lista de precios no encontrada');
    }

    // Verificar si hay clientes o precios de salas asociados
    if (existingList._count.clients > 0 || existingList._count.roomPricing > 0) {
      return ApiResponses.badRequest(
        `No se puede eliminar esta lista porque tiene ${existingList._count.clients} cliente(s) y ${existingList._count.roomPricing} precio(s) de salas asociados. Desactívala en lugar de eliminarla.`
      );
    }

    await prisma.priceList.delete({
      where: { id: params.id },
    });

    return ApiResponses.success(
      { id: params.id },
      'Lista de precios eliminada exitosamente'
    );
  } catch (error) {
    console.error('Error al eliminar lista de precios:', error);
    return ApiResponses.internalError('Error al eliminar la lista de precios');
  }
}
