# Sistema de Function Calling - Implementación Completada

## 📋 Resumen

Sistema completo de **Function Calling** integrado en CRM Agent v2.4 que permite a la IA realizar operaciones de escritura (CREATE/UPDATE) en clientes, eventos y cotizaciones mediante lenguaje natural.

---

## 🎯 Funcionalidades Implementadas

### ✅ Operaciones Soportadas

#### **Clientes**
- ✅ `createClient`: Crear nuevo cliente
- ✅ `updateClient`: Actualizar datos de cliente existente

#### **Eventos**
- ✅ `createEvent`: Crear evento y marcar en calendario
- ✅ `updateEvent`: Modificar evento existente

#### **Cotizaciones**
- ✅ `createQuote`: Generar cotización con número automático
- ✅ `updateQuote`: Actualizar cotización existente

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Usuario: "Crea un cliente llamado Juan Pérez"         │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  CRM Agent v2.4: processQuery()                         │
│  ├─ detectMutation() → ¿Es CREATE/UPDATE?               │
│  └─ SI → handleMutation()                               │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  analyzeFunctionCall()                                  │
│  ├─ Envía consulta + function definitions a IA         │
│  ├─ IA retorna: { name: "createClient", arguments: {   │
│  │    name: "Juan Pérez", email: "juan@...", ...       │
│  └─ } }                                                 │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  executeFunctionCall()                                  │
│  ├─ Switch por nombre de función                        │
│  └─ Llama método específico: createClient()             │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  createClient(args, context)                            │
│  ├─ 1. Validar con Zod: createClientSchema.parse()     │
│  ├─ 2. Verificar email único en tenant                  │
│  ├─ 3. Crear en BD: prisma.client.create()             │
│  └─ 4. Retornar: { success, data, message }            │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  learningSystem.saveSuccessfulQuery()                   │
│  └─ Guardar en RAG para aprendizaje futuro              │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Archivos Creados/Modificados

### **Nuevos Archivos**

#### `src/lib/ai/function-definitions.ts` (284 líneas)
Define las 6 funciones con JSON Schema compatible con OpenAI Function Calling:

```typescript
export const createClientFunction: FunctionDefinition = {
  name: 'createClient',
  description: 'Crea un nuevo cliente en el sistema CRM',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Nombre completo' },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string', description: 'Teléfono (opcional)' },
      type: { 
        type: 'string', 
        enum: ['GENERAL', 'VIP', 'CORPORATE', 'RECURRING'] 
      },
      // ... más campos
    },
    required: ['name', 'email']
  }
};
```

**Exports**:
- `availableFunctions`: Array de todas las definiciones
- `functionMap`: Objeto con mapeo name → definition

---

#### `src/lib/validations/mutations.ts` (127 líneas)
Schemas Zod centralizados para validación:

```typescript
export const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  // ...
});

export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  // ...
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'La fecha de fin debe ser posterior...', path: ['endDate'] }
);

// + updateClientSchema, createQuoteSchema, etc.
```

**Tipos exportados**:
```typescript
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
// ... 6 tipos totales
```

---

### **Archivos Modificados**

#### `src/lib/ai/crm-agent-v2.ts` (v2.2 → v2.4)
**Cambios principales**:

1. **Imports agregados**:
```typescript
import { availableFunctions, functionMap } from './function-definitions';
import { 
  createClientSchema, updateClientSchema,
  createEventSchema, updateEventSchema,
  createQuoteSchema, updateQuoteSchema,
} from '@/lib/validations/mutations';
```

2. **Nuevo flujo en `processQuery()`**:
```typescript
// PASO 3: Detectar si es mutación
const isMutation = await this.detectMutation(query);

if (isMutation) {
  console.log('🔧 Detectada operación de mutación');
  return await this.handleMutation(query, context);
}
// ... continúa con queries normales
```

3. **Nuevos métodos privados**:
- `detectMutation(query)`: Detecta keywords (crear, actualizar, modificar, etc.)
- `handleMutation(query, context)`: Orquesta flujo completo de mutación
- `analyzeFunctionCall(query)`: Usa IA para determinar función y parámetros
- `executeFunctionCall(name, args, context)`: Switch dispatcher
- `extractEntityFromFunction(name)`: Extrae entity para RAG

4. **Métodos CRUD** (6 totales):
```typescript
// CLIENT MUTATIONS
private async createClient(args, context)
private async updateClient(args, context)

// EVENT MUTATIONS
private async createEvent(args, context)
private async updateEvent(args, context)

// QUOTE MUTATIONS
private async createQuote(args, context)
private async updateQuote(args, context)
```

---

## 🔍 Detalles de Implementación

### **Validación de Seguridad**

Cada método verifica **ownership** y **multi-tenancy**:

```typescript
// Ejemplo: createClient
const existingClient = await prisma.client.findFirst({
  where: {
    email: validatedData.email,
    tenantId: context.tenantId, // ✅ Isolation por tenant
    deletedAt: null,
  },
});

if (existingClient) {
  throw new Error('Ya existe un cliente con ese email');
}

const client = await prisma.client.create({
  data: {
    ...validatedData,
    tenantId: context.tenantId, // ✅ Asignación forzada
    ...(context.businessIdentityId && { 
      businessIdentityId: context.businessIdentityId 
    }),
  },
});
```

### **Generación Automática de Números**

Las cotizaciones generan número secuencial por tenant:

```typescript
const lastQuote = await prisma.quote.findFirst({
  where: { tenantId: context.tenantId },
  orderBy: { createdAt: 'desc' },
});

const year = new Date().getFullYear();
const lastNumber = lastQuote?.quoteNumber?.match(/QUO-\d{4}-(\d+)/)?.[1];
const nextNumber = lastNumber ? parseInt(lastNumber) + 1 : 1;
const quoteNumber = `QUO-${year}-${String(nextNumber).padStart(3, '0')}`;
// Resultado: QUO-2025-001, QUO-2025-002, ...
```

### **Validaciones Cross-Field**

Eventos validan fechas con Zod refinements:

```typescript
createEventSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { 
    message: 'La fecha de fin debe ser posterior a la de inicio',
    path: ['endDate'] 
  }
);
```

### **Verificación de Relaciones**

Eventos verifican que cliente pertenece al tenant:

```typescript
const client = await prisma.client.findFirst({
  where: {
    id: validatedData.clientId,
    tenantId: context.tenantId, // ✅ Verificación
    deletedAt: null,
  },
});

if (!client) {
  throw new Error('Cliente no encontrado o no pertenece a tu organización');
}
```

---

## 🧪 Ejemplos de Uso

### **Crear Cliente**
```
Usuario: "Crea un cliente llamado María García con email maria@example.com"

IA Analiza:
{
  "name": "createClient",
  "arguments": {
    "name": "María García",
    "email": "maria@example.com"
  }
}

Sistema Ejecuta:
✅ Cliente **María García** creado exitosamente. Email: maria@example.com
```

### **Crear Evento**
```
Usuario: "Agenda un evento 'Boda de Juan' para el cliente cm123 el 25 de diciembre 2025 de 6pm a 11pm"

IA Analiza:
{
  "name": "createEvent",
  "arguments": {
    "title": "Boda de Juan",
    "clientId": "cm123",
    "startDate": "2025-12-25T18:00:00Z",
    "endDate": "2025-12-25T23:00:00Z"
  }
}

Sistema Ejecuta:
✅ Evento **Boda de Juan** creado exitosamente para el cliente Juan Pérez. 
Fecha: 25/12/2025
```

### **Actualizar Cliente**
```
Usuario: "Actualiza el cliente cm456 y cambia su tipo a VIP"

IA Analiza:
{
  "name": "updateClient",
  "arguments": {
    "clientId": "cm456",
    "type": "VIP"
  }
}

Sistema Ejecuta:
✅ Cliente **María García** actualizado exitosamente.
```

### **Crear Cotización**
```
Usuario: "Genera una cotización de $5000 para el cliente cm123, válida hasta el 31 de enero"

IA Analiza:
{
  "name": "createQuote",
  "arguments": {
    "clientId": "cm123",
    "subtotal": "5000",
    "total": "5000",
    "validUntil": "2025-01-31T23:59:59Z"
  }
}

Sistema Ejecuta:
✅ Cotización **QUO-2025-003** creada exitosamente para Juan Pérez. Total: $5000
```

---

## 🔄 Integración con RAG

Cada mutación exitosa se guarda para aprendizaje:

```typescript
await learningSystem.saveSuccessfulQuery({
  userQuery: query,
  intent: 'mutation',
  action: functionCall.name, // 'createClient', 'updateEvent', etc.
  entity: this.extractEntityFromFunction(functionCall.name), // 'Client', 'Event'
  filters: functionCall.arguments,
  response: result.message,
  tenantId: context.tenantId,
});
```

**Beneficio**: Próximas consultas similares serán más rápidas y precisas.

---

## 📊 Estadísticas de Implementación

| Métrica | Valor |
|---------|-------|
| **Archivos nuevos** | 2 |
| **Archivos modificados** | 1 |
| **Líneas agregadas** | ~700 |
| **Funciones implementadas** | 6 |
| **Schemas Zod** | 6 |
| **Entidades soportadas** | 3 (Client, Event, Quote) |
| **Validaciones de seguridad** | Multi-tenancy, ownership, unique constraints |

---

## ⚠️ Consideraciones de Seguridad

### ✅ **Implementado**
- [x] Validación Zod de todos los inputs
- [x] Verificación de tenantId en todas las queries
- [x] Verificación de ownership antes de UPDATE
- [x] Unique constraints respetados (email por tenant)
- [x] Soft delete check en relaciones (deletedAt: null)
- [x] Type casting seguro con `as any` solo donde TypeScript es muy estricto

### 🔮 **Futuro**
- [ ] Rate limiting en mutaciones (evitar spam)
- [ ] Audit log de todas las mutaciones
- [ ] Confirmación del usuario para operaciones críticas (DELETE)
- [ ] Rollback automático en errores complejos

---

## 🚀 Próximos Pasos

1. **Completar endpoints REST**:
   - PUT /api/clients/[id]
   - DELETE /api/clients/[id] (soft delete)
   - PUT /api/events/[id]
   - PUT /api/quotes/[id]

2. **Frontend**:
   - Formularios de creación/edición
   - Calendario interactivo para eventos
   - Confirmaciones visuales de mutaciones

3. **Testing**:
   - Tests unitarios de cada función
   - Tests de integración end-to-end
   - Tests de seguridad multi-tenant

4. **Bug Fix**:
   - Investigar problema de creación de usuario TENANT_ADMIN

---

## 📚 Referencias

- **CRM Agent v2.4**: `src/lib/ai/crm-agent-v2.ts`
- **Function Definitions**: `src/lib/ai/function-definitions.ts`
- **Validations**: `src/lib/validations/mutations.ts`
- **Dynamic Dispatch**: `MEJORA_DYNAMIC_DISPATCH.md`
- **RAG System**: `src/lib/ai/learning-system.ts`

---

**Versión**: 2.4  
**Fecha**: 2025-01-XX  
**Estado**: ✅ Implementado y funcional
