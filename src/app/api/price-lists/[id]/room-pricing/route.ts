import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

/**
 * Schema de validación para asignar precio a sala en turno específico
 */
const assignRoomPricingSchema = z.object({
  roomId: z.string().cuid('ID de sala inválido'),
  workShiftId: z.string().cuid('ID de turno inválido'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  isActive: z.boolean().default(true),
});

/**
 * Schema para actualizar precio
 */
const updateRoomPricingSchema = z.object({
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/price-lists/[id]/room-pricing
 * Obtiene todos los precios de salas para esta lista de precios
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string | null } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }
    
    if (!params.id || typeof params.id !== 'string') {
      return ApiResponses.badRequest('ID de lista de precios requerido');
    }

    // Verificar que la lista de precios existe y pertenece al tenant
    const priceList = await prisma.priceList.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!priceList) {
      return ApiResponses.notFound('Lista de precios no encontrada');
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const workShiftId = searchParams.get('workShiftId');
    const isActive = searchParams.get('isActive');

    // Construir filtros
    const where: any = {
      priceListId: params.id,
    };

    if (roomId) {
      where.roomId = roomId;
    }
    if (workShiftId) {
      where.workShiftId = workShiftId;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const roomPricing = await prisma.roomPricing.findMany({
      where,
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
    });

    // Formatear respuesta
    const formattedPricing = roomPricing.map(rp => ({
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
    }));

    return ApiResponses.success(formattedPricing);
  } catch (error) {
    console.error('Error al obtener precios de salas:', error);
    return ApiResponses.internalError('Error al obtener los precios de salas');
  }
}

/**
 * POST /api/price-lists/[id]/room-pricing
 * Asigna un precio a una sala en un turno específico para esta lista de precios
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string | null } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }
    
    if (!params.id || typeof params.id !== 'string') {
      return ApiResponses.badRequest('ID de lista de precios requerido');
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden asignar precios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para asignar precios');
    }

    // Verificar que la lista de precios existe y pertenece al tenant
    const priceList = await prisma.priceList.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!priceList) {
      return ApiResponses.notFound('Lista de precios no encontrada');
    }

    const body = await request.json();
    const validatedData = assignRoomPricingSchema.parse(body);

    // Verificar que la sala existe y pertenece al tenant
    const room = await prisma.room.findFirst({
      where: {
        id: validatedData.roomId,
        location: {
          businessIdentity: {
            tenantId: session.user.tenantId,
          },
        },
      },
    });

    if (!room) {
      return ApiResponses.notFound('Sala no encontrada');
    }

    // Verificar que el turno existe y pertenece al tenant
    const workShift = await prisma.workShift.findFirst({
      where: {
        id: validatedData.workShiftId,
        tenantId: session.user.tenantId,
      },
    });

    if (!workShift) {
      return ApiResponses.notFound('Turno laboral no encontrado');
    }

    // Verificar si ya existe un precio para esta combinación
    const existingPricing = await prisma.roomPricing.findFirst({
      where: {
        roomId: validatedData.roomId,
        workShiftId: validatedData.workShiftId,
        priceListId: params.id,
      },
    });

    if (existingPricing) {
      return ApiResponses.badRequest(
        'Ya existe un precio asignado para esta sala en este turno para esta lista de precios'
      );
    }

    const roomPricing = await prisma.roomPricing.create({
      data: {
        roomId: validatedData.roomId,
        workShiftId: validatedData.workShiftId,
        priceListId: params.id,
        price: validatedData.price,
        isActive: validatedData.isActive,
      },
      select: {
        id: true,
        price: true,
        isActive: true,
        createdAt: true,
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

    return ApiResponses.created(formattedPricing, 'Precio de sala asignado exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    
    console.error('Error al asignar precio de sala:', error);
    return ApiResponses.internalError('Error al asignar el precio de sala');
  }
}

/**
 * PUT /api/price-lists/[id]/room-pricing
 * Actualiza múltiples precios de salas en batch
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

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden actualizar precios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para actualizar precios');
    }

    // Verificar que la lista de precios existe y pertenece al tenant
    const priceList = await prisma.priceList.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!priceList) {
      return ApiResponses.notFound('Lista de precios no encontrada');
    }

    const body = await request.json();
    
    // Esperar array de actualizaciones
    const updateSchema = z.array(z.object({
      id: z.string().cuid('ID de precio inválido'),
      price: z.number().min(0).optional(),
      isActive: z.boolean().optional(),
    }));

    const validatedData = updateSchema.parse(body);

    // Actualizar en batch
    const updatePromises = validatedData.map(async (update) => {
      // Verificar que el precio pertenece a esta lista
      const existing = await prisma.roomPricing.findFirst({
        where: {
          id: update.id,
          priceListId: params.id,
        },
      });

      if (!existing) {
        throw new Error(`Precio con ID ${update.id} no encontrado`);
      }

      const updateData: any = {};
      if (update.price !== undefined) updateData.price = update.price;
      if (update.isActive !== undefined) updateData.isActive = update.isActive;

      return prisma.roomPricing.update({
        where: { id: update.id },
        data: updateData,
      });
    });

    await Promise.all(updatePromises);

    return ApiResponses.success(
      { updated: validatedData.length },
      `${validatedData.length} precio(s) actualizado(s) exitosamente`
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    
    console.error('Error al actualizar precios:', error);
    return ApiResponses.internalError('Error al actualizar los precios');
  }
}
