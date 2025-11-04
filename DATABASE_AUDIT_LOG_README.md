# SQL DDL - Tabla de Auditoría (Última Versión)

**Fecha**: 4 de Noviembre de 2025  
**Prisma**: 6.18.0  
**Database**: PostgreSQL 13+  
**Commit**: b0ae9a7

## 📋 DDL Completo

```sql
-- Crear tabla de auditoría
CREATE TABLE "ai_provider_config_audits" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "aiProviderConfigId" TEXT,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "changesDetails" JSONB,
  "description" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_provider_config_audits_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  
  CONSTRAINT "ai_provider_config_audits_aiProviderConfigId_fkey" 
    FOREIGN KEY ("aiProviderConfigId") REFERENCES "ai_provider_configs"("id") ON DELETE SET NULL,
  
  CONSTRAINT "ai_provider_config_audits_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Crear índices
CREATE INDEX "ai_provider_config_audits_tenantId_idx" ON "ai_provider_config_audits"("tenantId");
CREATE INDEX "ai_provider_config_audits_aiProviderConfigId_idx" ON "ai_provider_config_audits"("aiProviderConfigId");
CREATE INDEX "ai_provider_config_audits_userId_idx" ON "ai_provider_config_audits"("userId");
CREATE INDEX "ai_provider_config_audits_createdAt_idx" ON "ai_provider_config_audits"("createdAt");
CREATE INDEX "ai_provider_config_audits_action_idx" ON "ai_provider_config_audits"("action");
```

## 🔍 Especificación de Campos

| Campo | Tipo | Null | Descripción |
|-------|------|------|-------------|
| `id` | TEXT | NO | Primary Key (CUID) |
| `tenantId` | TEXT | NO | Referencia a tenant (CASCADE DELETE) |
| `aiProviderConfigId` | TEXT | SÍ | Referencia a config (SET NULL) |
| `userId` | TEXT | NO | Usuario que hizo el cambio |
| `action` | TEXT | NO | CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE |
| `provider` | TEXT | NO | Nombre del proveedor (openai, google, etc) |
| `changesDetails` | JSONB | SÍ | {oldValues: {...}, newValues: {...}} |
| `description` | TEXT | SÍ | Descripción legible en español |
| `ipAddress` | TEXT | SÍ | IP del cliente (origen del cambio) |
| `createdAt` | TIMESTAMP | NO | Fecha/hora del cambio (default: NOW()) |

## 🔗 Relaciones y Cascadas

### tenantId → tenants.id
- **Cascada**: CASCADE
- **Razón**: Si se elimina un tenant, todos sus audits se eliminan
- **Impacto**: Alto - importante para aislamiento multi-tenant

### aiProviderConfigId → ai_provider_configs.id
- **Cascada**: SET NULL
- **Razón**: Si se elimina config, el audit se preserva con NULL en aiProviderConfigId
- **Impacto**: Crítico - mantiene histórico incluso si config se elimina

### userId → users.id
- **Cascada**: CASCADE
- **Razón**: Si se elimina usuario, sus audits se eliminan
- **Impacto**: Medio - auditoría vinculada a usuario

## ⚡ Índices de Performance

```
1. tenantId - Búsqueda por tenant (filtro principal)
2. aiProviderConfigId - Historial de una config específica
3. userId - Cambios realizados por usuario (compliance)
4. createdAt - Ordenamiento temporal y range queries
5. action - Filtrado por tipo de acción (sensible vs normal)
```

## 📝 Ejemplos de Datos

### Crear configuración (CREATE)
```sql
INSERT INTO "ai_provider_config_audits" VALUES (
  'clz7k8m9n0p1q2r3s4t5u6v7w',
  'tenant_123',
  'config_789',
  'user_456',
  'CREATE',
  'openai',
  '{"newValues": {"provider": "openai"}}',
  'Creada nueva configuración para openai',
  '192.168.1.100',
  NOW()
);
```

### Actualizar configuración (UPDATE)
```sql
INSERT INTO "ai_provider_config_audits" VALUES (
  'clz7k8m9n0p1q2r3s4t5u6v8x',
  'tenant_123',
  'config_789',
  'user_456',
  'UPDATE',
  'openai',
  '{"oldValues": {}, "newValues": {"apiKey": "sk_encrypted_***"}}',
  'Actualizada configuración de openai',
  '192.168.1.100',
  NOW()
);
```

### Activar/Desactivar (ACTIVATE/DEACTIVATE)
```sql
INSERT INTO "ai_provider_config_audits" VALUES (
  'clz7k8m9n0p1q2r3s4t5u6v8y',
  'tenant_123',
  'config_789',
  'user_456',
  'ACTIVATE',
  'openai',
  '{"oldValues": {"isActive": false}, "newValues": {"isActive": true}}',
  'Activada configuración de openai',
  '192.168.1.100',
  NOW()
);
```

### Eliminar (DELETE) - Nota: aiProviderConfigId es NULL
```sql
INSERT INTO "ai_provider_config_audits" VALUES (
  'clz7k8m9n0p1q2r3s4t5u6v9a',
  'tenant_123',
  NULL,  -- ← La config fue eliminada
  'user_456',
  'DELETE',
  'openai',
  '{}',
  'Eliminada configuración de openai',
  '192.168.1.100',
  NOW()
);
```

## 🔎 Queries Útiles

### 1. Auditoría completa de un tenant
```sql
SELECT id, action, provider, description, "createdAt", "ipAddress"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
ORDER BY "createdAt" DESC;
```

### 2. Historial de una configuración específica
```sql
SELECT action, provider, "changesDetails", description, "createdAt"
FROM "ai_provider_config_audits"
WHERE "aiProviderConfigId" = 'config_789'
ORDER BY "createdAt" DESC;
```

### 3. Cambios de un usuario en últimos 7 días
```sql
SELECT action, provider, description, "createdAt", "ipAddress"
FROM "ai_provider_config_audits"
WHERE "userId" = 'user_456'
  AND "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY "createdAt" DESC;
```

### 4. Solo acciones sensibles (DELETE)
```sql
SELECT "userId", provider, description, "createdAt", "ipAddress"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
  AND action = 'DELETE'
ORDER BY "createdAt" DESC;
```

### 5. Cambios en últimas 24 horas
```sql
SELECT action, provider, "userId", "createdAt", "ipAddress"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
  AND "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '1 day'
ORDER BY "createdAt" DESC;
```

### 6. Estadísticas por tipo de acción
```sql
SELECT 
  action,
  COUNT(*) as total,
  COUNT(DISTINCT "userId") as unique_users,
  MAX("createdAt") as ultima_accion
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
GROUP BY action
ORDER BY total DESC;
```

### 7. Auditoría por proveedor (openai, google, etc)
```sql
SELECT "userId", action, "changesDetails", description, "createdAt"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
  AND provider = 'openai'
ORDER BY "createdAt" DESC;
```

### 8. Rango de fechas específico
```sql
SELECT id, action, provider, "userId", "createdAt", "ipAddress"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
  AND "createdAt" BETWEEN '2025-11-01'::timestamp AND '2025-11-04'::timestamp
ORDER BY "createdAt" DESC;
```

## 💾 Tamaño y Mantenimiento

### Estimación de tamaño
- **Por registro**: ~300-500 bytes
- **10,000 registros**: ~3-5 MB
- **100,000 registros**: ~30-50 MB
- **1,000,000 registros**: ~300-500 MB

### Políticas de retención
```sql
-- Eliminar registros más antiguos de 90 días
DELETE FROM "ai_provider_config_audits"
WHERE "createdAt" < CURRENT_TIMESTAMP - INTERVAL '90 days';

-- Optimizar tabla después de muchas eliminaciones
VACUUM ANALYZE "ai_provider_config_audits";

-- Ver tamaño de tabla
SELECT pg_size_pretty(pg_total_relation_size('ai_provider_config_audits'));
```

## 🔐 Consideraciones de Seguridad

1. **Aislamiento multi-tenant**: Via `tenantId` (CASCADE delete protege)
2. **Preservación de histórico**: `aiProviderConfigId` con SET NULL
3. **Rastreo de usuario**: `userId` siempre registrado
4. **Tracking de IP**: Para investigación de accesos
5. **JSONB encriptado**: Los datos sensibles deben encriptarse en aplicación
6. **Índices**: Optimizan búsquedas sin ralentizar escrituras

## 📞 Metadata

- **Tabla**: `ai_provider_config_audits`
- **Registros guardados**: Indefinidamente (revisar políticas de retención)
- **Accionable por**: Admins, compliance, security team
- **Integración**: API endpoints (`/api/admin/ai-providers/[id]/history`)
- **Frontend**: Componente `ai-config-history-modal.tsx`
- **Logs****: Ref: `src/lib/ai-provider-audit.ts`

