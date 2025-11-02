# Optimizaciones de QueryExample - Sistema RAG

## Índices Implementados

### 1. **Índice IVFFlat para Búsqueda Vectorial** 🚀

```sql
CREATE INDEX query_examples_embedding_ivfflat_idx
ON query_examples
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Propósito**: Aceleración de búsqueda de similitud semántica  
**Mejora**: ~10-100x más rápido que búsqueda lineal  
**Algoritmo**: Approximate Nearest Neighbor (ANN)  
**Trade-off**: 99% de precisión con 100x de velocidad

**Uso en código**:

```typescript
// Búsqueda de queries similares por embedding
const similarQueries = await prisma.$queryRaw`
  SELECT id, "userQuery", response, 
         1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM query_examples
  WHERE "tenantId" = ${tenantId}
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 5
`;
```

**Operadores de distancia**:

- `<=>` : Cosine distance (recomendado para embeddings)
- `<->` : L2/Euclidean distance
- `<#>` : Inner product

---

### 2. **Índice Compuesto: Tenant + Intent**

```sql
CREATE INDEX query_examples_tenant_intent_idx
ON query_examples("tenantId", intent);
```

**Propósito**: Filtrar queries por tipo de intención  
**Mejora**: ~5-10x más rápido

**Uso en código**:

```typescript
// Obtener todas las queries de tipo "count" del tenant
const countQueries = await prisma.queryExample.findMany({
  where: {
    tenantId: userTenantId,
    intent: 'count',
  },
  take: 20,
});
```

---

### 3. **Índice Compuesto: Tenant + Success**

```sql
CREATE INDEX query_examples_tenant_success_idx
ON query_examples("tenantId", success);
```

**Propósito**: Filtrar solo queries exitosas o fallidas  
**Mejora**: ~5-10x más rápido

**Uso en código**:

```typescript
// Solo queries exitosas para aprendizaje
const successfulQueries = await prisma.queryExample.findMany({
  where: {
    tenantId: userTenantId,
    success: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
});
```

---

### 4. **Índice de Ordenamiento por Fecha**

```sql
CREATE INDEX query_examples_created_at_desc_idx
ON query_examples("createdAt" DESC);
```

**Propósito**: Obtener queries más recientes eficientemente  
**Mejora**: ~3-5x más rápido en ORDER BY

**Uso en código**:

```typescript
// Últimas 10 queries del sistema
const recentQueries = await prisma.queryExample.findMany({
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

---

### 5. **Índice Parcial: Tenant + Success + Created** 🎯

```sql
CREATE INDEX query_examples_tenant_success_created_idx
ON query_examples("tenantId", success, "createdAt" DESC)
WHERE success = true;
```

**Propósito**: Índice especializado solo para queries exitosas  
**Mejora**: ~10-15x más rápido (índice más pequeño)  
**Ventaja**: Menos espacio en disco (solo indexa success=true)

**Uso en código**:

```typescript
// Queries exitosas recientes (usa índice parcial)
const topSuccessful = await prisma.queryExample.findMany({
  where: {
    tenantId: userTenantId,
    success: true, // ← Activa el índice parcial
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

---

### 6. **Índice GIN para JSON Filters**

```sql
CREATE INDEX query_examples_filters_gin_idx
ON query_examples USING GIN (filters);
```

**Propósito**: Búsqueda dentro del campo JSON `filters`  
**Mejora**: ~3-5x más rápido

**Uso en código**:

```typescript
// Buscar queries que filtraron por status='CONFIRMED'
const filtered = await prisma.$queryRaw`
  SELECT * FROM query_examples
  WHERE filters @> '{"status": "CONFIRMED"}'::jsonb
  AND "tenantId" = ${tenantId}
  LIMIT 10
`;
```

**Operadores JSON**:

- `@>` : Contiene (filters contiene el objeto)
- `?` : Existe clave
- `?|` : Existe alguna de las claves
- `?&` : Existen todas las claves

---

## Configuración de pgvector (Avanzado)

### Ajustar Precisión vs Velocidad

```sql
-- Ejecutar antes de búsquedas vectoriales
SET ivfflat.probes = 10; -- Default
SET ivfflat.probes = 1;  -- Más rápido, menos preciso
SET ivfflat.probes = 20; -- Más preciso, más lento
```

**Recomendaciones por tamaño**:

- < 10,000 rows: `probes = 5`
- 10k - 100k rows: `probes = 10` (default)
- 100k - 1M rows: `probes = 20`
- > 1M rows: `probes = 50`

---

## Ejemplos de Queries Optimizadas

### 1. Búsqueda Semántica con Filtros

```typescript
async function findSimilarQueries(
  userQuery: string,
  tenantId: string,
  limit = 5
) {
  // Generar embedding del userQuery (usando OpenAI, etc.)
  const embedding = await generateEmbedding(userQuery);

  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      userQuery: string;
      response: string;
      similarity: number;
    }>
  >`
    SELECT 
      id, 
      "userQuery", 
      response,
      1 - (embedding <=> ${embedding}::vector) as similarity
    FROM query_examples
    WHERE "tenantId" = ${tenantId}
      AND success = true
    ORDER BY embedding <=> ${embedding}::vector
    LIMIT ${limit}
  `;

  return results;
}
```

### 2. Analytics de Intenciones

```typescript
async function getIntentStats(tenantId: string) {
  const stats = await prisma.queryExample.groupBy({
    by: ['intent'],
    where: {
      tenantId,
      success: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  return stats;
}
```

### 3. Trending Queries (Últimas 24h)

```typescript
async function getTrendingQueries(tenantId: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const trending = await prisma.queryExample.findMany({
    where: {
      tenantId,
      success: true,
      createdAt: {
        gte: yesterday,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  return trending;
}
```

---

## Monitoreo de Performance

### Ver Tamaño de Índices

```sql
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
FROM pg_indexes
WHERE tablename = 'query_examples'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
```

### Ver Uso de Índices

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'query_examples'
ORDER BY idx_scan DESC;
```

### Estadísticas de IVFFlat

```sql
SELECT
  COUNT(*) as total_rows,
  COUNT(embedding) as rows_with_embeddings,
  pg_size_pretty(pg_total_relation_size('query_examples')) as total_size
FROM query_examples;
```

---

## Mantenimiento Recomendado

### 1. **Re-indexar IVFFlat** (cuando crece la tabla)

```sql
-- Cuando alcances > 10,000 rows, ajustar lists
DROP INDEX query_examples_embedding_ivfflat_idx;

CREATE INDEX query_examples_embedding_ivfflat_idx
ON query_examples
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000); -- Para 1M+ rows
```

**Fórmula**: `lists = SQRT(total_rows)`

### 2. **VACUUM periódico**

```sql
-- Ejecutar mensualmente
VACUUM ANALYZE query_examples;
```

### 3. **Limpiar queries antiguas** (opcional)

```typescript
// Mantener solo últimos 6 meses
async function cleanOldQueries() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const deleted = await prisma.queryExample.deleteMany({
    where: {
      createdAt: {
        lt: sixMonthsAgo,
      },
      success: false, // Solo borrar fallidas
    },
  });

  console.log(`Deleted ${deleted.count} old queries`);
}
```

---

## Benchmarks Esperados

| Operación                      | Sin Índices | Con Índices | Mejora |
| ------------------------------ | ----------- | ----------- | ------ |
| Búsqueda vectorial (10k rows)  | ~500ms      | ~5ms        | 100x   |
| Búsqueda vectorial (100k rows) | ~5s         | ~20ms       | 250x   |
| Filter by tenant+intent        | ~200ms      | ~20ms       | 10x    |
| Filter by tenant+success       | ~150ms      | ~15ms       | 10x    |
| ORDER BY createdAt DESC        | ~300ms      | ~10ms       | 30x    |
| JSON filter search             | ~400ms      | ~80ms       | 5x     |

---

## Mejoras Futuras

1. **HNSW Index** (cuando pgvector >= 0.5.0)
   - Más preciso que IVFFlat
   - Requiere más memoria
2. **Particionamiento por tenant**
   - Para > 1M rows por tenant
   - Mejora aislamiento

3. **Materialized Views**
   - Para analytics precalculadas
   - Refresh incremental

4. **Full-Text Search**
   - Para búsqueda en `userQuery` y `response`
   - Complementa búsqueda vectorial

---

**Última Actualización**: 2 de Noviembre 2025  
**Versión pgvector**: 0.7.0+  
**PostgreSQL**: 14+
