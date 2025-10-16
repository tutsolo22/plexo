import { UserRole } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from './config'

/**
 * Sistema de permisos y roles para CRM Casona María
 * 
 * Jerarquía implementada:
 * SUPER_ADMIN > TENANT_ADMIN > MANAGER > USER
 */

/**
 * Jerarquía numérica de roles para comparaciones
 */
const ROLE_HIERARCHY = {
  [UserRole.CLIENT_EXTERNAL]: 0,
  [UserRole.USER]: 1,
  [UserRole.MANAGER]: 2,
  [UserRole.TENANT_ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4
}

/**
 * Verifica si un rol tiene suficiente jerarquía
 * @param userRole - Rol del usuario
 * @param requiredRole - Rol mínimo requerido
 * @returns boolean - true si tiene permisos
 */
export const hasRoleAccess = (
  userRole: UserRole, 
  requiredRole: UserRole
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Obtiene la sesión actual del servidor
 * @returns Promise<Session | null>
 */
export const getCurrentSession = async () => {
  return await getServerSession(authOptions)
}

/**
 * Verifica si el usuario actual tiene el rol requerido
 * @param requiredRole - Rol mínimo requerido
 * @returns Promise<boolean>
 */
export const checkUserRole = async (requiredRole: UserRole): Promise<boolean> => {
  const session = await getCurrentSession()
  
  if (!session?.user?.role) {
    return false
  }
  
  return hasRoleAccess(session.user.role as UserRole, requiredRole)
}

/**
 * Definición de permisos específicos por funcionalidad
 */
export interface UserPermissions {
  // Gestión de clientes
  clients: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    viewAll: boolean
  }
  
  // Sistema de cotizaciones
  quotes: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    approve: boolean
    editPrices: boolean
    sendToClient: boolean
    viewAll: boolean
  }
  
  // Gestión de eventos
  events: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    confirm: boolean
    cancel: boolean
    viewAll: boolean
  }
  
  // Productos y servicios
  products: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    managePrices: boolean
  }
  
  // Administración
  admin: {
    manageUsers: boolean
    manageRoles: boolean
    manageSettings: boolean
    manageTenant: boolean
    viewAuditLogs: boolean
    manageEmailConfig: boolean
  }
  
  // Reportes
  reports: {
    viewOwn: boolean
    viewAll: boolean
    export: boolean
  }
}

/**
 * Obtiene los permisos completos según el rol del usuario
 * @param userRole - Rol del usuario
 * @returns UserPermissions - Objeto con todos los permisos
 */
export const getUserPermissions = (userRole: UserRole): UserPermissions => {
  const basePermissions: UserPermissions = {
    clients: { create: false, read: false, update: false, delete: false, viewAll: false },
    quotes: { create: false, read: false, update: false, delete: false, approve: false, editPrices: false, sendToClient: false, viewAll: false },
    events: { create: false, read: false, update: false, delete: false, confirm: false, cancel: false, viewAll: false },
    products: { create: false, read: false, update: false, delete: false, managePrices: false },
    admin: { manageUsers: false, manageRoles: false, manageSettings: false, manageTenant: false, viewAuditLogs: false, manageEmailConfig: false },
    reports: { viewOwn: false, viewAll: false, export: false }
  }

  switch (userRole) {
    case UserRole.SUPER_ADMIN:
      // SUPER_ADMIN: Acceso total al sistema
      return {
        clients: { create: true, read: true, update: true, delete: true, viewAll: true },
        quotes: { create: true, read: true, update: true, delete: true, approve: true, editPrices: true, sendToClient: true, viewAll: true },
        events: { create: true, read: true, update: true, delete: true, confirm: true, cancel: true, viewAll: true },
        products: { create: true, read: true, update: true, delete: true, managePrices: true },
        admin: { manageUsers: true, manageRoles: true, manageSettings: true, manageTenant: true, viewAuditLogs: true, manageEmailConfig: true },
        reports: { viewOwn: true, viewAll: true, export: true }
      }

    case UserRole.TENANT_ADMIN:
      // TENANT_ADMIN: Administrador del tenant (casi todo excepto gestión de tenants)
      return {
        clients: { create: true, read: true, update: true, delete: true, viewAll: true },
        quotes: { create: true, read: true, update: true, delete: true, approve: true, editPrices: true, sendToClient: true, viewAll: true },
        events: { create: true, read: true, update: true, delete: true, confirm: true, cancel: true, viewAll: true },
        products: { create: true, read: true, update: true, delete: true, managePrices: true },
        admin: { manageUsers: true, manageRoles: true, manageSettings: true, manageTenant: false, viewAuditLogs: true, manageEmailConfig: true },
        reports: { viewOwn: true, viewAll: true, export: true }
      }

    case UserRole.MANAGER:
      // MANAGER: Enfocado en aprobaciones y configuración operativa
      return {
        clients: { create: true, read: true, update: true, delete: false, viewAll: true },
        quotes: { create: true, read: true, update: true, delete: false, approve: true, editPrices: true, sendToClient: true, viewAll: true },
        events: { create: true, read: true, update: true, delete: false, confirm: true, cancel: true, viewAll: true },
        products: { create: true, read: true, update: true, delete: false, managePrices: true },
        admin: { manageUsers: false, manageRoles: false, manageSettings: true, manageTenant: false, viewAuditLogs: true, manageEmailConfig: false },
        reports: { viewOwn: true, viewAll: true, export: true }
      }

    case UserRole.USER:
      // USER: Permisos básicos para operación diaria
      return {
        clients: { create: true, read: true, update: true, delete: false, viewAll: false },
        quotes: { create: true, read: true, update: true, delete: false, approve: false, editPrices: false, sendToClient: false, viewAll: false },
        events: { create: true, read: true, update: true, delete: false, confirm: false, cancel: false, viewAll: false },
        products: { create: false, read: true, update: false, delete: false, managePrices: false },
        admin: { manageUsers: false, manageRoles: false, manageSettings: false, manageTenant: false, viewAuditLogs: false, manageEmailConfig: false },
        reports: { viewOwn: true, viewAll: false, export: false }
      }

    default:
      return basePermissions
  }
}

/**
 * Hook para verificar permisos específicos
 * @param permission - Permiso a verificar (ej: 'quotes.approve')
 * @param userRole - Rol del usuario
 * @returns boolean - true si tiene el permiso
 */
export const hasPermission = (
  permission: string, 
  userRole: UserRole
): boolean => {
  const permissions = getUserPermissions(userRole)
  const [module, action] = permission.split('.')
  
  // Navegar por el objeto de permisos usando la notación de puntos
  const modulePermissions = permissions[module as keyof UserPermissions]
  if (!modulePermissions || typeof modulePermissions !== 'object') {
    return false
  }
  
  // Type-safe access to module permissions
  const typedPermissions = modulePermissions as Record<string, boolean>
  return typedPermissions[action] === true
}

/**
 * Middleware para proteger rutas con roles
 * @param requiredRole - Rol mínimo requerido
 * @returns Function - Middleware de protección
 * TODO: Implementar cuando se definan los tipos correctos de middleware
 */
export const requireRole = (requiredRole: UserRole) => {
  return async () => {
    const session = await getCurrentSession()
    
    if (!session?.user) {
      throw new Error('No autorizado')
    }
    
    if (!hasRoleAccess(session.user.role as UserRole, requiredRole)) {
      throw new Error('Permisos insuficientes')
    }
    
    return true
  }
}

/**
 * Verifica si el usuario puede editar precios en una cotización
 * @param userRole - Rol del usuario
 * @param allowPriceEdit - Flag de la cotización que permite editar precios
 * @returns boolean
 */
export const canEditQuotePrices = (
  userRole: UserRole,
  allowPriceEdit: boolean = false
): boolean => {
  // Manager siempre puede editar precios
  if (hasRoleAccess(userRole, UserRole.MANAGER)) {
    return true
  }
  
  // Usuario normal solo si el flag está habilitado
  return userRole === UserRole.USER && allowPriceEdit
}

/**
 * Tipos de TypeScript para sesión extendida
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      role: UserRole
      tenantId: string
      tenantName: string
      emailVerified?: Date | null
    }
  }

  interface User {
    role: UserRole
    tenantId: string
    tenantName: string
    emailVerified?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    tenantId: string
    tenantName: string
    emailVerified?: Date | null
  }
}