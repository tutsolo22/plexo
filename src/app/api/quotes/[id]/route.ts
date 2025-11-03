import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateQuoteSchema } from '@/lib/validations/mutations';
import { ApiResponses } from '@/lib/api/responses';
import { QuoteStatus } from '@prisma/client';
import { validateTenantSession, getTenantIdFromSession } from '@/lib/utils';

// GET /api/quotes/[id] - Obtener cotización por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string | null } }
) {
  try {
    const session = await auth();
    const tenantValidation = validateTenantSession(session);
    if (tenantValidation) return tenantValidation;

    const { id } = params;
    
    if (!id || typeof id !== 'string') {
      return ApiResponses.badRequest('ID de cotización requerido');
    }

    const tenantId = getTenantIdFromSession(session)!;

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        tenantId,
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
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
        packages: {
          include: {
            packageItems: {
              include: {
                product: true,
                service: true,
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!quote) {
      return ApiResponses.notFound('Cotización no encontrada');
    }

    return ApiResponses.success({ quote });
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    return ApiResponses.internalError('Error obteniendo cotización');
  }
}

// PUT /api/quotes/[id] - Actualizar cotización
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string | null } }
) {
  try {
    const session = await auth();
    const tenantValidation = validateTenantSession(session);
    if (tenantValidation) return tenantValidation;

    const { id } = params;
    
    if (!id || typeof id !== 'string') {
      return ApiResponses.badRequest('ID de cotización requerido');
    }

    const tenantId = getTenantIdFromSession(session)!;
    
    const body = await request.json();

    // Validar con Zod
    const validatedData = updateQuoteSchema.parse(body);

    // Verificar que la cotización existe y pertenece al tenant
    const existingQuote = await prisma.quote.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingQuote) {
      return ApiResponses.notFound('Cotización no encontrada o no tienes permisos');
    }

    // Si se está actualizando el cliente, verificar que existe
    if (validatedData.clientId && validatedData.clientId !== existingQuote.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!client) {
        return ApiResponses.badRequest('Cliente no encontrado');
      }
    }

    // Si se está actualizando el evento, verificar que existe
    if (validatedData.eventId && validatedData.eventId !== existingQuote.eventId) {
      const event = await prisma.event.findFirst({
        where: {
          id: validatedData.eventId,
          tenantId,
          status: { not: 'CANCELLED' }, // Excluir eventos cancelados
        },
      });

      if (!event) {
        return ApiResponses.badRequest('Evento no encontrado');
      }
    }

    // Incrementar versión si hay cambios significativos
    const shouldIncrementVersion = 
      validatedData.subtotal !== undefined || 
      validatedData.discount !== undefined || 
      validatedData.total !== undefined;

    const updateData: any = { ...validatedData };
    
    if (shouldIncrementVersion) {
      updateData.version = existingQuote.version + 1;
      updateData.previousVersionId = existingQuote.id;
    }

    // Actualizar timestamps según el estado
    if (validatedData.status === 'SENT' && !existingQuote.sentAt) {
      updateData.sentAt = new Date();
    }
    if (validatedData.status === 'ACCEPTED' && !existingQuote.respondedAt) {
      updateData.respondedAt = new Date();
    }
    if (validatedData.status === 'REJECTED' && !existingQuote.respondedAt) {
      updateData.respondedAt = new Date();
    }

    // Actualizar cotización
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('✅ Cotización actualizada:', updatedQuote.id);

    return ApiResponses.success({
      quote: updatedQuote,
      message: 'Cotización actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error actualizando cotización:', error);
    return ApiResponses.internalError('Error actualizando cotización');
  }
}

// DELETE /api/quotes/[id] - Eliminar cotización
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string | null } }
) {
  try {
    const session = await auth();
    const tenantValidation = validateTenantSession(session);
    if (tenantValidation) return tenantValidation;
    
    if (!params.id || typeof params.id !== 'string') {
      return ApiResponses.badRequest('ID de cotización requerido');
    }

    const { id } = params;
    const tenantId = getTenantIdFromSession(session)!;

    // Verificar que la cotización existe y pertenece al tenant
    const existingQuote = await prisma.quote.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingQuote) {
      return ApiResponses.notFound('Cotización no encontrada o no tienes permisos');
    }

    // Verificar que no esté aceptada
    if (existingQuote.status === QuoteStatus.ACCEPTED_BY_CLIENT) {
      return ApiResponses.badRequest('No se puede eliminar una cotización aceptada');
    }

    // Eliminar cotización (hard delete ya que no tiene deletedAt)
    await prisma.quote.delete({
      where: { id },
    });

    console.log('🗑️ Cotización eliminada:', id);

    return ApiResponses.success({
      message: 'Cotización eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error eliminando cotización:', error);
    return ApiResponses.internalError('Error eliminando cotización');
  }
}
