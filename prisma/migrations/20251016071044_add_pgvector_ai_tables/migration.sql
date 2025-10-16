-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "content_embeddings" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "platform" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "whatsappName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "tokens" INTEGER,
    "model" TEXT,
    "toolCalls" JSONB,
    "whatsappMessageId" TEXT,
    "whatsappStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "handler" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_analytics" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "userMessages" INTEGER NOT NULL DEFAULT 0,
    "assistantMessages" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "wasHelpful" BOOLEAN,
    "userSatisfaction" INTEGER,
    "resolvedQuery" BOOLEAN NOT NULL DEFAULT false,
    "escalatedToHuman" BOOLEAN NOT NULL DEFAULT false,
    "intent" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_embeddings_contentType_idx" ON "content_embeddings"("contentType");

-- CreateIndex
CREATE INDEX "content_embeddings_contentId_idx" ON "content_embeddings"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_sessionId_key" ON "conversations"("sessionId");

-- CreateIndex
CREATE INDEX "conversations_platform_idx" ON "conversations"("platform");

-- CreateIndex
CREATE INDEX "conversations_whatsappNumber_idx" ON "conversations"("whatsappNumber");

-- CreateIndex
CREATE INDEX "conversations_isActive_idx" ON "conversations"("isActive");

-- CreateIndex
CREATE INDEX "conversation_messages_conversationId_idx" ON "conversation_messages"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_messages_role_idx" ON "conversation_messages"("role");

-- CreateIndex
CREATE INDEX "conversation_messages_createdAt_idx" ON "conversation_messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_tools_name_key" ON "agent_tools"("name");

-- CreateIndex
CREATE INDEX "agent_tools_isActive_idx" ON "agent_tools"("isActive");

-- CreateIndex
CREATE INDEX "agent_tools_category_idx" ON "agent_tools"("category");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_analytics_conversationId_key" ON "conversation_analytics"("conversationId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_analytics" ADD CONSTRAINT "conversation_analytics_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
