import { z } from "zod"
import { ClientType, EventStatus, QuoteStatus } from "@prisma/client"

// =====================
// ESQUEMAS BASE REUTILIZABLES
// =====================

export const emailSchema = z
  .string()
  .email("Email inválido")
  .min(1, "Email es requerido")

export const phoneSchema = z
  .string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, "Formato de teléfono inválido")
  .optional()
  .or(z.literal(""))

export const nameSchema = z
  .string()
  .min(2, "Nombre debe tener al menos 2 caracteres")
  .max(100, "Nombre no puede exceder 100 caracteres")

export const descriptionSchema = z
  .string()
  .max(500, "Descripción no puede exceder 500 caracteres")
  .optional()

export const priceSchema = z
  .number()
  .min(0, "El precio debe ser mayor o igual a 0")
  .max(999999.99, "El precio no puede exceder Q999,999.99")

// =====================
// VALIDACIONES DE CLIENTES
// =====================

export const clientSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema,
  company: z.string().max(100, "Nombre de empresa no puede exceder 100 caracteres").optional().or(z.literal("")),
  clientType: z.nativeEnum(ClientType, {
    errorMap: () => ({ message: "Tipo de cliente inválido" })
  }),
  address: z.string().max(200, "Dirección no puede exceder 200 caracteres").optional().or(z.literal("")),
  notes: descriptionSchema,
})

export const clientUpdateSchema = clientSchema.partial()

export type ClientFormData = z.infer<typeof clientSchema>
export type ClientUpdateData = z.infer<typeof clientUpdateSchema>

// =====================
// VALIDACIONES DE EVENTOS
// =====================

// Esquema base sin refines para el evento
const eventBaseSchema = z.object({
  title: z.string().min(3, "Título debe tener al menos 3 caracteres").max(100, "Título no puede exceder 100 caracteres"),
  description: descriptionSchema,
  startDate: z.date({
    required_error: "Fecha de inicio es requerida",
    invalid_type_error: "Fecha de inicio inválida"
  }),
  endDate: z.date({
    required_error: "Fecha de fin es requerida", 
    invalid_type_error: "Fecha de fin inválida"
  }),
  duration: z.number().min(1, "Duración debe ser al menos 1 hora").max(48, "Duración no puede exceder 48 horas"),
  status: z.nativeEnum(EventStatus),
  eventType: z.string().min(2, "Tipo de evento es requerido").max(50, "Tipo de evento no puede exceder 50 caracteres"),
  guestCount: z.number().min(1, "Debe haber al menos 1 invitado").max(1000, "No puede exceder 1000 invitados"),
  confirmedGuests: z.number().min(0, "Invitados confirmados no puede ser negativo"),
  clientId: z.string().cuid("ID de cliente inválido"),
  venueId: z.string().cuid("ID de venue inválido").optional().or(z.literal("")),
})

// Esquema completo con validaciones cruzadas
export const eventSchema = eventBaseSchema.refine((data) => data.endDate > data.startDate, {
  message: "Fecha de fin debe ser posterior a fecha de inicio",
  path: ["endDate"],
}).refine((data) => data.confirmedGuests <= data.guestCount, {
  message: "Invitados confirmados no puede exceder total de invitados",
  path: ["confirmedGuests"],
})

// Esquema para updates (sin validaciones cruzadas obligatorias)
export const eventUpdateSchema = eventBaseSchema.partial()

export type EventFormData = z.infer<typeof eventSchema>
export type EventUpdateData = z.infer<typeof eventUpdateSchema>

// =====================
// VALIDACIONES DE VENUES
// =====================

export const venueSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  location: z.string().max(100, "Ubicación no puede exceder 100 caracteres").optional().or(z.literal("")),
  capacity: z.number().min(1, "Capacidad debe ser al menos 1 persona").max(10000, "Capacidad no puede exceder 10,000 personas"),
  hourlyRate: priceSchema,
  isActive: z.boolean().optional().default(true),
})

export const venueUpdateSchema = venueSchema.partial()

export type VenueFormData = z.infer<typeof venueSchema>
export type VenueUpdateData = z.infer<typeof venueUpdateSchema>

// =====================
// VALIDACIONES DE PRODUCTOS
// =====================

export const productSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  category: z.string().max(50, "Categoría no puede exceder 50 caracteres").optional().or(z.literal("")),
  basePrice: priceSchema,
  unit: z.string().min(1, "Unidad es requerida").max(20, "Unidad no puede exceder 20 caracteres"),
  isActive: z.boolean().optional().default(true),
})

export const productUpdateSchema = productSchema.partial()

export type ProductFormData = z.infer<typeof productSchema>
export type ProductUpdateData = z.infer<typeof productUpdateSchema>

// =====================
// VALIDACIONES DE SERVICIOS
// =====================

export const serviceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  category: z.string().max(50, "Categoría no puede exceder 50 caracteres").optional().or(z.literal("")),
  basePrice: priceSchema,
  unit: z.string().min(1, "Unidad es requerida").max(20, "Unidad no puede exceder 20 caracteres"),
  isActive: z.boolean().optional().default(true),
})

export const serviceUpdateSchema = serviceSchema.partial()

export type ServiceFormData = z.infer<typeof serviceSchema>
export type ServiceUpdateData = z.infer<typeof serviceUpdateSchema>

// =====================
// VALIDACIONES DE COTIZACIONES
// =====================

export const quoteItemSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  quantity: z.number().min(1, "Cantidad debe ser al menos 1").max(1000, "Cantidad no puede exceder 1000"),
  unitPrice: priceSchema,
  total: priceSchema,
  itemType: z.enum(["PRODUCT", "SERVICE", "VENUE", "CUSTOM"]),
  productId: z.string().cuid().optional().or(z.literal("")),
  serviceId: z.string().cuid().optional().or(z.literal("")),
  venueId: z.string().cuid().optional().or(z.literal("")),
})

export const quoteSchema = z.object({
  number: z.string().min(1, "Número de cotización es requerido"),
  status: z.nativeEnum(QuoteStatus),
  validUntil: z.date({
    required_error: "Fecha de validez es requerida",
    invalid_type_error: "Fecha de validez inválida"
  }),
  subtotal: priceSchema,
  tax: priceSchema,
  discount: priceSchema,
  total: priceSchema,
  notes: descriptionSchema,
  terms: z.string().max(1000, "Términos no pueden exceder 1000 caracteres").optional().or(z.literal("")),
  clientId: z.string().cuid("ID de cliente inválido"),
  eventId: z.string().cuid("ID de evento inválido").optional().or(z.literal("")),
  items: z.array(quoteItemSchema).min(1, "Debe incluir al menos un item"),
})

export const quoteUpdateSchema = quoteSchema.partial()

export type QuoteFormData = z.infer<typeof quoteSchema>
export type QuoteUpdateData = z.infer<typeof quoteUpdateSchema>
export type QuoteItemFormData = z.infer<typeof quoteItemSchema>

// =====================
// VALIDACIONES DE FILTROS Y BÚSQUEDA
// =====================

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export const clientFiltersSchema = searchParamsSchema.extend({
  clientType: z.nativeEnum(ClientType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export const eventFiltersSchema = searchParamsSchema.extend({
  status: z.nativeEnum(EventStatus).optional(),
  eventType: z.string().optional(),
  venueId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export const quoteFiltersSchema = searchParamsSchema.extend({
  status: z.nativeEnum(QuoteStatus).optional(),
  clientId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type SearchParams = z.infer<typeof searchParamsSchema>
export type ClientFilters = z.infer<typeof clientFiltersSchema>
export type EventFilters = z.infer<typeof eventFiltersSchema>
export type QuoteFilters = z.infer<typeof quoteFiltersSchema>

// =====================
// UTILIDADES DE VALIDACIÓN
// =====================

/**
 * Función helper para validar datos de forma consistente
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; data: T 
} | { 
  success: false; errors: z.ZodError<T> 
} {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

/**
 * Función para extraer errores en formato legible
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  
  error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    errors[path] = issue.message
  })
  
  return errors
}