/**
 * CRM Casona María V2.0 - Tipos TypeScript
 * 
 * Tipos del sistema con comentarios detallados
 * para documentación técnica y manuales de desarrollo
 * 
 * @author Manuel Antonio Tut Solorzano
 * @version 2.0.0
 * @date 2025-10-07
 */

import { Prisma } from '@prisma/client';

// ===============================
// ENUMS DEL SISTEMA (DEFINIDOS)
// ===============================

/**
 * Jerarquía de roles del sistema
 * SUPER_ADMIN > TENANT_ADMIN > MANAGER > USER > CLIENT_EXTERNAL
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // Administrador del sistema completo
  TENANT_ADMIN = 'TENANT_ADMIN',   // Administrador del tenant
  MANAGER = 'MANAGER',             // Manager con permisos de aprobación
  USER = 'USER',                   // Usuario básico
  CLIENT_EXTERNAL = 'CLIENT_EXTERNAL' // Cliente externo con acceso limitado (NUEVO)
}

/**
 * Tipos de cliente con comportamientos diferentes de precios
 */
export enum ClientType {
  GENERAL = 'GENERAL',       // Cliente público general
  COLABORADOR = 'COLABORADOR', // Cliente colaborador interno
  EXTERNO = 'EXTERNO'        // Cliente externo con conversión a créditos
}

/**
 * Estados de eventos en el sistema
 */
export enum EventStatus {
  RESERVED = 'RESERVED',     // Fecha separada sin cotización
  QUOTED = 'QUOTED',         // Cotización creada pero no aprobada
  CONFIRMED = 'CONFIRMED',   // Cotización aprobada y evento confirmado
  CANCELLED = 'CANCELLED'    // Evento cancelado
}

/**
 * Estados del flujo de cotizaciones con comentarios y aprobaciones
 */
export enum QuoteStatus {
  DRAFT = 'DRAFT',                     // Borrador del usuario
  PENDING_MANAGER = 'PENDING_MANAGER', // Enviada para aprobación del manager
  REJECTED_BY_MANAGER = 'REJECTED_BY_MANAGER', // Rechazada por manager con comentarios
  APPROVED_BY_MANAGER = 'APPROVED_BY_MANAGER', // Aprobada por manager, lista para envío
  SENT_TO_CLIENT = 'SENT_TO_CLIENT',   // Enviada al cliente con enlaces públicos
  CLIENT_REQUESTED_CHANGES = 'CLIENT_REQUESTED_CHANGES', // Cliente solicitó modificaciones
  ACCEPTED_BY_CLIENT = 'ACCEPTED_BY_CLIENT', // Aceptada por cliente - evento confirmado
  EXPIRED = 'EXPIRED',                 // Vencida por tiempo
  CANCELLED = 'CANCELLED'              // Cancelada
}

/**
 * Tipos de precios configurables por el admin/manager
 */
export enum PriceType {
  GENERAL = 'GENERAL',       // Precio público general
  FRIENDS = 'FRIENDS',       // Precio amigos y familia
  CORPORATE = 'CORPORATE',   // Precio corporativo
  VIP = 'VIP',              // Precio VIP
  CUSTOM = 'CUSTOM'         // Precio personalizado
}

/**
 * Tipos de paquetes predefinidos - SOLO MANAGER puede crear/nombrar
 */
export enum PackageType {
  BASICO = 'BASICO',     // Paquete básico
  VIP = 'VIP',           // Paquete VIP
  GOLD = 'GOLD',         // Paquete Gold
  DIAMANTE = 'DIAMANTE'  // Paquete Diamante
}

/**
 * Tipos de proveedores
 */
export enum SupplierType {
  PRODUCT = 'PRODUCT',   // Proveedor de productos
  SERVICE = 'SERVICE'    // Proveedor de servicios
}

/**
 * Tipos de items para reportes
 */
export enum ItemType {
  CONSUMO = 'CONSUMO',   // Para consumo interno
  VENTA = 'VENTA'        // Para venta al cliente
}

/**
 * Tipos de comentarios para separar internos de externos
 */
export enum CommentType {
  INTERNAL_MANAGER = 'INTERNAL_MANAGER', // Comentario interno del manager
  CLIENT_FEEDBACK = 'CLIENT_FEEDBACK',   // Comentario del cliente
  SYSTEM_NOTE = 'SYSTEM_NOTE'           // Nota del sistema
}

// ===============================
// TIPOS DE ROLES Y PERMISOS
// ===============================

/**
 * Jerarquía de roles del sistema
 * SUPER_ADMIN > TENANT_ADMIN > MANAGER > USER > CLIENT_EXTERNAL
 */
// Nota: UserRole y ClientType se importan de @prisma/client, no se reexportan aquí

/**
 * Permisos específicos por funcionalidad
 * Define qué roles pueden realizar cada acción
 */
export interface PermissionMatrix {
  identities: {
    view: string[]      // Ver identidades de negocio
    create: string[]    // Crear nuevas identidades (máx. 5)
    edit: string[]      // Modificar identidades existentes
    delete: string[]    // Eliminar identidades
  }
  locations: {
    view: string[]
    create: string[]    // Crear locales (ligados a identidad 1:1)
    edit: string[]
    delete: string[]
  }
  packageTemplates: {
    view: string[]
    create: string[]    // SOLO MANAGER+ puede crear paquetes predefinidos
    edit: string[]      // SOLO MANAGER+ puede nombrar y modificar
    delete: string[]
  }
  clients: {
    viewAll: string[]   // Ver todos los clientes
    viewOwn: string[]   // Ver solo clientes propios
    create: string[]    // Crear nuevos clientes
    edit: string[]      // Modificar datos de clientes
    delete: string[]    // Eliminar clientes
    manageTypes: string[] // Gestionar tipos de cliente (GENERAL/COLABORADOR/EXTERNO)
  }
  quotes: {
    create: string[]    // Crear cotizaciones
    approve: string[]   // Aprobar cotizaciones (MANAGER+)
    viewAll: string[]   // Ver todas las cotizaciones
    viewOwn: string[]   // Ver cotizaciones propias
    sendToClient: string[] // Enviar cotizaciones a clientes
  }
}

// ===============================
// TIPOS DE CLIENTES
// ===============================

/**
 * Tipos de cliente con comportamientos diferentes
 * Nota: ClientType se importa directamente de @prisma/client
 */

/**
 * Cliente con información completa incluyendo relaciones
 */
export type ClientWithRelations = Prisma.ClientGetPayload<{
  include: {
    priceList: true
    user: true      // Solo si es CLIENT_EXTERNAL
    events: {
      include: {
        room: {
          include: {
            location: {
              include: {
                businessIdentity: true
              }
            }
          }
        }
      }
    }
    quotes: {
      include: {
        packages: {
          include: {
            packageItems: {
              include: {
                product: true
                service: true
              }
            }
          }
        }
      }
    }
    clientCredits: true  // Solo para EXTERNO
    loyaltyPoints: true  // Solo para GENERAL
  }
}>

/**
 * Datos para crear un nuevo cliente
 * Incluye validaciones específicas por tipo
 */
export interface CreateClientData {
  name: string
  email: string
  phone?: string
  address?: string
  type: ClientType
  discountPercent?: number  // 0-100%, requerido para COLABORADOR y EXTERNO
  priceListId?: string     // Lista de precios asignada
  freeEventsTarget?: number // Solo para COLABORADOR
  notes?: string
}

/**
 * Configuración de descuentos por tipo de cliente
 */
export interface ClientDiscountConfig {
  type: ClientType
  discountPercent: number
  convertToCredits: boolean  // true solo para EXTERNO
  affectsPriceList: boolean  // true para COLABORADOR
}

// ===============================
// SISTEMA DE PRECIOS
// ===============================

/**
 * Relación compleja Sala-Turno-Precio
 * Un precio se determina por la combinación de sala, turno y lista de precios
 */
export type RoomPricingWithRelations = Prisma.RoomPricingGetPayload<{
  include: {
    room: {
      include: {
        location: {
          include: {
            businessIdentity: true
          }
        }
      }
    }
    workShift: true
    priceList: true
  }
}>

/**
 * Configuración de precio para una sala en un turno específico
 */
export interface RoomPriceConfig {
  roomId: string
  workShiftId: string
  priceListId: string
  price: number
}

/**
 * Resultado del cálculo de precios dinámico
 */
export interface PriceCalculationResult {
  roomPrice: number        // Precio base de sala+turno
  itemsSubtotal: number   // Subtotal de productos/servicios
  discount: number        // Descuento aplicado
  creditsEarned?: number  // Créditos ganados (solo EXTERNO)
  subtotal: number        // Subtotal antes de descuento
  total: number          // Total final
  appliedPriceList: string // ID de lista de precios usada
}

// ===============================
// PAQUETES PREDEFINIDOS
// ===============================

/**
 * Paquete predefinido con todos sus componentes
 * SOLO MANAGER+ puede crear y nombrar estos paquetes
 */
export type PackageTemplateWithItems = Prisma.PackageTemplateGetPayload<{
  include: {
    packageItems: {
      include: {
        product: true
        service: true
      }
    }
    packageUpgrades: true
  }
}>

/**
 * Datos para crear un paquete predefinido
 * Restringido a roles MANAGER+
 */
export interface CreatePackageTemplateData {
  name: string           // Nombre del paquete (ej: "Paquete VIP Sala Principal")
  description?: string   // Descripción detallada
  type: PackageType     // BASICO, VIP, GOLD, DIAMANTE
  basePrice?: number    // Precio base (opcional por inflación)
  items: {
    productId?: string
    serviceId?: string
    quantity: number
    description?: string
  }[]
  upgrades?: {
    name: string
    description: string
    additionalPrice: number
    upgradeType: PackageType
  }[]
}

/**
 * Upgrade de paquete (BASICO → VIP → GOLD → DIAMANTE)
 */
export type PackageUpgradeWithTemplate = Prisma.PackageUpgradeGetPayload<{
  include: {
    packageTemplate: true
  }
}>

// ===============================
// PROVEEDORES
// ===============================

/**
 * Proveedor con sus productos o servicios
 * TODO: Verificar modelo Supplier en Prisma schema
 */
export type SupplierWithItems = any; /* Prisma.SupplierGetPayload<{
  include: {
    supplierProducts: {
      include: {
        product: true
      }
    }
    supplierServices: {
      include: {
        service: true
      }
    }
  }
}> */

/**
 * Comparación de proveedores para un producto específico
 */
export interface SupplierComparison {
  productId: string
  productName: string
  suppliers: {
    supplierId: string
    supplierName: string
    cost: number
    deliveryDays: number
    totalDeliveryDate: Date  // Calculado: hoy + deliveryDays
    minQuantity?: number
  }[]
}

// ===============================
// IDENTIDADES Y LOCALES
// ===============================

/**
 * Identidad comercial con sus locales
 * Máximo 5 identidades por tenant
 */
export type BusinessIdentityWithLocations = Prisma.BusinessIdentityGetPayload<{
  include: {
    locations: {
      include: {
        rooms: true
      }
    }
    quoteTemplates: true
  }
}>

/**
 * Local con sus salas y configuración de precios
 */
export type LocationWithRooms = Prisma.LocationGetPayload<{
  include: {
    businessIdentity: true
    rooms: {
      include: {
        roomPricing: {
          include: {
            workShift: true,
            priceList: true
          }
        },
        events: true
      }
    }
  }
}>

// ===============================
// COTIZACIONES AVANZADAS
// ===============================

/**
 * Cotización completa con todos sus componentes
 */
export type QuoteWithFullRelations = Prisma.QuoteGetPayload<{
  include: {
    client: {
      include: {
        priceList: true,
        user: true
      }
    }
    event: {
      include: {
        room: {
          include: {
            location: {
              include: {
                businessIdentity: true
              }
            }
          }
        }
      }
    }
    packages: {
      include: {
        packageTemplate: true
        packageItems: {
          include: {
            product: true
            service: true
          }
        }
      }
    }
    comments: {
      include: {
        user: true
      }
      orderBy: {
        createdAt: 'desc'
      }
    }
    clientCredits: true
  }
}>

/**
 * Datos para crear una nueva cotización
 */
export interface CreateQuoteData {
  clientId: string
  eventId?: string
  packages: {
    packageTemplateId?: string
    name: string
    items: {
      productId?: string
      serviceId?: string
      quantity: number
      unitPrice: number
      description?: string
    }[]
  }[]
  notes?: string
  validDays?: number  // Días de validez (default: 30)
}

// ===============================
// USUARIOS EXTERNOS RESTRINGIDOS
// ===============================

/**
 * Usuario externo con acceso limitado
 * Solo puede ver sus propios datos y crear eventos
 */
export interface ExternalUserDashboard {
  user: {
    id: string
    name: string
    email: string
  }
  client: {
    id: string
    name: string
    type: ClientType
    totalCredits: number
  }
  creditHistory: {
    id: string
    amount: number
    description: string
    type: 'EARNED' | 'USED'
    createdAt: Date
    quote?: {
      quoteNumber: string
      total: number
    }
  }[]
  upcomingEvents: {
    id: string
    title: string
    startDate: Date
    room: {
      name: string
      location: {
        name: string
        businessIdentity: {
          name: string
        }
      }
    }
  }[]
}

// ===============================
// PLANTILLAS DE COTIZACIÓN
// ===============================

/**
 * Variables disponibles en plantillas de cotización
 */
export interface QuoteTemplateVariables {
  // Variables del cliente
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientAddress?: string
  
  // Variables del evento
  eventTitle: string
  eventDate: string
  eventTime: string
  roomName: string
  locationName: string
  
  // Variables de la cotización
  quoteNumber: string
  subtotal: string
  discount: string
  total: string
  validUntil: string
  
  // Variables de la identidad
  businessName: string
  businessPhone?: string
  businessEmail?: string
  businessAddress?: string
  businessLogo?: string
  businessSlogan?: string
  
  // Variables de paquetes (array)
  packages: {
    name: string
    description?: string
    items: {
      name: string
      quantity: number
      unitPrice: string
      totalPrice: string
    }[]
    subtotal: string
  }[]
}

// ===============================
// DASHBOARDS Y REPORTES
// ===============================

/**
 * Estadísticas del dashboard multi-identidad
 */
export interface DashboardStats {
  identity: {
    id: string
    name: string
  }
  period: {
    start: Date
    end: Date
  }
  stats: {
    totalEvents: number
    confirmedEvents: number
    pendingQuotes: number
    totalRevenue: number
    newClients: number
    occupancyRate: number
    topRoom: {
      name: string
      eventsCount: number
    }
    clientTypes: {
      general: number
      colaborador: number
      externo: number
    }
  }
}

/**
 * Filtros disponibles en el dashboard
 */
export interface DashboardFilters {
  identityId?: string    // Filtrar por identidad específica
  locationId?: string    // Filtrar por local específico
  roomId?: string       // Filtrar por sala específica
  clientType?: ClientType // Filtrar por tipo de cliente
  dateRange: {
    start: Date
    end: Date
  }
}

// ===============================
// EXPORTACIONES PRINCIPALES
// ===============================

// Tipos utilitarios para formularios
export type FormCreateClient = Omit<CreateClientData, 'id'>
export type FormUpdateClient = Partial<CreateClientData> & { id: string }
export type FormCreateQuote = Omit<CreateQuoteData, 'id'>

// Tipos para APIs
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}