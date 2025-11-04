import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponses } from '@/lib/api/response-builder'
import { validateTenantSession, getTenantIdFromSession } from '@/lib/utils'

// GET /api/admin/ai-providers/[id]/history - Obtener historial de auditoría
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string | null } }
) {
  try {
    const session = await auth()
    const tenantValidation = validateTenantSession(session)
    if (tenantValidation) return tenantValidation

    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes((session as any).user.role)) {
      return ApiResponses.forbidden('No tienes permisos para ver el historial')
    }

    if (!params.id || typeof params.id !== 'string') {
      return ApiResponses.badRequest('ID de configuración requerido')
    }

    const configId = params.id
    const tenantId = getTenantIdFromSession(session)!

    // Verificar que la configuración exista y pertenezca al tenant
    const config = await prisma.aiProviderConfig.findFirst({
      where: { id: configId, tenantId },
    })

    if (!config) {
      return ApiResponses.notFound('Configuración no encontrada')
    }

    // Obtener el historial de auditoría
    const history = await prisma.aiProviderConfigAudit.findMany({
      where: {
        aiProviderConfigId: configId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return ApiResponses.success(history)
  } catch (error) {
    console.error('Error al obtener historial de auditoría:', error)
    return ApiResponses.internalError('Error al obtener historial')
  }
}
