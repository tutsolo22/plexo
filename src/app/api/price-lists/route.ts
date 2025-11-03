import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';
import { validateTenantSession, getTenantIdFromSession } from '@/lib/utils';

/**
 * Schema de validación para crear lista de precios
 */
const createPriceListSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/price-lists
 * Obtiene todas las listas de precios del tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const includeRoomPricing = searchParams.get('includeRoomPricing') === 'true';

    // Construir filtros
    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const priceLists = await prisma.priceList.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clients: true,
            roomPricing: true,
          },
        },
        ...(includeRoomPricing && {
          roomPricing: {
            include: {
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
          },
        }),
      },
    });

    // Formatear respuesta
    const formattedLists = priceLists.map(list => ({
      ...list,
      clientsCount: list._count.clients,
      roomPricingCount: list._count.roomPricing,
      roomPricing: includeRoomPricing
        ? list.roomPricing?.map(rp => ({
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
          }))
        : undefined,
      _count: undefined,
    }));

    return ApiResponses.success(formattedLists);
  } catch (error) {
    console.error('Error al obtener listas de precios:', error);
    return ApiResponses.internalError('Error al obtener las listas de precios');
  }
}

/**
 * POST /api/price-lists
 * Crea una nueva lista de precios
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden crear listas de precios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para crear listas de precios');
    }

    const body = await request.json();
    const validatedData = createPriceListSchema.parse(body);

    // Verificar que no exista una lista con el mismo nombre
    const existingList = await prisma.priceList.findFirst({
      where: {
        tenantId: session.user.tenantId,
        name: validatedData.name,
      },
    });

    if (existingList) {
      return ApiResponses.badRequest('Ya existe una lista de precios con ese nombre');
    }

    const priceList = await prisma.priceList.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
      },
    });

    return ApiResponses.created(priceList, 'Lista de precios creada exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    
    console.error('Error al crear lista de precios:', error);
    return ApiResponses.internalError('Error al crear la lista de precios');
  }
}
