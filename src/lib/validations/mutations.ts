/**
 * Validation schemas for API mutations (create/update operations)
 * Using Zod for runtime type validation
 */

import { z } from 'zod';

// ============================================
// CLIENT SCHEMAS
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  email: z.string().email('Email inválido').max(255),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  company: z.string().max(255).optional(),
  type: z.enum(['GENERAL', 'VIP', 'CORPORATE', 'RECURRING']).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  priceListId: z.string().cuid().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  type: z.enum(['GENERAL', 'VIP', 'CORPORATE', 'RECURRING']).optional(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  priceListId: z.string().cuid().optional().nullable(),
});

// ============================================
// EVENT SCHEMAS
// ============================================

export const createEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255),
  startDate: z.string().datetime('Fecha de inicio inválida'),
  endDate: z.string().datetime('Fecha de fin inválida'),
  clientId: z.string().cuid('ID de cliente inválido'),
  roomId: z.string().cuid().optional(),
  venueId: z.string().cuid().optional(),
  status: z.enum(['RESERVED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  isFullVenue: z.boolean().optional(),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  }
);

export const updateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  clientId: z.string().cuid().optional(),
  roomId: z.string().cuid().optional().nullable(),
  venueId: z.string().cuid().optional().nullable(),
  status: z.enum(['RESERVED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
  isFullVenue: z.boolean().optional(),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  }
);

// ============================================
// QUOTE SCHEMAS
// ============================================

export const createQuoteSchema = z.object({
  clientId: z.string().cuid('ID de cliente inválido'),
  eventId: z.string().cuid().optional(),
  subtotal: z.number().min(0, 'El subtotal debe ser mayor o igual a 0'),
  discount: z.number().min(0).max(100).optional(),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0'),
  validUntil: z.string().datetime('Fecha de validez inválida'),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  templateId: z.string().cuid().optional(),
});

export const updateQuoteSchema = z.object({
  clientId: z.string().cuid().optional(),
  eventId: z.string().cuid().optional().nullable(),
  subtotal: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  total: z.number().min(0).optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  templateId: z.string().cuid().optional().nullable(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
