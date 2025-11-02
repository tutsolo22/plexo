/**
 * Function Definitions for AI Function Calling
 * Define las funciones que la IA puede invocar para realizar mutaciones
 */

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      format?: string;
    }>;
    required: string[];
  };
}

// ============================================
// CLIENT FUNCTIONS
// ============================================

export const createClientFunction: FunctionDefinition = {
  name: 'createClient',
  description: 'Crea un nuevo cliente en el sistema CRM',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nombre completo del cliente',
      },
      email: {
        type: 'string',
        description: 'Email del cliente',
        format: 'email',
      },
      phone: {
        type: 'string',
        description: 'Teléfono del cliente (opcional)',
      },
      company: {
        type: 'string',
        description: 'Nombre de la empresa (opcional)',
      },
      type: {
        type: 'string',
        description: 'Tipo de cliente',
        enum: ['GENERAL', 'VIP', 'CORPORATE', 'RECURRING'],
      },
      notes: {
        type: 'string',
        description: 'Notas adicionales (opcional)',
      },
    },
    required: ['name', 'email'],
  },
};

export const updateClientFunction: FunctionDefinition = {
  name: 'updateClient',
  description: 'Actualiza la información de un cliente existente',
  parameters: {
    type: 'object',
    properties: {
      clientId: {
        type: 'string',
        description: 'ID del cliente a actualizar',
      },
      name: {
        type: 'string',
        description: 'Nuevo nombre del cliente (opcional)',
      },
      email: {
        type: 'string',
        description: 'Nuevo email (opcional)',
        format: 'email',
      },
      phone: {
        type: 'string',
        description: 'Nuevo teléfono (opcional)',
      },
      company: {
        type: 'string',
        description: 'Nuevo nombre de empresa (opcional)',
      },
      type: {
        type: 'string',
        description: 'Nuevo tipo de cliente (opcional)',
        enum: ['GENERAL', 'VIP', 'CORPORATE', 'RECURRING'],
      },
      notes: {
        type: 'string',
        description: 'Nuevas notas (opcional)',
      },
      isActive: {
        type: 'string',
        description: 'Estado activo/inactivo (opcional)',
      },
    },
    required: ['clientId'],
  },
};

// ============================================
// EVENT FUNCTIONS
// ============================================

export const createEventFunction: FunctionDefinition = {
  name: 'createEvent',
  description: 'Crea un nuevo evento en el calendario y lo marca como reservado',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Título del evento (ej: "Boda de Juan y María")',
      },
      clientId: {
        type: 'string',
        description: 'ID del cliente asociado al evento',
      },
      startDate: {
        type: 'string',
        description: 'Fecha y hora de inicio (formato ISO: 2025-12-25T18:00:00Z)',
        format: 'date-time',
      },
      endDate: {
        type: 'string',
        description: 'Fecha y hora de fin (formato ISO: 2025-12-25T23:00:00Z)',
        format: 'date-time',
      },
      roomId: {
        type: 'string',
        description: 'ID de la sala reservada (opcional)',
      },
      venueId: {
        type: 'string',
        description: 'ID del venue reservado (opcional)',
      },
      status: {
        type: 'string',
        description: 'Estado del evento',
        enum: ['RESERVED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      },
      notes: {
        type: 'string',
        description: 'Notas adicionales del evento (opcional)',
      },
    },
    required: ['title', 'clientId', 'startDate', 'endDate'],
  },
};

export const updateEventFunction: FunctionDefinition = {
  name: 'updateEvent',
  description: 'Actualiza la información de un evento existente',
  parameters: {
    type: 'object',
    properties: {
      eventId: {
        type: 'string',
        description: 'ID del evento a actualizar',
      },
      title: {
        type: 'string',
        description: 'Nuevo título del evento (opcional)',
      },
      startDate: {
        type: 'string',
        description: 'Nueva fecha de inicio (opcional)',
        format: 'date-time',
      },
      endDate: {
        type: 'string',
        description: 'Nueva fecha de fin (opcional)',
        format: 'date-time',
      },
      status: {
        type: 'string',
        description: 'Nuevo estado (opcional)',
        enum: ['RESERVED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      },
      notes: {
        type: 'string',
        description: 'Nuevas notas (opcional)',
      },
    },
    required: ['eventId'],
  },
};

// ============================================
// QUOTE FUNCTIONS
// ============================================

export const createQuoteFunction: FunctionDefinition = {
  name: 'createQuote',
  description: 'Crea una nueva cotización para un cliente',
  parameters: {
    type: 'object',
    properties: {
      clientId: {
        type: 'string',
        description: 'ID del cliente para la cotización',
      },
      eventId: {
        type: 'string',
        description: 'ID del evento asociado (opcional)',
      },
      subtotal: {
        type: 'string',
        description: 'Subtotal de la cotización (número)',
      },
      discount: {
        type: 'string',
        description: 'Descuento a aplicar (0-100, opcional)',
      },
      total: {
        type: 'string',
        description: 'Total final de la cotización',
      },
      validUntil: {
        type: 'string',
        description: 'Fecha de validez de la cotización',
        format: 'date-time',
      },
      notes: {
        type: 'string',
        description: 'Notas adicionales (opcional)',
      },
      status: {
        type: 'string',
        description: 'Estado de la cotización',
        enum: ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      },
    },
    required: ['clientId', 'subtotal', 'total', 'validUntil'],
  },
};

export const updateQuoteFunction: FunctionDefinition = {
  name: 'updateQuote',
  description: 'Actualiza una cotización existente',
  parameters: {
    type: 'object',
    properties: {
      quoteId: {
        type: 'string',
        description: 'ID de la cotización a actualizar',
      },
      subtotal: {
        type: 'string',
        description: 'Nuevo subtotal (opcional)',
      },
      discount: {
        type: 'string',
        description: 'Nuevo descuento (opcional)',
      },
      total: {
        type: 'string',
        description: 'Nuevo total (opcional)',
      },
      status: {
        type: 'string',
        description: 'Nuevo estado (opcional)',
        enum: ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      },
      notes: {
        type: 'string',
        description: 'Nuevas notas (opcional)',
      },
    },
    required: ['quoteId'],
  },
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export const availableFunctions: FunctionDefinition[] = [
  createClientFunction,
  updateClientFunction,
  createEventFunction,
  updateEventFunction,
  createQuoteFunction,
  updateQuoteFunction,
];

export const functionMap: Record<string, FunctionDefinition> = {
  createClient: createClientFunction,
  updateClient: updateClientFunction,
  createEvent: createEventFunction,
  updateEvent: updateEventFunction,
  createQuote: createQuoteFunction,
  updateQuote: updateQuoteFunction,
};
