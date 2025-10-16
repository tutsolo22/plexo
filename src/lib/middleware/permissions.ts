/**
 * Middleware de Autorización basado en Roles y Permisos
 * Sistema flexible que verifica permisos específicos por acción y recurso
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { roleManagementService } from '@/lib/services/role-management';
import { PermissionAction, PermissionResource } from '@prisma/client';

export interface AuthorizedUser {
  id: string;
  email: string;
  name: string | null;
  tenantId: string;
  roles: string[];
  permissions: {
    action: PermissionAction;
    resource: PermissionResource;
  }[];
}

export type RequestHandler = (
  request: NextRequest,
  context: { user: AuthorizedUser }
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware para verificar permisos específicos
 */
export function withPermission(
  requiredAction: PermissionAction,
  requiredResource: PermissionResource
) {
  return function (handler: RequestHandler) {
    return async function (request: NextRequest, ...args: any[]) {
      try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
          return NextResponse.json(
            { error: 'Autenticación requerida' },
            { status: 401 }
          );
        }

        // Verificar permiso específico
        const hasPermission = await roleManagementService.hasPermission(
          session.user.id,
          requiredAction,
          requiredResource
        );

        if (!hasPermission) {
          return NextResponse.json(
            { 
              error: 'Permisos insuficientes',
              required: `${requiredAction} en ${requiredResource}`
            },
            { status: 403 }
          );
        }

        // Obtener información completa del usuario con roles
        const userWithRoles = await roleManagementService.getUserWithRoles(session.user.id);

        if (!userWithRoles || !userWithRoles.isActive) {
          return NextResponse.json(
            { error: 'Usuario inactivo o no encontrado' },
            { status: 403 }
          );
        }

        const authorizedUser: AuthorizedUser = {
          id: userWithRoles.id,
          email: userWithRoles.email,
          name: userWithRoles.name,
          tenantId: session.user.tenantId,
          roles: userWithRoles.roles.map(r => r.type),
          permissions: userWithRoles.permissions
        };

        return handler(request, { user: authorizedUser }, ...args);

      } catch (error) {
        console.error('Error en middleware de permisos:', error);
        return NextResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Middleware para verificar múltiples permisos (OR lógico)
 */
export function withAnyPermission(
  permissions: Array<{
    action: PermissionAction;
    resource: PermissionResource;
  }>
) {
  return function (handler: RequestHandler) {
    return async function (request: NextRequest, ...args: any[]) {
      try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
          return NextResponse.json(
            { error: 'Autenticación requerida' },
            { status: 401 }
          );
        }

        // Verificar si tiene al menos uno de los permisos
        let hasAnyPermission = false;
        
        for (const permission of permissions) {
          const hasThisPermission = await roleManagementService.hasPermission(
            session.user.id,
            permission.action,
            permission.resource
          );
          
          if (hasThisPermission) {
            hasAnyPermission = true;
            break;
          }
        }

        if (!hasAnyPermission) {
          return NextResponse.json(
            { 
              error: 'Permisos insuficientes',
              required: permissions.map(p => `${p.action} en ${p.resource}`).join(' O ')
            },
            { status: 403 }
          );
        }

        const userWithRoles = await roleManagementService.getUserWithRoles(session.user.id);

        if (!userWithRoles || !userWithRoles.isActive) {
          return NextResponse.json(
            { error: 'Usuario inactivo o no encontrado' },
            { status: 403 }
          );
        }

        const authorizedUser: AuthorizedUser = {
          id: userWithRoles.id,
          email: userWithRoles.email,
          name: userWithRoles.name,
          tenantId: session.user.tenantId,
          roles: userWithRoles.roles.map(r => r.type),
          permissions: userWithRoles.permissions
        };

        return handler(request, { user: authorizedUser }, ...args);

      } catch (error) {
        console.error('Error en middleware de permisos múltiples:', error);
        return NextResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Helper para verificar permisos en el lado del cliente
 */
export class PermissionChecker {
  private permissions: Set<string>;

  constructor(permissions: Array<{ action: PermissionAction; resource: PermissionResource }>) {
    this.permissions = new Set(
      permissions.map(p => `${p.action}-${p.resource}`)
    );
  }

  can(action: PermissionAction, resource: PermissionResource): boolean {
    return this.permissions.has(`${action}-${resource}`);
  }

  canCreate(resource: PermissionResource): boolean {
    return this.can(PermissionAction.CREATE, resource);
  }

  canRead(resource: PermissionResource): boolean {
    return this.can(PermissionAction.READ, resource);
  }

  canUpdate(resource: PermissionResource): boolean {
    return this.can(PermissionAction.UPDATE, resource);
  }

  canDelete(resource: PermissionResource): boolean {
    return this.can(PermissionAction.DELETE, resource);
  }

  canApprove(resource: PermissionResource): boolean {
    return this.can(PermissionAction.APPROVE, resource);
  }

  canReject(resource: PermissionResource): boolean {
    return this.can(PermissionAction.REJECT, resource);
  }

  canExport(resource: PermissionResource): boolean {
    return this.can(PermissionAction.EXPORT, resource);
  }

  canImport(resource: PermissionResource): boolean {
    return this.can(PermissionAction.IMPORT, resource);
  }
}

/**
 * Hook personalizado para usar permisos en componentes
 */
export function createPermissionChecker(
  permissions: Array<{ action: PermissionAction; resource: PermissionResource }>
): PermissionChecker {
  return new PermissionChecker(permissions);
}

// Constantes para facilitar el uso
export const PERMISSIONS = {
  // Eventos
  CREATE_EVENTS: { action: PermissionAction.CREATE, resource: PermissionResource.EVENTS },
  READ_EVENTS: { action: PermissionAction.READ, resource: PermissionResource.EVENTS },
  UPDATE_EVENTS: { action: PermissionAction.UPDATE, resource: PermissionResource.EVENTS },
  DELETE_EVENTS: { action: PermissionAction.DELETE, resource: PermissionResource.EVENTS },

  // Clientes
  CREATE_CLIENTS: { action: PermissionAction.CREATE, resource: PermissionResource.CLIENTS },
  READ_CLIENTS: { action: PermissionAction.READ, resource: PermissionResource.CLIENTS },
  UPDATE_CLIENTS: { action: PermissionAction.UPDATE, resource: PermissionResource.CLIENTS },
  DELETE_CLIENTS: { action: PermissionAction.DELETE, resource: PermissionResource.CLIENTS },

  // Cotizaciones
  CREATE_QUOTES: { action: PermissionAction.CREATE, resource: PermissionResource.QUOTES },
  READ_QUOTES: { action: PermissionAction.READ, resource: PermissionResource.QUOTES },
  UPDATE_QUOTES: { action: PermissionAction.UPDATE, resource: PermissionResource.QUOTES },
  DELETE_QUOTES: { action: PermissionAction.DELETE, resource: PermissionResource.QUOTES },
  APPROVE_QUOTES: { action: PermissionAction.APPROVE, resource: PermissionResource.QUOTES },
  REJECT_QUOTES: { action: PermissionAction.REJECT, resource: PermissionResource.QUOTES },

  // Usuarios
  CREATE_USERS: { action: PermissionAction.CREATE, resource: PermissionResource.USERS },
  READ_USERS: { action: PermissionAction.READ, resource: PermissionResource.USERS },
  UPDATE_USERS: { action: PermissionAction.UPDATE, resource: PermissionResource.USERS },
  DELETE_USERS: { action: PermissionAction.DELETE, resource: PermissionResource.USERS },

  // Roles
  CREATE_ROLES: { action: PermissionAction.CREATE, resource: PermissionResource.ROLES },
  READ_ROLES: { action: PermissionAction.READ, resource: PermissionResource.ROLES },
  UPDATE_ROLES: { action: PermissionAction.UPDATE, resource: PermissionResource.ROLES },
  DELETE_ROLES: { action: PermissionAction.DELETE, resource: PermissionResource.ROLES },

  // Reportes
  READ_REPORTS: { action: PermissionAction.READ, resource: PermissionResource.REPORTS },
  EXPORT_REPORTS: { action: PermissionAction.EXPORT, resource: PermissionResource.REPORTS },
} as const;