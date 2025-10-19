/**
 * Servicio de Gestión de Roles y Permisos
 * Sistema flexible de asignación de roles múltiples por usuario
 */

import { prisma } from '@/lib/prisma';
import { RoleType, PermissionAction, PermissionResource } from '@prisma/client';

// Tipos TypeScript para el servicio
export interface CreateRoleInput {
  name: string;
  description?: string;
  type: RoleType;
  tenantId: string;
  createdById: string;
  permissions: {
    action: PermissionAction;
    resource: PermissionResource;
    conditions?: Record<string, any>;
  }[];
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  assignedById: string;
  isPrimary?: boolean;
  expiresAt?: Date;
}

export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  roles: {
    id: string;
    name: string;
    type: RoleType;
    isPrimary: boolean;
    assignedAt: Date;
    expiresAt: Date | null;
  }[];
  permissions: {
    action: PermissionAction;
    resource: PermissionResource;
    conditions?: Record<string, any>;
  }[];
}

export class RoleManagementService {
  
  /**
   * Crear un nuevo rol en el sistema
   */
  async createRole(input: CreateRoleInput) {
    try {
      const role = await prisma.role.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          type: input.type,
          tenantId: input.tenantId,
          permissions: {
            create: input.permissions.map(p => ({
              action: p.action,
              resource: p.resource,
              ...(p.conditions && { conditions: p.conditions })
            }))
          }
        },
        include: {
          permissions: true
        }
      });

      return {
        success: true,
        data: role,
        message: `Rol "${input.name}" creado exitosamente`
      };

    } catch (error: any) {
      console.error('Error creando rol:', error);
      
      if (error.code === 'P2002') {
        return {
          success: false,
          error: `Ya existe un rol de tipo ${input.type} en este tenant`,
          message: 'Error: Rol duplicado'
        };
      }

      return {
        success: false,
        error: error.message,
        message: 'Error al crear el rol'
      };
    }
  }

  /**
   * Asignar un rol a un usuario
   */
  async assignRole(input: AssignRoleInput) {
    try {
      // Verificar que el rol y usuario existen
      const [role, user] = await Promise.all([
        prisma.role.findUnique({ where: { id: input.roleId } }),
        prisma.user.findUnique({ where: { id: input.userId } })
      ]);

      if (!role || !user) {
        return {
          success: false,
          error: 'Rol o usuario no encontrado',
          message: 'Error: Entidades no válidas'
        };
      }

      // Nota: isPrimary no existe en el modelo UserRole actual, se eliminó la lógica

      const userRole = await prisma.userRole.create({
        data: {
          userId: input.userId,
          roleId: input.roleId,
          assignedBy: input.assignedById,
          ...(input.expiresAt && { expiresAt: input.expiresAt })
        },
        include: {
          role: {
            select: { name: true, type: true }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      });

      return {
        success: true,
        data: userRole,
        message: `Rol "${role.name}" asignado a ${user.name || user.email}`
      };

    } catch (error: any) {
      console.error('Error asignando rol:', error);
      
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'El usuario ya tiene este rol asignado',
          message: 'Error: Rol duplicado'
        };
      }

      return {
        success: false,
        error: error.message,
        message: 'Error al asignar el rol'
      };
    }
  }

  /**
   * Remover un rol de un usuario
   */
  async removeRole(userId: string, roleId: string, removedById: string) {
    try {
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId,
          roleId,
          isActive: true
        },
        include: {
          role: { select: { name: true } },
          user: { select: { name: true, email: true } }
        }
      });

      if (!userRole) {
        return {
          success: false,
          error: 'Asignación de rol no encontrada',
          message: 'Error: Rol no asignado'
        };
      }

      await prisma.userRole.update({
        where: { id: userRole.id },
        data: { isActive: false }
      });

      return {
        success: true,
        message: `Rol "${userRole.role.name}" removido de ${userRole.user.name || userRole.user.email}`
      };

    } catch (error: any) {
      console.error('Error removiendo rol:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error al remover el rol'
      };
    }
  }

  /**
   * Obtener usuario con todos sus roles y permisos
   */
  async getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            where: { 
              isActive: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            },
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });

      if (!user) return null;

      // Consolidar permisos de todos los roles
      const allPermissions = new Map();
      
      user.userRoles.forEach(userRole => {
        userRole.role.permissions.forEach(permission => {
          const key = `${permission.action}-${permission.resource}`;
          allPermissions.set(key, {
            action: permission.action,
            resource: permission.resource,
            conditions: permission.conditions
          });
        });
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        roles: user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          type: ur.role.type,
          isPrimary: true, // TODO: Implementar lógica de rol primario
          assignedAt: ur.assignedAt,
          expiresAt: ur.expiresAt
        })),
        permissions: Array.from(allPermissions.values())
      };

    } catch (error) {
      console.error('Error obteniendo usuario con roles:', error);
      return null;
    }
  }

  /**
   * Verificar si un usuario tiene un permiso específico
   */
  async hasPermission(
    userId: string,
    action: PermissionAction,
    resource: PermissionResource
  ): Promise<boolean> {
    try {
      const userWithRoles = await this.getUserWithRoles(userId);
      
      if (!userWithRoles || !userWithRoles.isActive) {
        return false;
      }

      return userWithRoles.permissions.some(
        p => p.action === action && p.resource === resource
      );

    } catch (error) {
      console.error('Error verificando permiso:', error);
      return false;
    }
  }

  /**
   * Obtener todos los roles disponibles en un tenant
   */
  async getTenantRoles(tenantId: string) {
    try {
      const roles = await prisma.role.findMany({
        where: { 
          tenantId,
          isActive: true
        },
        include: {
          permissions: true,
          _count: {
            select: { userRoles: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: roles
      };

    } catch (error: any) {
      console.error('Error obteniendo roles del tenant:', error);
      return {
        success: false,
        error: error.message,
        message: 'Error al obtener roles'
      };
    }
  }

  /**
   * Inicializar roles del sistema por defecto
   */
  async initializeSystemRoles(tenantId: string, adminUserId: string) {
    const systemRoles = [
      {
        name: 'Super Administrador',
        type: RoleType.SUPER_ADMIN,
        permissions: Object.values(PermissionAction).flatMap(action =>
          Object.values(PermissionResource).map(resource => ({
            action, resource
          }))
        )
      },
      {
        name: 'Administrador de Tenant',
        type: RoleType.TENANT_ADMIN,
        permissions: [
          { action: PermissionAction.CREATE, resource: PermissionResource.USERS },
          { action: PermissionAction.READ, resource: PermissionResource.USERS },
          { action: PermissionAction.UPDATE, resource: PermissionResource.USERS },
          { action: PermissionAction.READ, resource: PermissionResource.REPORTS },
          { action: PermissionAction.CREATE, resource: PermissionResource.ROLES },
          { action: PermissionAction.UPDATE, resource: PermissionResource.ROLES },
        ]
      },
      {
        name: 'Gerente',
        type: RoleType.MANAGER,
        permissions: [
          { action: PermissionAction.APPROVE, resource: PermissionResource.QUOTES },
          { action: PermissionAction.REJECT, resource: PermissionResource.QUOTES },
          { action: PermissionAction.READ, resource: PermissionResource.REPORTS },
          { action: PermissionAction.CREATE, resource: PermissionResource.EVENTS },
          { action: PermissionAction.UPDATE, resource: PermissionResource.EVENTS },
        ]
      },
      {
        name: 'Ejecutivo de Ventas',
        type: RoleType.SALES,
        permissions: [
          { action: PermissionAction.CREATE, resource: PermissionResource.QUOTES },
          { action: PermissionAction.UPDATE, resource: PermissionResource.QUOTES },
          { action: PermissionAction.READ, resource: PermissionResource.CLIENTS },
          { action: PermissionAction.CREATE, resource: PermissionResource.CLIENTS },
          { action: PermissionAction.UPDATE, resource: PermissionResource.CLIENTS },
        ]
      },
      {
        name: 'Coordinador de Eventos',
        type: RoleType.COORDINATOR,
        permissions: [
          { action: PermissionAction.CREATE, resource: PermissionResource.EVENTS },
          { action: PermissionAction.UPDATE, resource: PermissionResource.EVENTS },
          { action: PermissionAction.READ, resource: PermissionResource.VENUES },
          { action: PermissionAction.UPDATE, resource: PermissionResource.VENUES },
        ]
      }
    ];

    const results = [];
    
    for (const roleData of systemRoles) {
      try {
        const result = await this.createRole({
          name: roleData.name,
          type: roleData.type,
          tenantId,
          createdById: adminUserId,
          permissions: roleData.permissions
        });
        results.push(result);
      } catch (error) {
        console.error(`Error creando rol ${roleData.name}:`, error);
      }
    }

    return {
      success: true,
      data: results,
      message: `${results.filter(r => r.success).length} roles del sistema creados`
    };
  }
}

// Instancia singleton del servicio
export const roleManagementService = new RoleManagementService();