-- ============================================================================
-- TABLA DE AUDITORÍA: ai_provider_config_audits
-- Última Modificación: 4 de Noviembre de 2025
-- Sistema: Gestion de Eventos v3.0.0
-- ============================================================================

-- Crear tabla principal
CREATE TABLE "ai_provider_config_audits" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "aiProviderConfigId" TEXT,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "changesDetails" JSONB,
  "description" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_provider_config_audits_pkey" PRIMARY KEY ("id")
);

-- Crear índices para optimización de queries
CREATE INDEX "ai_provider_config_audits_tenantId_idx" ON "ai_provider_config_audits"("tenantId");
CREATE INDEX "ai_provider_config_audits_aiProviderConfigId_idx" ON "ai_provider_config_audits"("aiProviderConfigId");
CREATE INDEX "ai_provider_config_audits_userId_idx" ON "ai_provider_config_audits"("userId");
CREATE INDEX "ai_provider_config_audits_createdAt_idx" ON "ai_provider_config_audits"("createdAt");
CREATE INDEX "ai_provider_config_audits_action_idx" ON "ai_provider_config_audits"("action");

-- Crear restricciones de clave foránea (Foreign Keys)

-- FK a tabla 'tenants' - Cascada: Si se elimina tenant, se eliminan sus auditorías
ALTER TABLE "ai_provider_config_audits" 
ADD CONSTRAINT "ai_provider_config_audits_tenantId_fkey" 
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- FK a tabla 'ai_provider_configs' - SetNull: Si se elimina config, se pone NULL pero se preserva el auditLog
ALTER TABLE "ai_provider_config_audits" 
ADD CONSTRAINT "ai_provider_config_audits_aiProviderConfigId_fkey" 
FOREIGN KEY ("aiProviderConfigId") REFERENCES "ai_provider_configs"("id") ON DELETE SET NULL;

-- FK a tabla 'users' - Cascada: Si se elimina usuario, se eliminan sus auditorías
ALTER TABLE "ai_provider_config_audits" 
ADD CONSTRAINT "ai_provider_config_audits_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- ============================================================================
-- ESQUEMA DE DATOS
-- ============================================================================

-- Campos:
-- id (TEXT): Identificador único (CUID - Collision resistant ID)
-- tenantId (TEXT): ID del tenant (aislamiento multi-tenant)
-- aiProviderConfigId (TEXT, NULLABLE): ID de la configuración (NULL si fue eliminada)
-- userId (TEXT): ID del usuario que realizó el cambio
-- action (TEXT): Tipo de acción (CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE)
-- provider (TEXT): Nombre del proveedor (openai, google, anthropic, cohere)
-- changesDetails (JSONB): Detalles de cambios { oldValues: {...}, newValues: {...} }
-- description (TEXT): Descripción legible (ej: "Actualizada configuración de openai")
-- ipAddress (TEXT): Dirección IP del cliente
-- createdAt (TIMESTAMP): Fecha/hora del cambio

-- ============================================================================
-- EJEMPLOS DE REGISTROS
-- ============================================================================

-- Ejemplo 1: Crear una nueva configuración
INSERT INTO "ai_provider_config_audits" (
  "id", "tenantId", "aiProviderConfigId", "userId", "action", 
  "provider", "changesDetails", "description", "ipAddress", "createdAt"
) VALUES (
  'clz7k8m9n0p1q2r3s4t5u6v7w',
  'tenant_123',
  'config_789',
  'user_456',
  'CREATE',
  'openai',
  '{"newValues": {"provider": "openai", "isActive": true}}',
  'Creada nueva configuración para openai',
  '192.168.1.100',
  NOW()
);

-- Ejemplo 2: Actualizar configuración (cambio de API Key)
INSERT INTO "ai_provider_config_audits" (
  "id", "tenantId", "aiProviderConfigId", "userId", "action", 
  "provider", "changesDetails", "description", "ipAddress", "createdAt"
) VALUES (
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

-- Ejemplo 3: Activar configuración
INSERT INTO "ai_provider_config_audits" (
  "id", "tenantId", "aiProviderConfigId", "userId", "action", 
  "provider", "changesDetails", "description", "ipAddress", "createdAt"
) VALUES (
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

-- Ejemplo 4: Desactivar configuración
INSERT INTO "ai_provider_config_audits" (
  "id", "tenantId", "aiProviderConfigId", "userId", "action", 
  "provider", "changesDetails", "description", "ipAddress", "createdAt"
) VALUES (
  'clz7k8m9n0p1q2r3s4t5u6v8z',
  'tenant_123',
  'config_789',
  'user_456',
  'DEACTIVATE',
  'openai',
  '{"oldValues": {"isActive": true}, "newValues": {"isActive": false}}',
  'Desactivada configuración de openai',
  '192.168.1.100',
  NOW()
);

-- Ejemplo 5: Eliminar configuración (aiProviderConfigId se pone NULL)
INSERT INTO "ai_provider_config_audits" (
  "id", "tenantId", "aiProviderConfigId", "userId", "action", 
  "provider", "changesDetails", "description", "ipAddress", "createdAt"
) VALUES (
  'clz7k8m9n0p1q2r3s4t5u6v9a',
  'tenant_123',
  NULL,  -- La config fue eliminada, por eso es NULL
  'user_456',
  'DELETE',
  'openai',
  '{}',
  'Eliminada configuración de openai',
  '192.168.1.100',
  NOW()
);

-- ============================================================================
-- QUERIES ÚTILES
-- ============================================================================

-- 1. Ver todas las auditorías de un tenant
SELECT 
  id,
  action,
  provider,
  description,
  "createdAt",
  ipAddress
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
ORDER BY "createdAt" DESC;

-- 2. Ver cambios de una configuración específica
SELECT 
  action,
  provider,
  "changesDetails",
  description,
  "createdAt"
FROM "ai_provider_config_audits"
WHERE "aiProviderConfigId" = 'config_789'
ORDER BY "createdAt" DESC;

-- 3. Ver cambios realizados por un usuario
SELECT 
  action,
  provider,
  description,
  "createdAt",
  "ipAddress"
FROM "ai_provider_config_audits"
WHERE "userId" = 'user_456'
  AND "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;

-- 4. Ver solo eliminaciones (acciones sensibles)
SELECT 
  "userId",
  provider,
  description,
  "createdAt",
  "ipAddress"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
  AND action = 'DELETE'
ORDER BY "createdAt" DESC;

-- 5. Ver cambios en las últimas 24 horas
SELECT 
  action,
  provider,
  "userId",
  "createdAt",
  "ipAddress"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
  AND "createdAt" >= NOW() - INTERVAL '1 day'
ORDER BY "createdAt" DESC;

-- 6. Estadísticas por acción
SELECT 
  action,
  COUNT(*) as total,
  COUNT(DISTINCT "userId") as unique_users,
  MAX("createdAt") as ultima_accion
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
GROUP BY action
ORDER BY total DESC;

-- 7. Ver historial de un proveedor
SELECT 
  "userId",
  action,
  "changesDetails",
  description,
  "createdAt"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
  AND provider = 'openai'
ORDER BY "createdAt" DESC;

-- 8. Auditoría por rango de fechas
SELECT 
  id,
  action,
  provider,
  "userId",
  "createdAt",
  "ipAddress"
FROM "ai_provider_config_audits"
WHERE "tenantId" = 'tenant_123'
  AND "createdAt" BETWEEN '2025-11-01'::timestamp AND '2025-11-04'::timestamp
ORDER BY "createdAt" DESC;

-- ============================================================================
-- INFORMACIÓN IMPORTANTE
-- ============================================================================

-- CASCADE vs SET NULL:
-- - tenantId: CASCADE - Si se elimina el tenant, se eliminan todas sus auditorías
-- - aiProviderConfigId: SET NULL - Si se elimina la config, se preserva el auditLog pero con NULL
-- - userId: CASCADE - Si se elimina el usuario, se eliminan sus auditorías

-- Índices para Performance:
-- - tenantId: Búsqueda por tenant (aislamiento)
-- - aiProviderConfigId: Historial de una config específica
-- - userId: Cambios realizados por un usuario
-- - createdAt: Ordenamiento y rango de fechas
-- - action: Filtrado por tipo de acción

-- JSONB vs JSON:
-- Se usa JSONB (Binary JSON) en PostgreSQL porque:
-- 1. Mejor performance en queries
-- 2. Soporta índices
-- 3. Más eficiente en almacenamiento

-- Tamaño estimado de registros:
-- - Pequeño: ~300-500 bytes por registro
-- - Tabla de 10,000 registros: ~3-5 MB
-- - Tabla de 100,000 registros: ~30-50 MB

-- ============================================================================
-- MANTENIMIENTO
-- ============================================================================

-- Para eliminar registros más antiguos de 90 días (retención de datos):
-- DELETE FROM "ai_provider_config_audits"
-- WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Para optimizar tabla después de muchas eliminaciones:
-- VACUUM ANALYZE "ai_provider_config_audits";

-- Para ver tamaño de la tabla:
-- SELECT 
--   pg_size_pretty(pg_total_relation_size('ai_provider_config_audits')) as tamaño;

-- ============================================================================
-- VERSIÓN
-- Prisma: 6.18.0
-- PostgreSQL: 13+
-- Fecha: 4 de Noviembre de 2025
-- ============================================================================
