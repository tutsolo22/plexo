import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/response-builder';
import { validateTenantSession, getTenantIdFromSession } from '@/lib/utils';

// DELETE /api/admin/ai-providers/[id] - Eliminar configuración de AI
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string | null } }
) {
  try {
    const session = await auth();
    const tenantValidation = validateTenantSession(session);
    if (tenantValidation) return tenantValidation;

    if (
      !['SUPER_ADMIN', 'TENANT_ADMIN'].includes((session as any).user.role)
    ) {
      return ApiResponses.forbidden(
        'No tienes permisos para eliminar configuraciones de AI'
      );
    }

    if (!params.id || typeof params.id !== 'string') {
      return ApiResponses.badRequest('ID de configuración requerido');
    }

    const configId = params.id;
    const tenantId = getTenantIdFromSession(session)!;

    const config = await prisma.aiProviderConfig.findFirst({
      where: { id: configId, tenantId },
    });

    if (!config) {
      return ApiResponses.notFound('Configuración no encontrada');
    }

    await prisma.aiProviderConfig.delete({
      where: { id: configId },
    });

    return ApiResponses.success(
      null,
      'Configuración eliminada exitosamente'
    );
  } catch (error) {
    console.error('Error eliminando configuración de AI:', error);
    return ApiResponses.internalError(
      'Error al eliminar configuración'
    );
  }
}

// PATCH /api/admin/ai-providers/[id] - Activar/Desactivar
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string | null } }
) {
  try {
    const session = await auth();
    const tenantValidation = validateTenantSession(session);
    if (tenantValidation) return tenantValidation;

    if (
      !['SUPER_ADMIN', 'TENANT_ADMIN'].includes((session as any).user.role)
    ) {
      return ApiResponses.forbidden(
        'No tienes permisos para actualizar configuraciones de AI'
      );
    }

    if (!params.id || typeof params.id !== 'string') {
      return ApiResponses.badRequest('ID de configuración requerido');
    }

    const configId = params.id;
    const tenantId = getTenantIdFromSession(session)!;
    const body = await request.json();
    const { isActive } = body;

    const config = await prisma.aiProviderConfig.findFirst({
      where: { id: configId, tenantId },
    });

    if (!config) {
      return ApiResponses.notFound('Configuración no encontrada');
    }

    const updated = await prisma.aiProviderConfig.update({
      where: { id: configId },
      data: { isActive },
      select: {
        id: true,
        provider: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ApiResponses.success(
      updated,
      `Configuración ${isActive ? 'activada' : 'desactivada'}`
    );
  } catch (error) {
    console.error('Error actualizando configuración de AI:', error);
    return ApiResponses.internalError('Error al actualizar configuración');
  }
}
