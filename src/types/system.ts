/**
 * CRM Casona María V2.0 - Tipos Básicos
 * 
 * Definiciones de tipos fundamentales para el sistema
 * Documentación completa para manuales técnicos
 * 
 * @author Manuel Antonio Tut Solorzano
 * @version 2.0.0
 * @date 2025-10-07
 */

// ===============================
// ROLES Y PERMISOS
// ===============================

/**
 * Jerarquía de roles del sistema
 * SUPER_ADMIN > TENANT_ADMIN > MANAGER > USER > CLIENT_EXTERNAL
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // Administrador del sistema completo
  TENANT_ADMIN = 'TENANT_ADMIN',   // Administrador del tenant
  MANAGER = 'MANAGER',             // Manager con permisos de aprobación - ÚNICO que puede crear paquetes
  USER = 'USER',                   // Usuario básico
  CLIENT_EXTERNAL = 'CLIENT_EXTERNAL' // Cliente externo con acceso limitado
}

/**
 * Tipos de cliente con diferentes comportamientos de pricing
 */
export enum ClientType {
  GENERAL = 'GENERAL',       // Cliente público general
  COLABORADOR = 'COLABORADOR', // Cliente colaborador interno con contador de eventos
  EXTERNO = 'EXTERNO'        // Cliente externo con conversión descuento→créditos
}

/**
 * Estados de eventos
 */
export enum EventStatus {
  RESERVED = 'RESERVED',     // Fecha separada sin cotización
  QUOTED = 'QUOTED',         // Cotización creada pero no aprobada
  CONFIRMED = 'CONFIRMED',   // Cotización aprobada y evento confirmado
  CANCELLED = 'CANCELLED'    // Evento cancelado
}

/**
 * Estados del flujo de cotizaciones
 */
export enum QuoteStatus {
  DRAFT = 'DRAFT',                     // Borrador del usuario
  PENDING_MANAGER = 'PENDING_MANAGER', // Para aprobación del manager
  REJECTED_BY_MANAGER = 'REJECTED_BY_MANAGER', // Rechazada con comentarios
  APPROVED_BY_MANAGER = 'APPROVED_BY_MANAGER', // Aprobada por manager
  SENT_TO_CLIENT = 'SENT_TO_CLIENT',   // Enviada al cliente
  CLIENT_REQUESTED_CHANGES = 'CLIENT_REQUESTED_CHANGES', // Cliente pidió cambios
  ACCEPTED_BY_CLIENT = 'ACCEPTED_BY_CLIENT', // Aceptada por cliente
  EXPIRED = 'EXPIRED',                 // Vencida por tiempo
  CANCELLED = 'CANCELLED'              // Cancelada
}

/**
 * Tipos de paquetes - SOLO MANAGER puede crear y nombrar
 */
export enum PackageType {
  BASICO = 'BASICO',     // Paquete básico
  VIP = 'VIP',           // Paquete VIP
  GOLD = 'GOLD',         // Paquete Gold
  DIAMANTE = 'DIAMANTE'  // Paquete Diamante
}

// ===============================
// INTERFACES DE NEGOCIO
// ===============================

/**
 * Configuración de permisos por módulo
 */
export interface PermissionMatrix {
  // Solo MANAGER+ puede crear paquetes predefinidos
  packageTemplates: {
    create: UserRole.MANAGER | UserRole.TENANT_ADMIN
    edit: UserRole.MANAGER | UserRole.TENANT_ADMIN
    delete: UserRole.TENANT_ADMIN
  }
  
  // Gestión de identidades (máximo 5)
  identities: {
    create: UserRole.TENANT_ADMIN | UserRole.MANAGER
    edit: UserRole.TENANT_ADMIN | UserRole.MANAGER
    delete: UserRole.TENANT_ADMIN
  }
  
  // Gestión de clientes con tipos especiales
  clients: {
    create: UserRole.MANAGER | UserRole.USER
    manageTypes: UserRole.MANAGER | UserRole.TENANT_ADMIN
    createExternal: UserRole.MANAGER // Solo manager puede crear clientes externos
  }
}

/**
 * Datos para crear cliente con tipo específico
 */
export interface CreateClientData {
  name: string
  email: string
  phone?: string
  address?: string
  type: ClientType
  discountPercent?: number  // Requerido para COLABORADOR y EXTERNO
  priceListId?: string     // Lista de precios asignada
  freeEventsTarget?: number // Solo para COLABORADOR (meta eventos gratis)
  notes?: string
}

/**
 * Configuración de descuentos por tipo de cliente
 */
export interface ClientDiscountConfig {
  type: ClientType
  discountPercent: number
  convertToCredits: boolean  // true SOLO para EXTERNO
  affectsPriceList: boolean  // true para COLABORADOR
}

/**
 * Datos para crear paquete predefinido - RESTRINGIDO A MANAGER+
 */
export interface CreatePackageTemplateData {
  name: string           // Nombre asignado por MANAGER
  description?: string   
  type: PackageType     
  basePrice?: number    // Opcional por inflación
  items: {
    productId?: string
    serviceId?: string
    quantity: number
    description?: string
  }[]
}

/**
 * Dashboard para cliente externo (acceso restringido)
 */
export interface ExternalClientDashboard {
  clientInfo: {
    name: string
    totalCredits: number
  }
  creditHistory: {
    amount: number
    description: string
    type: 'EARNED' | 'USED'
    date: Date
  }[]
  upcomingEvents: {
    title: string
    date: Date
    location: string
  }[]
}

/**
 * Resultado del cálculo de precios dinámicos
 */
export interface PriceCalculationResult {
  roomPrice: number        // Precio sala + turno
  itemsSubtotal: number   // Productos/servicios
  discount: number        // Descuento aplicado
  creditsEarned?: number  // Solo para EXTERNO
  total: number          
  appliedPriceList: string
}

// ===============================
// TIPOS PARA APIS
// ===============================

/**
 * Respuesta estándar de API
 */
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Respuesta paginada
 */
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Filtros del dashboard multi-identidad
 */
export interface DashboardFilters {
  identityId?: string    // Filtrar por identidad específica
  locationId?: string    // Filtrar por local específico
  clientType?: ClientType
  dateRange: {
    start: Date
    end: Date
  }
}

// ===============================
// CONSTANTES DEL SISTEMA
// ===============================

/**
 * Límites del sistema
 */
export const SYSTEM_LIMITS = {
  MAX_IDENTITIES_PER_TENANT: 5,  // Máximo 5 identidades por tenant
  DEFAULT_QUOTE_VALIDITY_DAYS: 30, // Validez por defecto de cotizaciones
  MAX_DISCOUNT_PERCENT: 100,      // Descuento máximo permitido
  CREDITS_TO_PESOS_RATIO: 1       // 1 peso = 1 crédito
} as const

/**
 * Roles que pueden crear paquetes predefinidos
 */
export const PACKAGE_CREATION_ROLES = [
  UserRole.MANAGER,
  UserRole.TENANT_ADMIN
] as const

/**
 * Roles que pueden gestionar identidades
 */
export const IDENTITY_MANAGEMENT_ROLES = [
  UserRole.TENANT_ADMIN,
  UserRole.MANAGER
] as const