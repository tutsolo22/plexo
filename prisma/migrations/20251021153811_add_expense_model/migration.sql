-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'UTILITIES', 'SALARIES', 'MARKETING', 'EQUIPMENT', 'MAINTENANCE', 'INSURANCE', 'TAXES', 'SUPPLIES', 'TRANSPORTATION', 'OTHER');

-- CreateTable
CREATE TABLE "widget_api_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allowedOrigins" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#007bff',
    "secondaryColor" TEXT NOT NULL DEFAULT '#6c757d',
    "position" TEXT NOT NULL DEFAULT 'right',
    "welcomeMessage" TEXT NOT NULL DEFAULT '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?',
    "offlineMessage" TEXT NOT NULL DEFAULT 'Estamos fuera de línea. Déjanos tu mensaje y te contactaremos pronto.',
    "businessHours" JSONB,
    "showTypingIndicator" BOOLEAN NOT NULL DEFAULT true,
    "allowFileUpload" BOOLEAN NOT NULL DEFAULT true,
    "maxFileSize" INTEGER NOT NULL DEFAULT 5242880,
    "autoOpenDelay" INTEGER,
    "businessName" TEXT,
    "businessDescription" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_conversations" (
    "id" TEXT NOT NULL,
    "widgetApiKeyId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "sessionId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "fileUrl" TEXT,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "widget_api_keys_apiKey_key" ON "widget_api_keys"("apiKey");

-- CreateIndex
CREATE INDEX "widget_api_keys_tenantId_idx" ON "widget_api_keys"("tenantId");

-- CreateIndex
CREATE INDEX "widget_api_keys_apiKey_idx" ON "widget_api_keys"("apiKey");

-- CreateIndex
CREATE INDEX "widget_api_keys_isActive_idx" ON "widget_api_keys"("isActive");

-- CreateIndex
CREATE INDEX "widget_configs_tenantId_idx" ON "widget_configs"("tenantId");

-- CreateIndex
CREATE INDEX "widget_configs_isActive_idx" ON "widget_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "widget_conversations_sessionId_key" ON "widget_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "widget_conversations_widgetApiKeyId_idx" ON "widget_conversations"("widgetApiKeyId");

-- CreateIndex
CREATE INDEX "widget_conversations_sessionId_idx" ON "widget_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "widget_conversations_status_idx" ON "widget_conversations"("status");

-- CreateIndex
CREATE INDEX "widget_conversations_userId_idx" ON "widget_conversations"("userId");

-- CreateIndex
CREATE INDEX "widget_messages_conversationId_idx" ON "widget_messages"("conversationId");

-- CreateIndex
CREATE INDEX "widget_messages_direction_idx" ON "widget_messages"("direction");

-- CreateIndex
CREATE INDEX "widget_messages_createdAt_idx" ON "widget_messages"("createdAt");

-- CreateIndex
CREATE INDEX "expenses_tenantId_idx" ON "expenses"("tenantId");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- AddForeignKey
ALTER TABLE "widget_api_keys" ADD CONSTRAINT "widget_api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_conversations" ADD CONSTRAINT "widget_conversations_widgetApiKeyId_fkey" FOREIGN KEY ("widgetApiKeyId") REFERENCES "widget_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_messages" ADD CONSTRAINT "widget_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "widget_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
