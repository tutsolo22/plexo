import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

const updateLocationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/locations/[id] - Obtener una ubicación específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return ApiResponses.unauthorized();
    }

    const location = await prisma.location.findFirst({
      where: {
        id: params.id,
        businessIdentity: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        businessIdentity: {
          select: { id: true, name: true },
        },
        rooms: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            color: true,
            maxCapacity: true,
            minCapacity: true,
            description: true,
          },
        },
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    if (!location) {
      return ApiResponses.notFound('Ubicación no encontrada');
    }

    return ApiResponses.success(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    return ApiResponses.internalError('Error al obtener ubicación');
  }
}

// PUT /api/locations/[id] - Actualizar ubicación
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return ApiResponses.unauthorized();
    }

    // Verificar que la ubicación existe y pertenece al tenant
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: params.id,
        businessIdentity: {
          tenantId: session.user.tenantId,
        },
      },
    });

    if (!existingLocation) {
      return ApiResponses.notFound('Ubicación no encontrada');
    }

    const body = await req.json();
    const validatedData = updateLocationSchema.parse(body);

    // Filtrar propiedades undefined
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    ) as Partial<typeof validatedData>;

    const updatedLocation = await prisma.location.update({
      where: { id: params.id },
      data: updateData as any,
      include: {
        businessIdentity: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    return ApiResponses.success(updatedLocation, 'Ubicación actualizada exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest('Datos inválidos', error.errors);
    }
    
    console.error('Error updating location:', error);
    return ApiResponses.internalError('Error al actualizar ubicación');
  }
}

// DELETE /api/locations/[id] - Eliminar ubicación
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return ApiResponses.unauthorized();
    }

    // Verificar que la ubicación existe y pertenece al tenant
    const location = await prisma.location.findFirst({
      where: {
        id: params.id,
        businessIdentity: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    if (!location) {
      return ApiResponses.notFound('Ubicación no encontrada');
    }

    // Verificar que no tenga salas asociadas
    if (location._count.rooms > 0) {
      return ApiResponses.badRequest(
        'No se puede eliminar una ubicación con salas asociadas. Elimina primero las salas.'
      );
    }

    await prisma.location.delete({
      where: { id: params.id },
    });

    return ApiResponses.success(
      { id: params.id },
      'Ubicación eliminada exitosamente'
    );
  } catch (error) {
    console.error('Error deleting location:', error);
    return ApiResponses.internalError('Error al eliminar ubicación');
  }
}
