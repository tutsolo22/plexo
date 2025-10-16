// =========================================================================
// SERVICIO DE GESTIÓN DE ROLES FLEXIBLES
// =========================================================================
// Este servicio maneja toda la lógica de negocio para el sistema de roles
// flexibles, incluyendo CRUD de roles, asignación de usuarios y permisos.
// =========================================================================

import { PrismaClient, Role, UserRole, Permission, RoleType, PermissionAction, PermissionResource } from '@prisma/client'
import { prisma } from './prisma'

// =========================================================================
// TIPOS E INTERFACES
// =========================================================================

export interface CreateRoleInput {
  name: string
  type: RoleType
  description?: string
  tenantId?: string
  permissions: {
    action: PermissionAction
    resource: PermissionResource
    conditions?: Record<string, any>
  }[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  isActive?: boolean
  permissions?: {
    action: PermissionAction
    resource: PermissionResource
    conditions?: Record<string, any>
  }[]
}

export interface AssignRoleInput {
  userId: string
  roleId: string
  tenantId?: string
  assignedBy?: string
  expiresAt?: Date
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
  userRoles: UserRole[]
  _count: {
    userRoles: number
    permissions: number
  }
}

export interface UserWithRoles {
  id: string
  email: string
  name: string | null
  userRoles: (UserRole & {
    role: Role & {
      permissions: Permission[]
    }
  })[]
}

// =========================================================================
// CLASE PRINCIPAL DEL SERVICIO
// =========================================================================

export class RoleManagementService {
  
  // ===================================================================
  // GESTIÓN DE ROLES - CRUD OPERATIONS
  // ===================================================================

  /**
   * Crear un nuevo rol con permisos
   */
  async createRole(input: CreateRoleInput): Promise<RoleWithPermissions> {
    try {
      const role = await prisma.$transaction(async (tx) => {
        // Crear el rol
        const newRole = await tx.role.create({
          data: {
            name: input.name,
            type: input.type,
            description: input.description,
            tenantId: input.tenantId,
          },
        })

        // Crear los permisos asociados
        const permissions = await Promise.all(
          input.permissions.map(permission =>
            tx.permission.create({
              data: {
                roleId: newRole.id,
                action: permission.action,
                resource: permission.resource,
                conditions: permission.conditions || null,
              },
            })
          )
        )

        return {
          ...newRole,
          permissions,
        }
      })

      // Retornar el rol completo con todas las relaciones
      return this.getRoleById(role.id)
    } catch (error) {
      console.error('Error creando rol:', error)
      throw new Error(`No se pudo crear el rol: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Obtener rol por ID con todas sus relaciones
   */
  async getRoleById(roleId: string): Promise<RoleWithPermissions> {
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: true,
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
          _count: {
            select: {
              userRoles: true,
              permissions: true,
            }
          }
        },
      })

      if (!role) {
        throw new Error('Rol no encontrado')
      }

      return role as RoleWithPermissions
    } catch (error) {
      console.error('Error obteniendo rol:', error)
      throw new Error(`No se pudo obtener el rol: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Listar todos los roles con filtros opcionales
   */
  async listRoles(filters?: {
    tenantId?: string
    type?: RoleType
    isActive?: boolean
    includeGlobal?: boolean
  }): Promise<RoleWithPermissions[]> {
    try {
      const where: any = {}

      if (filters?.tenantId) {
        where.OR = [
          { tenantId: filters.tenantId },
          ...(filters.includeGlobal ? [{ tenantId: null }] : [])
        ]
      } else if (filters?.includeGlobal === false) {
        where.tenantId = { not: null }
      }

      if (filters?.type) {
        where.type = filters.type
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      const roles = await prisma.role.findMany({
        where,
        include: {
          permissions: true,
          userRoles: true,
          _count: {
            select: {
              userRoles: true,
              permissions: true,
            }
          }
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ]
      })

      return roles as RoleWithPermissions[]
    } catch (error) {
      console.error('Error listando roles:', error)
      throw new Error(`No se pudo obtener la lista de roles: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Actualizar un rol existente
   */
  async updateRole(roleId: string, input: UpdateRoleInput): Promise<RoleWithPermissions> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Actualizar datos básicos del rol
        const updatedRole = await tx.role.update({
          where: { id: roleId },
          data: {
            name: input.name,
            description: input.description,
            isActive: input.isActive,
            updatedAt: new Date(),
          },
        })

        // Si se proporcionan permisos, reemplazar todos
        if (input.permissions) {
          // Eliminar permisos existentes
          await tx.permission.deleteMany({
            where: { roleId },
          })

          // Crear nuevos permisos
          await Promise.all(
            input.permissions.map(permission =>
              tx.permission.create({
                data: {
                  roleId,
                  action: permission.action,
                  resource: permission.resource,
                  conditions: permission.conditions || null,
                },
              })
            )
          )
        }

        return updatedRole
      })

      return this.getRoleById(result.id)
    } catch (error) {
      console.error('Error actualizando rol:', error)
      throw new Error(`No se pudo actualizar el rol: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Eliminar un rol (soft delete)
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Verificar que el rol no tenga usuarios asignados activos
        const activeAssignments = await tx.userRole.count({
          where: {
            roleId,
            isActive: true,
          },
        })

        if (activeAssignments > 0) {
          throw new Error('No se puede eliminar un rol que tiene usuarios asignados activamente')
        }

        // Soft delete del rol
        await tx.role.update({
          where: { id: roleId },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        })

        // Desactivar todas las asignaciones de este rol
        await tx.userRole.updateMany({
          where: { roleId },
          data: { isActive: false },
        })
      })
    } catch (error) {
      console.error('Error eliminando rol:', error)
      throw new Error(`No se pudo eliminar el rol: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  // ===================================================================
  // GESTIÓN DE ASIGNACIÓN DE ROLES A USUARIOS
  // ===================================================================

  /**
   * Asignar un rol a un usuario
   */
  async assignRole(input: AssignRoleInput): Promise<UserRole> {
    try {
      // Verificar que el rol existe y está activo
      const role = await prisma.role.findFirst({
        where: {
          id: input.roleId,
          isActive: true,
        },
      })

      if (!role) {
        throw new Error('El rol especificado no existe o no está activo')
      }

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      })

      if (!user) {
        throw new Error('El usuario especificado no existe')
      }

      // Verificar si ya existe la asignación
      const existingAssignment = await prisma.userRole.findFirst({
        where: {
          userId: input.userId,
          roleId: input.roleId,
          tenantId: input.tenantId,
          isActive: true,
        },
      })

      if (existingAssignment) {
        throw new Error('El usuario ya tiene asignado este rol')
      }

      // Crear la asignación
      const userRole = await prisma.userRole.create({
        data: {
          userId: input.userId,
          roleId: input.roleId,
          tenantId: input.tenantId,
          assignedBy: input.assignedBy,
          expiresAt: input.expiresAt,
        },
        include: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      })

      return userRole
    } catch (error) {
      console.error('Error asignando rol:', error)
      throw new Error(`No se pudo asignar el rol: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Remover un rol de un usuario
   */
  async unassignRole(userId: string, roleId: string, tenantId?: string): Promise<void> {
    try {
      const assignment = await prisma.userRole.findFirst({
        where: {
          userId,
          roleId,
          tenantId,
          isActive: true,
        },
      })

      if (!assignment) {
        throw new Error('La asignación de rol no existe o ya está inactiva')
      }

      await prisma.userRole.update({
        where: { id: assignment.id },
        data: {
          isActive: false,
        },
      })
    } catch (error) {
      console.error('Error removiendo rol:', error)
      throw new Error(`No se pudo remover el rol: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Obtener roles de un usuario
   */
  async getUserRoles(userId: string, tenantId?: string): Promise<UserWithRoles> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            where: {
              isActive: true,
              ...(tenantId && { tenantId }),
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            },
            include: {
              role: {
                include: {
                  permissions: true,
                }
              }
            }
          }
        }
      })

      if (!user) {
        throw new Error('Usuario no encontrado')
      }

      return user as UserWithRoles
    } catch (error) {
      console.error('Error obteniendo roles de usuario:', error)
      throw new Error(`No se pudo obtener los roles del usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  // ===================================================================
  // GESTIÓN DE PERMISOS
  // ===================================================================

  /**
   * Verificar si un usuario tiene un permiso específico
   */
  async hasPermission(
    userId: string, 
    action: PermissionAction, 
    resource: PermissionResource,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const userWithRoles = await this.getUserRoles(userId, tenantId)
      
      // Verificar permisos en todos los roles activos del usuario
      for (const userRole of userWithRoles.userRoles) {
        const hasPermission = userRole.role.permissions.some(permission => 
          permission.action === action && permission.resource === resource
        )
        
        if (hasPermission) {
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Error verificando permiso:', error)
      return false
    }
  }

  /**
   * Obtener todos los permisos de un usuario
   */
  async getUserPermissions(userId: string, tenantId?: string): Promise<Permission[]> {
    try {
      const userWithRoles = await this.getUserRoles(userId, tenantId)
      
      const allPermissions: Permission[] = []
      
      for (const userRole of userWithRoles.userRoles) {
        allPermissions.push(...userRole.role.permissions)
      }
      
      // Remover duplicados basado en action + resource
      const uniquePermissions = allPermissions.filter((permission, index, self) =>
        index === self.findIndex(p => 
          p.action === permission.action && p.resource === permission.resource
        )
      )
      
      return uniquePermissions
    } catch (error) {
      console.error('Error obteniendo permisos de usuario:', error)
      throw new Error(`No se pudo obtener los permisos del usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
}

// =========================================================================
// INSTANCIA SINGLETON DEL SERVICIO
// =========================================================================

export const roleManagementService = new RoleManagementService()

// =========================================================================
// FUNCIONES DE UTILIDAD
// =========================================================================

/**
 * Obtener permisos por defecto para cada tipo de rol
 */
export function getDefaultPermissions(roleType: RoleType): {
  action: PermissionAction
  resource: PermissionResource
}[] {
  const permissionSets: Record<RoleType, { action: PermissionAction; resource: PermissionResource }[]> = {
    SUPER_ADMIN: [
      // Acceso completo a todo
      { action: 'CREATE', resource: 'USERS' },
      { action: 'READ', resource: 'USERS' },
      { action: 'UPDATE', resource: 'USERS' },
      { action: 'DELETE', resource: 'USERS' },
      { action: 'CREATE', resource: 'CONFIGURATIONS' },
      { action: 'READ', resource: 'CONFIGURATIONS' },
      { action: 'UPDATE', resource: 'CONFIGURATIONS' },
      { action: 'CREATE', resource: 'ROLES' },
      { action: 'READ', resource: 'ROLES' },
      { action: 'UPDATE', resource: 'ROLES' },
      { action: 'DELETE', resource: 'ROLES' },
      { action: 'CREATE', resource: 'CLIENTS' },
      { action: 'READ', resource: 'CLIENTS' },
      { action: 'UPDATE', resource: 'CLIENTS' },
      { action: 'DELETE', resource: 'CLIENTS' },
      { action: 'CREATE', resource: 'EVENTS' },
      { action: 'READ', resource: 'EVENTS' },
      { action: 'UPDATE', resource: 'EVENTS' },
      { action: 'DELETE', resource: 'EVENTS' },
      { action: 'CREATE', resource: 'QUOTES' },
      { action: 'READ', resource: 'QUOTES' },
      { action: 'UPDATE', resource: 'QUOTES' },
      { action: 'DELETE', resource: 'QUOTES' },
      { action: 'APPROVE', resource: 'QUOTES' },
      { action: 'EXPORT', resource: 'REPORTS' },
      { action: 'IMPORT', resource: 'REPORTS' },
    ],
    TENANT_ADMIN: [
      // Administración dentro del tenant
      { action: 'CREATE', resource: 'USERS' },
      { action: 'READ', resource: 'USERS' },
      { action: 'UPDATE', resource: 'USERS' },
      { action: 'CREATE', resource: 'CLIENTS' },
      { action: 'READ', resource: 'CLIENTS' },
      { action: 'UPDATE', resource: 'CLIENTS' },
      { action: 'DELETE', resource: 'CLIENTS' },
      { action: 'CREATE', resource: 'EVENTS' },
      { action: 'READ', resource: 'EVENTS' },
      { action: 'UPDATE', resource: 'EVENTS' },
      { action: 'DELETE', resource: 'EVENTS' },
      { action: 'CREATE', resource: 'QUOTES' },
      { action: 'READ', resource: 'QUOTES' },
      { action: 'UPDATE', resource: 'QUOTES' },
      { action: 'APPROVE', resource: 'QUOTES' },
      { action: 'READ', resource: 'CONFIGURATIONS' },
      { action: 'UPDATE', resource: 'CONFIGURATIONS' },
      { action: 'EXPORT', resource: 'REPORTS' },
    ],
    MANAGER: [
      // Gestión y aprobaciones
      { action: 'READ', resource: 'USERS' },
      { action: 'CREATE', resource: 'CLIENTS' },
      { action: 'READ', resource: 'CLIENTS' },
      { action: 'UPDATE', resource: 'CLIENTS' },
      { action: 'CREATE', resource: 'EVENTS' },
      { action: 'READ', resource: 'EVENTS' },
      { action: 'UPDATE', resource: 'EVENTS' },
      { action: 'CREATE', resource: 'QUOTES' },
      { action: 'READ', resource: 'QUOTES' },
      { action: 'UPDATE', resource: 'QUOTES' },
      { action: 'APPROVE', resource: 'QUOTES' },
      { action: 'READ', resource: 'REPORTS' },
    ],
    USER: [
      // Operaciones básicas
      { action: 'READ', resource: 'CLIENTS' },
      { action: 'CREATE', resource: 'CLIENTS' },
      { action: 'UPDATE', resource: 'CLIENTS' },
      { action: 'READ', resource: 'EVENTS' },
      { action: 'CREATE', resource: 'EVENTS' },
      { action: 'UPDATE', resource: 'EVENTS' },
      { action: 'READ', resource: 'QUOTES' },
      { action: 'CREATE', resource: 'QUOTES' },
      { action: 'UPDATE', resource: 'QUOTES' },
    ],
    CLIENT_EXTERNAL: [
      // Solo acceso a sus propios datos
      { action: 'READ', resource: 'QUOTES' },
      { action: 'READ', resource: 'EVENTS' },
    ],
    SALES: [
      // Enfoque en ventas
      { action: 'CREATE', resource: 'CLIENTS' },
      { action: 'READ', resource: 'CLIENTS' },
      { action: 'UPDATE', resource: 'CLIENTS' },
      { action: 'CREATE', resource: 'QUOTES' },
      { action: 'READ', resource: 'QUOTES' },
      { action: 'UPDATE', resource: 'QUOTES' },
      { action: 'READ', resource: 'PRODUCTS' },
      { action: 'READ', resource: 'SERVICES' },
    ],
    COORDINATOR: [
      // Coordinación de eventos
      { action: 'READ', resource: 'CLIENTS' },
      { action: 'CREATE', resource: 'EVENTS' },
      { action: 'READ', resource: 'EVENTS' },
      { action: 'UPDATE', resource: 'EVENTS' },
      { action: 'READ', resource: 'QUOTES' },
      { action: 'READ', resource: 'VENUES' },
      { action: 'READ', resource: 'SERVICES' },
    ],
    FINANCE: [
      // Gestión financiera
      { action: 'READ', resource: 'CLIENTS' },
      { action: 'READ', resource: 'QUOTES' },
      { action: 'READ', resource: 'EVENTS' },
      { action: 'EXPORT', resource: 'REPORTS' },
      { action: 'READ', resource: 'PRODUCTS' },
      { action: 'READ', resource: 'SERVICES' },
    ],
  }

  return permissionSets[roleType] || []
}