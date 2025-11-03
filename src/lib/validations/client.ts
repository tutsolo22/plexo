import { z } from 'zod';

// Schema base para cliente
export const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  type: z.enum(['GENERAL', 'COLABORADOR', 'EXTERNO'], {
    errorMap: () => ({ message: 'Tipo de cliente inválido' })
  }),
  discountPercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  priceListId: z.string().cuid().optional(),
});

// Schema para crear cliente
export const createClientSchema = clientSchema;

// Schema para actualizar cliente
export const updateClientSchema = clientSchema.partial().extend({
  id: z.string().cuid(),
  isActive: z.boolean().optional(),
});

// Schema para filtros de búsqueda
export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['GENERAL', 'COLABORADOR', 'EXTERNO']).optional(),
  isActive: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Schema para documento de cliente
export const clientDocumentSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  fileName: z.string().min(1, 'El nombre del archivo es obligatorio'),
  fileUrl: z.string().url('URL inválida'),
  fileSize: z.number().int().min(1, 'El tamaño del archivo debe ser mayor a 0'),
  mimeType: z.string().min(1, 'El tipo MIME es obligatorio'),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(false),
});

// Tipos inferidos
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientFilters = z.infer<typeof clientFiltersSchema>;
export type ClientDocumentInput = z.infer<typeof clientDocumentSchema>;