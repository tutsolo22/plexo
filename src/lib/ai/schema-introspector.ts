/**
 * Schema Introspector - Lee automáticamente el schema de Prisma
 * para que el agente sepa qué tablas y campos existen
 */

import { Prisma } from '@prisma/client';

export interface TableSchema {
  name: string;
  fields: FieldSchema[];
  relations: RelationSchema[];
}

export interface FieldSchema {
  name: string;
  type: string;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: any;
}

export interface RelationSchema {
  name: string;
  targetTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

/**
 * Obtiene el schema completo de la base de datos
 * Esta información se usa para que la IA entienda qué datos están disponibles
 */
export function getDatabaseSchema(): TableSchema[] {
  return [
    {
      name: 'Client',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isUnique: true },
        { name: 'name', type: 'String', isRequired: true, isUnique: false },
        { name: 'email', type: 'String', isRequired: false, isUnique: false },
        { name: 'phone', type: 'String', isRequired: false, isUnique: false },
        { name: 'companyName', type: 'String', isRequired: false, isUnique: false },
        { name: 'type', type: 'String', isRequired: false, isUnique: false },
        { name: 'notes', type: 'String', isRequired: false, isUnique: false },
        { name: 'tenantId', type: 'String', isRequired: true, isUnique: false },
        { name: 'businessIdentityId', type: 'String', isRequired: false, isUnique: false },
        { name: 'createdAt', type: 'DateTime', isRequired: true, isUnique: false },
        { name: 'updatedAt', type: 'DateTime', isRequired: true, isUnique: false },
      ],
      relations: [
        { name: 'events', targetTable: 'Event', type: 'one-to-many' },
        { name: 'quotes', targetTable: 'Quote', type: 'one-to-many' },
      ],
    },
    {
      name: 'Event',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isUnique: true },
        { name: 'name', type: 'String', isRequired: true, isUnique: false },
        { name: 'description', type: 'String', isRequired: false, isUnique: false },
        { name: 'eventType', type: 'String', isRequired: false, isUnique: false },
        { name: 'startDate', type: 'DateTime', isRequired: true, isUnique: false },
        { name: 'endDate', type: 'DateTime', isRequired: false, isUnique: false },
        { name: 'status', type: 'EventStatus', isRequired: true, isUnique: false },
        { name: 'guestCount', type: 'Int', isRequired: false, isUnique: false },
        { name: 'clientId', type: 'String', isRequired: true, isUnique: false },
        { name: 'roomId', type: 'String', isRequired: false, isUnique: false },
        { name: 'tenantId', type: 'String', isRequired: true, isUnique: false },
        { name: 'businessIdentityId', type: 'String', isRequired: false, isUnique: false },
        { name: 'createdAt', type: 'DateTime', isRequired: true, isUnique: false },
        { name: 'updatedAt', type: 'DateTime', isRequired: true, isUnique: false },
      ],
      relations: [
        { name: 'client', targetTable: 'Client', type: 'one-to-one' },
        { name: 'room', targetTable: 'Room', type: 'one-to-one' },
      ],
    },
    {
      name: 'Quote',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isUnique: true },
        { name: 'quoteNumber', type: 'String', isRequired: true, isUnique: true },
        { name: 'status', type: 'QuoteStatus', isRequired: true, isUnique: false },
        { name: 'totalAmount', type: 'Float', isRequired: true, isUnique: false },
        { name: 'validUntil', type: 'DateTime', isRequired: false, isUnique: false },
        { name: 'notes', type: 'String', isRequired: false, isUnique: false },
        { name: 'clientId', type: 'String', isRequired: true, isUnique: false },
        { name: 'tenantId', type: 'String', isRequired: true, isUnique: false },
        { name: 'businessIdentityId', type: 'String', isRequired: false, isUnique: false },
        { name: 'createdAt', type: 'DateTime', isRequired: true, isUnique: false },
        { name: 'updatedAt', type: 'DateTime', isRequired: true, isUnique: false },
      ],
      relations: [
        { name: 'client', targetTable: 'Client', type: 'one-to-one' },
        { name: 'items', targetTable: 'QuoteItem', type: 'one-to-many' },
      ],
    },
    {
      name: 'Room',
      fields: [
        { name: 'id', type: 'String', isRequired: true, isUnique: true },
        { name: 'name', type: 'String', isRequired: true, isUnique: false },
        { name: 'capacity', type: 'Int', isRequired: false, isUnique: false },
        { name: 'description', type: 'String', isRequired: false, isUnique: false },
        { name: 'pricePerHour', type: 'Float', isRequired: false, isUnique: false },
        { name: 'isActive', type: 'Boolean', isRequired: true, isUnique: false, defaultValue: true },
        { name: 'tenantId', type: 'String', isRequired: true, isUnique: false },
        { name: 'locationId', type: 'String', isRequired: false, isUnique: false },
      ],
      relations: [
        { name: 'events', targetTable: 'Event', type: 'one-to-many' },
      ],
    },
  ];
}

/**
 * Genera una descripción en lenguaje natural del schema
 * para pasarle a la IA
 */
export function getSchemaDescription(): string {
  const schema = getDatabaseSchema();
  
  let description = 'Base de datos disponible:\n\n';
  
  schema.forEach(table => {
    description += `Tabla: ${table.name}\n`;
    description += `Campos:\n`;
    table.fields.forEach(field => {
      const required = field.isRequired ? ' (requerido)' : '';
      const unique = field.isUnique ? ' (único)' : '';
      description += `  - ${field.name}: ${field.type}${required}${unique}\n`;
    });
    
    if (table.relations.length > 0) {
      description += `Relaciones:\n`;
      table.relations.forEach(rel => {
        description += `  - ${rel.name} → ${rel.targetTable} (${rel.type})\n`;
      });
    }
    description += '\n';
  });
  
  return description;
}

/**
 * Obtiene campos disponibles para filtros en una tabla
 */
export function getFilterableFields(tableName: string): string[] {
  const schema = getDatabaseSchema();
  const table = schema.find(t => t.name.toLowerCase() === tableName.toLowerCase());
  
  if (!table) return [];
  
  // Campos que típicamente se usan para filtrar
  return table.fields
    .filter(f => 
      !['id', 'createdAt', 'updatedAt', 'tenantId', 'businessIdentityId'].includes(f.name)
    )
    .map(f => f.name);
}

/**
 * Genera ejemplos de consultas para cada tabla
 */
export function getQueryExamples(): string {
  return `
Ejemplos de consultas que puedes hacer:

CONTEO:
- "¿Cuántos clientes tengo?"
- "Total de eventos este mes"
- "Número de cotizaciones pendientes"

BÚSQUEDA:
- "Muéstrame los clientes de tipo corporativo"
- "Eventos confirmados para diciembre"
- "Cotizaciones mayores a $10,000"

ANÁLISIS:
- "¿Cuál es el promedio de invitados por evento?"
- "Total de ingresos de cotizaciones aprobadas"
- "Clientes con más eventos"

FILTROS COMPLEJOS:
- "Eventos del cliente Juan Pérez"
- "Cotizaciones creadas esta semana"
- "Salas con capacidad mayor a 100"
`;
}
