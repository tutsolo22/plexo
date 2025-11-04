import { prisma } from './prisma'
import { AiProviderConfigAudit } from '@prisma/client'

export interface AuditLogInput {
  tenantId: string
  aiProviderConfigId?: string
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE'
  provider: string
  changesDetails?: {
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
  }
  description: string
  ipAddress?: string
}

/**
 * Registra un cambio en la auditoría de configuración de proveedores IA
 */
export async function logAiProviderChange(input: AuditLogInput): Promise<AiProviderConfigAudit> {
  try {
    const auditEntry = await prisma.aiProviderConfigAudit.create({
      data: {
        tenantId: input.tenantId,
        aiProviderConfigId: input.aiProviderConfigId || '',
        userId: input.userId,
        action: input.action,
        provider: input.provider,
        changesDetails: input.changesDetails || {},
        description: input.description,
        ipAddress: input.ipAddress || 'unknown',
      },
    })

    return auditEntry
  } catch (error) {
    console.error('Error logging AI provider change:', error)
    throw error
  }
}

/**
 * Obtiene el historial de auditoría para una configuración específica
 */
export async function getAiProviderAuditHistory(configId: string) {
  try {
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

    return history
  } catch (error) {
    console.error('Error fetching AI provider audit history:', error)
    throw error
  }
}

/**
 * Obtiene el historial de auditoría para un tenant
 */
export async function getTenantAiProviderAuditHistory(tenantId: string, limit = 100) {
  try {
    const history = await prisma.aiProviderConfigAudit.findMany({
      where: {
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        aiProviderConfig: {
          select: {
            id: true,
            provider: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return history
  } catch (error) {
    console.error('Error fetching tenant AI provider audit history:', error)
    throw error
  }
}

/**
 * Compara valores antiguos y nuevos, retornando solo los cambios
 */
export function getChangedFields(oldValues: Record<string, any>, newValues: Record<string, any>) {
  const changes: Record<string, any> = {}

  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      changes[key] = {
        old: oldValues[key],
        new: newValues[key],
      }
    }
  }

  return changes
}

/**
 * Extrae la dirección IP del header de la request
 */
export function getClientIpAddress(headers: Headers): string {
  const xForwardedFor = headers.get('x-forwarded-for')
  const xRealIp = headers.get('x-real-ip')

  if (xForwardedFor) {
    const forwardedIps = xForwardedFor.split(',')
    const firstIp = forwardedIps[0]?.trim()
    return firstIp || 'unknown'
  }

  if (xRealIp) {
    return xRealIp
  }

  return 'unknown'
}

/**
 * Genera descripción legible del cambio realizado
 */
export function generateAuditDescription(
  action: string,
  provider: string,
  changes?: Record<string, any>
): string {
  const descriptions: Record<string, string> = {
    CREATE: `Creada nueva configuración para ${provider}`,
    UPDATE: `Actualizada configuración de ${provider}`,
    DELETE: `Eliminada configuración de ${provider}`,
    ACTIVATE: `Activada configuración de ${provider}`,
    DEACTIVATE: `Desactivada configuración de ${provider}`,
  }

  return descriptions[action] || `Acción ${action} en ${provider}`
}
