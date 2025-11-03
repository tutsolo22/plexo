import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

/**
 * Schema de validación para actualizar precio individual
 */
const updateRoomPricingSchema = z.object({
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/price-lists/[id]/room-pricing/[pricingId]
 * Obtiene un precio de sala específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pricingId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    const roomPricing = await prisma.roomPricing.findFirst({
      where: {
        id: params.pricingId,
        priceListId: params.id,
        priceList: {
          tenantId: session.user.tenantId,
        },
      },
      select: {
        id: true,
        price: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        room: {
          select: {
            id: true,
            name: true,
            maxCapacity: true,
            minCapacity: true,
            description: true,
          },
        },
        workShift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            description: true,
          },
        },
        priceList: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!roomPricing) {
      return ApiResponses.notFound('Precio de sala no encontrado');
    }

    // Formatear respuesta
    const formattedPricing = {
      ...roomPricing,
      price: parseFloat(roomPricing.price.toString()),
      workShift: {
        ...roomPricing.workShift,
        startTime: new Date(roomPricing.workShift.startTime).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        endTime: new Date(roomPricing.workShift.endTime).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      },
    };

    return ApiResponses.success(formattedPricing);
  } catch (error) {
    console.error('Error al obtener precio de sala:', error);
    return ApiResponses.internalError('Error al obtener el precio de sala');
  }
}

/**
 * PUT /api/price-lists/[id]/room-pricing/[pricingId]
 * Actualiza un precio de sala específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; pricingId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden actualizar precios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para actualizar precios');
    }

    // Verificar que el precio existe y pertenece a la lista de precios del tenant
    const existingPricing = await prisma.roomPricing.findFirst({
      where: {
        id: params.pricingId,
        priceListId: params.id,
        priceList: {
          tenantId: session.user.tenantId,
        },
      },
    });

    if (!existingPricing) {
      return ApiResponses.notFound('Precio de sala no encontrado');
    }

    const body = await request.json();
    const validatedData = updateRoomPricingSchema.parse(body);

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (validatedData.price !== undefined) {
      updateData.price = validatedData.price;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    const updatedPricing = await prisma.roomPricing.update({
      where: { id: params.pricingId },
      data: updateData,
      select: {
        id: true,
        price: true,
        isActive: true,
        updatedAt: true,
        room: {
          select: {
            id: true,
            name: true,
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
    });

    // Formatear respuesta
    const formattedPricing = {
      ...updatedPricing,
      price: parseFloat(updatedPricing.price.toString()),
      workShift: {
        ...updatedPricing.workShift,
        startTime: new Date(updatedPricing.workShift.startTime).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        endTime: new Date(updatedPricing.workShift.endTime).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      },
    };

    return ApiResponses.success(formattedPricing, 'Precio de sala actualizado exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    
    console.error('Error al actualizar precio de sala:', error);
    return ApiResponses.internalError('Error al actualizar el precio de sala');
  }
}

/**
 * DELETE /api/price-lists/[id]/room-pricing/[pricingId]
 * Elimina un precio de sala específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pricingId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden eliminar precios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para eliminar precios');
    }

    // Verificar que el precio existe y pertenece a la lista de precios del tenant
    const existingPricing = await prisma.roomPricing.findFirst({
      where: {
        id: params.pricingId,
        priceListId: params.id,
        priceList: {
          tenantId: session.user.tenantId,
        },
      },
    });

    if (!existingPricing) {
      return ApiResponses.notFound('Precio de sala no encontrado');
    }

    await prisma.roomPricing.delete({
      where: { id: params.pricingId },
    });

    return ApiResponses.success(
      { id: params.pricingId },
      'Precio de sala eliminado exitosamente'
    );
  } catch (error) {
    console.error('Error al eliminar precio de sala:', error);
    return ApiResponses.internalError('Error al eliminar el precio de sala');
  }
}
