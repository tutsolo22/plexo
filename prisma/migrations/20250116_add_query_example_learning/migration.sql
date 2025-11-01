-- CreateTable para QueryExample (RAG Learning System)
CREATE TABLE "query_examples" (
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

-- CreateIndex
CREATE INDEX "query_examples_tenantId_idx" ON "query_examples"("tenantId");

CREATE INDEX "query_examples_intent_idx" ON "query_examples"("intent");

CREATE INDEX "query_examples_entity_idx" ON "query_examples"("entity");

CREATE INDEX "query_examples_success_idx" ON "query_examples"("success");

-- AddForeignKey
ALTER TABLE "query_examples" ADD CONSTRAINT "query_examples_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
