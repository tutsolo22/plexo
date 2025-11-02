-- Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Agregar campos de onboarding al modelo Tenant
ALTER TABLE "tenants" 
ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER NOT NULL DEFAULT 0;

-- Crear tabla query_examples para RAG Learning System
CREATE TABLE IF NOT EXISTS "query_examples" (
    "id" TEXT NOT NULL,
    "userQuery" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "filters" JSONB,
    "response" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "embedding" vector(768),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_examples_pkey" PRIMARY KEY ("id")
);

-- Crear índices para query_examples
CREATE INDEX IF NOT EXISTS "query_examples_tenantId_idx" ON "query_examples"("tenantId");
CREATE INDEX IF NOT EXISTS "query_examples_intent_idx" ON "query_examples"("intent");
CREATE INDEX IF NOT EXISTS "query_examples_entity_idx" ON "query_examples"("entity");
CREATE INDEX IF NOT EXISTS "query_examples_success_idx" ON "query_examples"("success");

-- Agregar foreign key
ALTER TABLE "query_examples" 
ADD CONSTRAINT "query_examples_tenantId_fkey" 
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
