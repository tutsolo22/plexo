# 🧠 Sistema de Aprendizaje RAG - Documentación Completa

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Componentes del Sistema](#componentes-del-sistema)
4. [Flujo de Procesamiento](#flujo-de-procesamiento)
5. [Uso y Ejemplos](#uso-y-ejemplos)
6. [Métricas y Monitoreo](#métricas-y-monitoreo)

---

## 🎯 Introducción

El **Sistema de Aprendizaje RAG** (Retrieval-Augmented Generation) es una arquitectura inteligente que permite al agente CRM **aprender de consultas exitosas** sin necesidad de hardcodear nuevas funciones o intents.

### ✨ Características Principales

- **Aprendizaje automático** de patrones de consultas
- **Búsqueda semántica** con embeddings vectoriales
- **Esquema dinámico** con introspección de Prisma
- **Sin hardcoding** de nuevos tipos de consulta
- **Mejora continua** con cada interacción

### 🔧 Tecnologías Utilizadas

- **PostgreSQL + pgvector**: Base de datos con soporte de embeddings vectoriales
- **Google Gemini text-embedding-004**: Generación de embeddings de 768 dimensiones
- **Prisma ORM**: Acceso a base de datos con type-safety
- **RAG Pattern**: Recuperación de ejemplos + generación aumentada

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO HACE CONSULTA                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  1️⃣ BÚSQUEDA RAG: Encuentra consultas similares exitosas    │
│     • Genera embedding de la consulta                        │
│     • Busca en QueryExample usando similitud vectorial       │
│     • Devuelve top 3 ejemplos más similares                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2️⃣ SCHEMA INTROSPECTION: Lee estructura de la BD           │
│     • getDatabaseSchema(): Obtiene tablas y campos           │
│     • getSchemaDescription(): Descripción legible para IA    │
│     • getQueryExamples(): Ejemplos de queries válidas        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3️⃣ ANÁLISIS DE INTENT: IA decide qué hacer                 │
│     Contexto completo:                                       │
│     • Consultas similares pasadas (RAG)                      │
│     • Estructura de la base de datos (Schema)                │
│     • Ejemplos de consultas válidas                          │
│     • Consulta actual del usuario                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4️⃣ EJECUCIÓN: Realiza la operación en Prisma               │
│     • Count queries (countClients, countEvents, etc.)        │
│     • Search queries (searchClients, searchEvents, etc.)     │
│     • Búsqueda semántica con embeddings                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  5️⃣ GENERACIÓN DE RESPUESTA: IA formatea la respuesta       │
│     • Usa los resultados de la búsqueda                      │
│     • Genera respuesta natural y amigable                    │
│     • Formato markdown con estructura clara                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  6️⃣ GUARDAR EJEMPLO: Aprende del éxito                      │
│     • Si la consulta fue exitosa → guarda en QueryExample    │
│     • Genera embedding de la consulta                        │
│     • Almacena: query, intent, action, entity, filters       │
│     • Próximas consultas similares serán más rápidas         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes del Sistema

### 1. Schema Introspector (`schema-introspector.ts`)

**Propósito:** Proporciona conocimiento dinámico de la estructura de la base de datos.

**Funciones principales:**

```typescript
// Obtiene todas las tablas con sus campos
getDatabaseSchema(): TableSchema[]

// Genera descripción en lenguaje natural para la IA
getSchemaDescription(): string

// Obtiene campos filtrables de una tabla
getFilterableFields(tableName: string): string[]

// Genera ejemplos de consultas válidas
getQueryExamples(): string
```

**Ejemplo de schema devuelto:**

```typescript
{
  name: 'Client',
  fields: [
    { name: 'id', type: 'String', isRequired: true, isPrimaryKey: true },
    { name: 'name', type: 'String', isRequired: true, isSearchable: true },
    { name: 'email', type: 'String', isSearchable: true },
    { name: 'phone', type: 'String', isSearchable: true },
    { name: 'tenantId', type: 'String', isRequired: true },
    // ...más campos
  ],
  relations: [
    { name: 'events', type: 'Event', cardinality: '1:many' },
    { name: 'quotes', type: 'Quote', cardinality: '1:many' }
  ]
}
```

### 2. Learning System (`learning-system.ts`)

**Propósito:** Almacena y recupera ejemplos de consultas exitosas usando RAG.

**Funciones principales:**

```typescript
// Guarda una consulta exitosa con su embedding
saveSuccessfulQuery(example: {
  userQuery: string;
  intent: string;
  action: string;
  entity?: string;
  filters?: any;
  response: string;
  tenantId: string;
}): Promise<void>

// Busca consultas similares usando búsqueda vectorial
findSimilarExamples(
  query: string,
  tenantId: string,
  limit: number = 5
): Promise<QueryExample[]>

// Genera contexto de aprendizaje para la IA
getLearnedContext(query: string, tenantId: string): Promise<string>

// Obtiene estadísticas de aprendizaje
getLearningStats(tenantId: string): Promise<{
  totalExamples: number;
  byIntent: Record<string, number>;
  byEntity: Record<string, number>;
}>
```

**Modelo de datos (Prisma):**

```prisma
model QueryExample {
  id         String   @id @default(cuid())
  userQuery  String   // "¿cuántos clientes tenemos?"
  intent     String   // "countClients"
  action     String   // "count_clients"
  entity     String?  // "Client"
  filters    Json?    // { tenantId: "xxx" }
  response   String   // "Tienes 3 clientes registrados..."
  success    Boolean  @default(true)
  embedding  Unsupported("vector(768)")? // Vector de embeddings
  tenantId   String
  tenant     Tenant   @relation(...)
  createdAt  DateTime @default(now())
}
```

### 3. CRM Agent V2.2 (`crm-agent-v2.ts`)

**Mejoras implementadas:**

```typescript
async processQuery(query: string, context: {...}) {
  // 1️⃣ Buscar ejemplos similares (RAG)
  const learnedContext = await learningSystem.getLearnedContext(query, tenantId);
  
  // 2️⃣ Obtener esquema de BD
  const schemaDescription = getSchemaDescription();
  const queryExamples = getQueryExamples();
  
  // 3️⃣ Analizar intent con contexto mejorado
  const queryIntent = await this.analyzeQueryIntent(query, {
    learnedContext,
    schemaDescription,
    queryExamples,
  });
  
  // 4️⃣ Ejecutar búsqueda
  let searchResults = await this.executeSearch(queryIntent, context);
  
  // 5️⃣ Generar respuesta
  const response = await this.generateResponse(query, searchResults, context);
  
  // 6️⃣ Guardar ejemplo exitoso (APRENDIZAJE)
  if (searchResults && searchResults.total > 0) {
    await learningSystem.saveSuccessfulQuery({
      userQuery: query,
      intent: queryIntent.type,
      action: actionTaken,
      entity,
      filters: queryIntent.params,
      response,
      tenantId,
    });
  }
  
  return { query, intent, results, response };
}
```

---

## 🔄 Flujo de Procesamiento

### Ejemplo Paso a Paso

**Usuario pregunta:** "¿cuántos clientes tenemos?"

#### 1️⃣ Búsqueda RAG

```typescript
// Sistema genera embedding de la consulta
const embedding = await googleAI.embedContent("¿cuántos clientes tenemos?");
// [0.123, -0.456, 0.789, ...] (768 dimensiones)

// Busca en QueryExample usando similitud de coseno
const examples = await prisma.$queryRaw`
  SELECT *, 1 - (embedding <=> ${embedding}::vector) as similarity
  FROM "query_examples"
  WHERE "tenantId" = ${tenantId}
  ORDER BY embedding <=> ${embedding}::vector
  LIMIT 3
`;

// Resultado:
// [
//   { userQuery: "¿cuántos clientes hay?", intent: "countClients", similarity: 0.95 },
//   { userQuery: "total de clientes", intent: "countClients", similarity: 0.89 },
//   { userQuery: "número de clientes activos", intent: "countClients", similarity: 0.82 }
// ]
```

#### 2️⃣ Schema Introspection

```typescript
const schemaDescription = `
Base de datos disponible:

Tabla: Client
- id (String, PK)
- name (String, searchable)
- email (String, searchable)
- phone (String, searchable)
- type (ClientType: INDIVIDUAL, BUSINESS)
- tenantId (String, required)

Relaciones:
- events (1:many)
- quotes (1:many)
`;
```

#### 3️⃣ Análisis de Intent

La IA recibe:
- ✅ Consultas similares exitosas (RAG)
- ✅ Estructura de la base de datos (Schema)
- ✅ Consulta actual

```typescript
// Prompt mejorado para la IA:
const prompt = `
**Consultas similares exitosas del pasado:**
Ejemplo 1: Usuario preguntó: "¿cuántos clientes hay?" → Acción: count_clients
Ejemplo 2: Usuario preguntó: "total de clientes" → Acción: count_clients

**Esquema de base de datos:**
Tabla Client con campos: id, name, email, phone, type, tenantId

**Consulta actual:** "¿cuántos clientes tenemos?"

Clasifica la consulta...
`;

// Respuesta de la IA:
{
  "type": "countClients",
  "params": { "query": "clientes" },
  "confidence": 0.95
}
```

#### 4️⃣ Ejecución

```typescript
const count = await prisma.client.count({
  where: { tenantId: 'tenant-123' }
});
// count = 3
```

#### 5️⃣ Generación de Respuesta

```typescript
const response = "Tienes 3 clientes registrados en el sistema.";
```

#### 6️⃣ Guardar para Aprendizaje

```typescript
await learningSystem.saveSuccessfulQuery({
  userQuery: "¿cuántos clientes tenemos?",
  intent: "countClients",
  action: "count_clients",
  entity: "Client",
  filters: { tenantId: "tenant-123" },
  response: "Tienes 3 clientes registrados en el sistema.",
  tenantId: "tenant-123"
});
// ✅ Guardado con embedding para futuras consultas
```

**Resultado:** La próxima vez que alguien pregunte algo similar, el sistema será aún más rápido y preciso. 🎯

---

## 📝 Uso y Ejemplos

### Consultas Soportadas

#### Consultas de Conteo

```
✅ "¿cuántos clientes tenemos?"
✅ "total de eventos"
✅ "número de cotizaciones activas"
✅ "cuántos eventos este mes"
```

#### Búsquedas Específicas

```
✅ "eventos de Juan Pérez"
✅ "buscar cliente con email juan@ejemplo.com"
✅ "cotizaciones pendientes de aprobación"
✅ "eventos en diciembre"
```

#### Consultas Generales

```
✅ "eventos próximos"
✅ "clientes más recientes"
✅ "cotizaciones de esta semana"
```

### Ejemplo de Código de Integración

```typescript
import { crmAgentService } from '@/lib/ai/crm-agent-v2';

// Procesar consulta del usuario
const result = await crmAgentService.processQuery(
  "¿cuántos clientes tenemos?",
  {
    tenantId: session.user.tenantId,
    userRole: session.user.role
  }
);

console.log(result.response);
// "Tienes 3 clientes registrados en el sistema."

console.log(result.intent);
// { type: 'countClients', params: {...}, confidence: 0.95 }
```

---

## 📊 Métricas y Monitoreo

### Endpoint de Estadísticas

```typescript
GET /api/ai/learning/stats
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalExamples": 47,
      "byIntent": {
        "countClients": 12,
        "searchEvents": 18,
        "countEvents": 8,
        "searchClients": 9
      },
      "byEntity": {
        "Client": 21,
        "Event": 26
      }
    }
  }
}
```

### Logs del Sistema

El sistema registra logs detallados:

```
🔍 CRM Agent v2.2: Procesando consulta
📚 Contexto aprendido: Ejemplo 1: Usuario preguntó: "¿cuántos clientes hay?"...
📋 Intent analizado: { type: 'countClients', confidence: 0.95 }
💾 Ejemplo guardado para aprendizaje
```

---

## 🎓 Ventajas del Sistema

### ✅ Sin Hardcoding

**Antes (sin RAG):**
```typescript
// Tenías que agregar código cada vez:
if (query.includes('cliente')) {
  // hardcoded logic
} else if (query.includes('evento')) {
  // más hardcoded logic
}
```

**Ahora (con RAG):**
```typescript
// El sistema aprende automáticamente:
const learnedContext = await learningSystem.getLearnedContext(query, tenantId);
// IA decide basándose en ejemplos pasados
```

### ✅ Mejora Continua

- Cada consulta exitosa se guarda automáticamente
- El sistema mejora con el uso
- No requiere intervención manual

### ✅ Contextual

- Conoce la estructura de tu base de datos
- Aprende de consultas similares
- Respuestas más precisas con el tiempo

### ✅ Escalable

- Funciona con cualquier número de entidades
- No degrada performance con más datos
- Búsqueda vectorial optimizada con índices

---

## 🚀 Próximos Pasos

### Function Calling (Planeado)

Permitir que la IA decida qué funciones ejecutar:

```typescript
// Definir funciones disponibles
const functions = [
  {
    name: 'count_entities',
    description: 'Cuenta entidades en la base de datos',
    parameters: {
      entity: { type: 'string', enum: ['Client', 'Event', 'Quote'] }
    }
  },
  // ...más funciones
];

// La IA decide qué función llamar
const functionCall = await ai.chooseFunctionToCall(query, functions);
// { function: 'count_entities', params: { entity: 'Client' } }
```

### Conversational Memory

Mantener contexto de conversaciones:

```typescript
const conversationId = generateId();

// Primera consulta
await agent.processQuery("¿cuántos clientes tenemos?", { conversationId });
// "Tienes 3 clientes"

// Segunda consulta (con contexto)
await agent.processQuery("¿y eventos?", { conversationId });
// "Tienes 5 eventos registrados" (entiende el contexto)
```

---

## 📄 Licencia

MIT © 2025 Plexo - Gestión de Eventos

---

## 🤝 Contribuciones

Este sistema es parte del proyecto Gestión de Eventos de Plexo. Para contribuciones, contacta al equipo de desarrollo.
