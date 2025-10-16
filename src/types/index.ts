// Enums locales que reflejan los de Prisma (hasta que se generen automáticamente)
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN', 
  MANAGER = 'MANAGER',
  USER = 'USER',
  CLIENT_EXTERNAL = 'CLIENT_EXTERNAL'
}

export enum EventStatus {
  RESERVED = 'RESERVED',
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  PENDING_MANAGER = 'PENDING_MANAGER',
  APPROVED = 'APPROVED',
  SENT_TO_CLIENT = 'SENT_TO_CLIENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum PriceType {
  GENERAL = 'GENERAL',
  CORPORATIVO = 'CORPORATIVO',
  FAMILIA_AMIGOS = 'FAMILIA_AMIGOS',
  ESPECIAL = 'ESPECIAL'
}

export enum CommentType {
  GENERAL = 'GENERAL',
  INTERNAL = 'INTERNAL',
  CLIENT_NOTE = 'CLIENT_NOTE'
}

export interface User {
  id: string
  email: string
  name?: string
  phone?: string
  role: UserRole
  isActive: boolean
  emailVerified?: Date
  tenantId: string
}

export interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  tenantId: string
}

export interface Room {
  id: string
  name: string
  capacity?: number
  color: string
  isActive: boolean
  tenantId: string
}

export interface Event {
  id: string
  title: string
  startDate: Date
  endDate: Date
  status: EventStatus
  notes?: string
  tenantId: string
  clientId?: string
  roomId: string
  userId: string
  client?: Client
  room: Room
  user: User
}

export interface Product {
  id: string
  name: string
  description?: string
  category?: string
  isActive: boolean
  tenantId: string
}

export interface Service {
  id: string
  name: string
  description?: string
  category?: string
  isActive: boolean
  tenantId: string
}

export interface Quote {
  id: string
  series: string
  folio: number
  status: QuoteStatus
  subtotal: number
  discount: number
  total: number
  validUntil?: Date
  notes?: string
  tenantId: string
  clientId: string
  userId: string
  eventId?: string
  priceTypeId: string
  client: Client
  user: User
  event?: Event
}

export interface QuoteItem {
  id: string
  quantity: number
  unitPrice: number
  total: number
  description?: string
  quoteId: string
  productId?: string
  serviceId?: string
  product?: Product
  service?: Service
}

export interface Configuration {
  id: string
  key: string
  value: string
  tenantId: string
}

export interface Tenant {
  id: string
  name: string
  subdomain?: string
  isActive: boolean
}

// Form Types
export interface CreateClientForm {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export interface CreateQuoteForm {
  clientId: string
  priceTypeId: string
  eventId?: string
  validUntil?: Date
  notes?: string
  items: {
    productId?: string
    serviceId?: string
    quantity: number
    unitPrice: number
    description?: string
  }[]
}

export interface CreateEventForm {
  title: string
  startDate: Date
  endDate: Date
  roomId: string
  clientId?: string
  notes?: string
}

// Nuevos tipos para el sistema mejorado
export interface PublicQuoteToken {
  id: string
  token: string
  quoteId: string
  clientEmail: string
  action: string
  isActive: boolean
  usedAt?: Date
  expiresAt: Date
}

export interface QuoteComment {
  id: string
  comment: string
  type: 'INTERNAL' | 'CLIENT' | 'SYSTEM'
  isVisible: boolean
  quoteId: string
  userId?: string
  clientEmail?: string
  user?: User
  createdAt: Date
}

export interface PendingTask {
  id: string
  type: string
  title: string
  description?: string
  entityType: string
  entityId: string
  priority: number
  isRead: boolean
  isCompleted: boolean
  completedAt?: Date
  userId: string
  user: User
  createdAt: Date
}

export interface WorkingSchedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
  priceModifier: number
  name?: string
  tenantId: string
}

export interface EmailConfiguration {
  id: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  fromName: string
  fromEmail: string
  isActive: boolean
  tenantId: string
}

// Tipos para reglas de negocio específicas
export interface ClientCreationContext {
  source: 'CLIENT_PANEL' | 'QUOTE_CREATION' | 'CALENDAR_EVENT'
  requiresQuote?: boolean
  requiresEvent?: boolean
  eventId?: string
  quoteId?: string
}

export interface QuoteApprovalFlow {
  status: QuoteStatus
  canEditPrices: boolean
  managerComments: string[]
  clientComments: string[]
  nextAction: 'APPROVE' | 'REJECT' | 'MODIFY' | 'SEND' | 'WAIT_CLIENT'
}

export interface ManagerPermissions {
  canApproveQuotes: boolean
  canEditPrices: boolean
  canManageProducts: boolean
  canManageRooms: boolean
  canManageUsers: boolean
  canViewAllQuotes: boolean
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Tipos para páginas públicas del cliente
export interface PublicQuoteView {
  quote: Quote
  client: Client
  items: QuoteItem[]
  event?: Event
  room?: Room
  comments: QuoteComment[]
  canModify: boolean
  canAccept: boolean
}

export interface ClientFeedbackForm {
  quoteId: string
  clientEmail: string
  comment: string
  action: 'ACCEPT' | 'REQUEST_CHANGES'
}