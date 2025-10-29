-- Full consolidated schema migration for Plexo
-- Generated: 2025-10-22
-- This file consolidates all existing migration SQL files into a single
-- baseline migration suitable for initializing a fresh PostgreSQL database.
-- It deduplicates enums and orders CREATE TABLE / CREATE INDEX statements
-- before adding FOREIGN KEY constraints.

BEGIN;

-- -------------------------
-- ENUM TYPES (deduplicated)
-- -------------------------
CREATE TYPE IF NOT EXISTS "LegacyUserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER', 'CLIENT_EXTERNAL');
CREATE TYPE IF NOT EXISTS "ClientType" AS ENUM ('GENERAL', 'COLABORADOR', 'EXTERNO');
CREATE TYPE IF NOT EXISTS "RoleType" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'SALES', 'COORDINATOR', 'FINANCE', 'USER', 'CLIENT_EXTERNAL');
CREATE TYPE IF NOT EXISTS "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT');
CREATE TYPE IF NOT EXISTS "PermissionResource" AS ENUM ('EVENTS', 'CLIENTS', 'QUOTES', 'USERS', 'ROLES', 'REPORTS', 'VENUES', 'PRODUCTS', 'SERVICES', 'PACKAGES', 'CONFIGURATIONS');
CREATE TYPE IF NOT EXISTS "EventStatus" AS ENUM ('RESERVED', 'QUOTED', 'CONFIRMED', 'CANCELLED');
CREATE TYPE IF NOT EXISTS "QuoteStatus" AS ENUM ('DRAFT', 'PENDING_MANAGER', 'REJECTED_BY_MANAGER', 'APPROVED_BY_MANAGER', 'SENT_TO_CLIENT', 'CLIENT_REQUESTED_CHANGES', 'ACCEPTED_BY_CLIENT', 'EXPIRED', 'CANCELLED');
CREATE TYPE IF NOT EXISTS "PriceType" AS ENUM ('GENERAL', 'FRIENDS', 'CORPORATE', 'VIP', 'CUSTOM');
CREATE TYPE IF NOT EXISTS "PackageType" AS ENUM ('BASICO', 'VIP', 'GOLD', 'DIAMANTE');
CREATE TYPE IF NOT EXISTS "SupplierType" AS ENUM ('PRODUCT', 'SERVICE');
CREATE TYPE IF NOT EXISTS "ItemType" AS ENUM ('CONSUMO', 'VENTA');
CREATE TYPE IF NOT EXISTS "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'AUTHORIZED', 'IN_PROCESS', 'IN_MEDIATION', 'REJECTED', 'CANCELLED', 'REFUNDED', 'CHARGED_BACK');
CREATE TYPE IF NOT EXISTS "CommentType" AS ENUM ('INTERNAL_MANAGER', 'CLIENT_FEEDBACK', 'SYSTEM_NOTE');
CREATE TYPE IF NOT EXISTS "TemplateType" AS ENUM ('QUOTE', 'CONTRACT', 'INVOICE', 'EMAIL', 'PROPOSAL');
CREATE TYPE IF NOT EXISTS "EmailCategory" AS ENUM ('REGISTRATION', 'PASSWORD_RESET', 'ACTIVATION_REMINDER', 'QUOTE_SEND', 'QUOTE_ACCEPTED', 'EVENT_CONFIRMATION', 'EVENT_REMINDER', 'MARKETING', 'TEST', 'GENERAL');
CREATE TYPE IF NOT EXISTS "EmailTemplateType" AS ENUM ('GLOBAL', 'TENANT_BASE', 'BUSINESS_BASE', 'CUSTOM', 'INHERITED');
CREATE TYPE IF NOT EXISTS "VenueType" AS ENUM ('VENUE', 'ROOM');
CREATE TYPE IF NOT EXISTS "ProductType" AS ENUM ('PRODUCT', 'SERVICE', 'PACKAGE');
CREATE TYPE IF NOT EXISTS "ExpenseCategory" AS ENUM ('RENT', 'UTILITIES', 'SALARIES', 'MARKETING', 'EQUIPMENT', 'MAINTENANCE', 'INSURANCE', 'TAXES', 'SUPPLIES', 'TRANSPORTATION', 'OTHER');

-- -------------------------
-- TABLES (CREATE TABLE IF NOT EXISTS)
-- -------------------------

-- tenants
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "domain" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- users
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "name" TEXT,
  "role" "LegacyUserRole" NOT NULL DEFAULT 'USER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "activationCode" TEXT,
  "isExternal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL
);

-- business_identities
CREATE TABLE IF NOT EXISTS "business_identities" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "logo" TEXT,
  "slogan" TEXT,
  "facebook" TEXT,
  "instagram" TEXT,
  "twitter" TEXT,
  "website" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL
);

-- locations
CREATE TABLE IF NOT EXISTS "locations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "businessIdentityId" TEXT NOT NULL,
  CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- accounts
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- roles
CREATE TABLE IF NOT EXISTS "roles" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "RoleType" NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "tenantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- user_roles
CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "tenantId" TEXT,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedBy" TEXT,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- permissions
CREATE TABLE IF NOT EXISTS "permissions" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "action" "PermissionAction" NOT NULL,
  "resource" "PermissionResource" NOT NULL,
  "conditions" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- work_shifts
CREATE TABLE IF NOT EXISTS "work_shifts" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id")
);

-- price_lists
CREATE TABLE IF NOT EXISTS "price_lists" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- rooms
CREATE TABLE IF NOT EXISTS "rooms" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "minCapacity" INTEGER NOT NULL,
  "maxCapacity" INTEGER NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#3B82F6',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "locationId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- room_pricing
CREATE TABLE IF NOT EXISTS "room_pricing" (
  "id" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "roomId" TEXT NOT NULL,
  "workShiftId" TEXT NOT NULL,
  "priceListId" TEXT NOT NULL,
  CONSTRAINT "room_pricing_pkey" PRIMARY KEY ("id")
);

-- package_templates
CREATE TABLE IF NOT EXISTS "package_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "PackageType" NOT NULL DEFAULT 'BASICO',
  "basePrice" DECIMAL(10,2),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "package_templates_pkey" PRIMARY KEY ("id")
);

-- package_template_items
CREATE TABLE IF NOT EXISTS "package_template_items" (
  "id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "description" TEXT,
  "packageTemplateId" TEXT NOT NULL,
  "productId" TEXT,
  "serviceId" TEXT,
  CONSTRAINT "package_template_items_pkey" PRIMARY KEY ("id")
);

-- package_upgrades
CREATE TABLE IF NOT EXISTS "package_upgrades" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "additionalPrice" DECIMAL(10,2) NOT NULL,
  "upgradeType" "PackageType" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "packageTemplateId" TEXT NOT NULL,
  CONSTRAINT "package_upgrades_pkey" PRIMARY KEY ("id")
);

-- venues
CREATE TABLE IF NOT EXISTS "venues" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "VenueType" NOT NULL,
  "capacity" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "imagenes" TEXT[],
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- BotSession
CREATE TABLE IF NOT EXISTS "BotSession" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BotSession_pkey" PRIMARY KEY ("id")
);

-- BotMessage
CREATE TABLE IF NOT EXISTS "BotMessage" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "text" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
);

-- supplier_products
CREATE TABLE IF NOT EXISTS "supplier_products" (
  "id" TEXT NOT NULL,
  "cost" DECIMAL(10,2) NOT NULL,
  "deliveryDays" INTEGER NOT NULL DEFAULT 1,
  "minQuantity" INTEGER DEFAULT 1,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "supplierId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- supplier_services
CREATE TABLE IF NOT EXISTS "supplier_services" (
  "id" TEXT NOT NULL,
  "pricePerUnit" DECIMAL(10,2) NOT NULL,
  "unit" TEXT NOT NULL,
  "minQuantity" INTEGER DEFAULT 1,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "supplierId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  CONSTRAINT "supplier_services_pkey" PRIMARY KEY ("id")
);

-- clients
CREATE TABLE IF NOT EXISTS "clients" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "type" "ClientType" NOT NULL DEFAULT 'GENERAL',
  "discountPercent" DECIMAL(5,2),
  "eventCounter" INTEGER NOT NULL DEFAULT 0,
  "freeEventsTarget" INTEGER,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  "priceListId" TEXT,
  "userId" TEXT,
  CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- client_credits
CREATE TABLE IF NOT EXISTS "client_credits" (
  "id" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "quoteId" TEXT,
  CONSTRAINT "client_credits_pkey" PRIMARY KEY ("id")
);

-- loyalty_points
CREATE TABLE IF NOT EXISTS "loyalty_points" (
  "id" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clientId" TEXT NOT NULL,
  "eventId" TEXT,
  CONSTRAINT "loyalty_points_pkey" PRIMARY KEY ("id")
);

-- products
CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "cost" DECIMAL(10,2),
  "price" DECIMAL(10,2) NOT NULL,
  "itemType" "ItemType" NOT NULL DEFAULT 'VENTA',
  "unit" TEXT NOT NULL DEFAULT 'pieza',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- services
CREATE TABLE IF NOT EXISTS "services" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "itemType" "ItemType" NOT NULL DEFAULT 'VENTA',
  "unit" TEXT NOT NULL DEFAULT 'servicio',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- master_events
CREATE TABLE IF NOT EXISTS "master_events" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "clientId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "master_events_pkey" PRIMARY KEY ("id")
);

-- events
CREATE TABLE IF NOT EXISTS "events" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "EventStatus" NOT NULL DEFAULT 'RESERVED',
  "notes" TEXT,
  "isFullVenue" BOOLEAN NOT NULL DEFAULT false,
  "colorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "roomId" TEXT,
  "venueId" TEXT,
  "masterEventId" TEXT,
  CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- quotes
CREATE TABLE IF NOT EXISTS "quotes" (
  "id" TEXT NOT NULL,
  "quoteNumber" TEXT NOT NULL,
  "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL,
  "validUntil" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "publicToken" TEXT,
  "templateId" TEXT,
  "generatedContent" JSONB,
  "pdfUrl" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "previousVersionId" TEXT,
  "sentAt" TIMESTAMP(3),
  "viewedAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "eventId" TEXT,
  CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- packages
CREATE TABLE IF NOT EXISTS "packages" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "packageTemplateId" TEXT,
  CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- package_items
CREATE TABLE IF NOT EXISTS "package_items" (
  "id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalPrice" DECIMAL(10,2) NOT NULL,
  "description" TEXT,
  "packageId" TEXT NOT NULL,
  "productId" TEXT,
  "serviceId" TEXT,
  CONSTRAINT "package_items_pkey" PRIMARY KEY ("id")
);

-- quote_comments
CREATE TABLE IF NOT EXISTS "quote_comments" (
  "id" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "type" "CommentType" NOT NULL DEFAULT 'INTERNAL_MANAGER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "quoteId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "quote_comments_pkey" PRIMARY KEY ("id")
);

-- quote_templates
CREATE TABLE IF NOT EXISTS "quote_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "TemplateType" NOT NULL DEFAULT 'QUOTE',
  "category" TEXT,
  "htmlContent" TEXT NOT NULL,
  "variables" JSONB,
  "styles" JSONB,
  "metadata" JSONB,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  "businessIdentityId" TEXT NOT NULL,
  CONSTRAINT "quote_templates_pkey" PRIMARY KEY ("id")
);

-- email_templates
CREATE TABLE IF NOT EXISTS "email_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "htmlContent" TEXT NOT NULL,
  "textContent" TEXT,
  "variables" JSONB,
  "category" "EmailCategory" NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "parentTemplateId" TEXT,
  "templateType" "EmailTemplateType" NOT NULL DEFAULT 'CUSTOM',
  "isGlobal" BOOLEAN NOT NULL DEFAULT false,
  "inheritanceLevel" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "customizations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  "businessIdentityId" TEXT,
  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- configurations
CREATE TABLE IF NOT EXISTS "configurations" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "tableName" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "oldData" JSONB,
  "newData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- suppliers
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "SupplierType" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- email_changes
CREATE TABLE IF NOT EXISTS "email_changes" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_changes_pkey" PRIMARY KEY ("id")
);

-- email_logs
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "messageId" TEXT,
  "trackingToken" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL,
  "openedAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- payments
CREATE TABLE IF NOT EXISTS "payments" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GTQ',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" TEXT NOT NULL,
  "mercadoPagoPreferenceId" TEXT,
  "mercadoPagoPaymentId" TEXT,
  "externalReference" TEXT NOT NULL,
  "transactionId" TEXT,
  "authorizationCode" TEXT,
  "installments" INTEGER,
  "metadata" JSONB,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- conversations (from 20251019165308)
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'web',
  "userPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "endedAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- conversation_messages
CREATE TABLE IF NOT EXISTS "conversation_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- content_embeddings
CREATE TABLE IF NOT EXISTS "content_embeddings" (
  "id" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" DOUBLE PRECISION[],
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "content_embeddings_pkey" PRIMARY KEY ("id")
);

-- tenant_email_configs
CREATE TABLE IF NOT EXISTS "tenant_email_configs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "smtpHost" TEXT,
  "smtpPort" INTEGER NOT NULL DEFAULT 587,
  "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
  "smtpUser" TEXT,
  "smtpPassword" TEXT,
  "fromEmail" TEXT,
  "fromName" TEXT,
  "replyToEmail" TEXT,
  "provider" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_email_configs_pkey" PRIMARY KEY ("id")
);

-- widget_api_keys
CREATE TABLE IF NOT EXISTS "widget_api_keys" (
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

-- widget_configs
CREATE TABLE IF NOT EXISTS "widget_configs" (
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

-- widget_conversations
CREATE TABLE IF NOT EXISTS "widget_conversations" (
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

-- widget_messages
CREATE TABLE IF NOT EXISTS "widget_messages" (
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

-- expenses
CREATE TABLE IF NOT EXISTS "expenses" (
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

-- client_documents
CREATE TABLE IF NOT EXISTS "client_documents" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "clientId" TEXT NOT NULL,
  CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- -------------------------
-- INDEXES
-- -------------------------

CREATE INDEX IF NOT EXISTS "business_identities_tenantId_idx" ON "business_identities"("tenantId");
CREATE INDEX IF NOT EXISTS "business_identities_isActive_idx" ON "business_identities"("isActive");
CREATE INDEX IF NOT EXISTS "locations_businessIdentityId_idx" ON "locations"("businessIdentityId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key" ON "roles"("name");
CREATE INDEX IF NOT EXISTS "roles_type_idx" ON "roles"("type");
CREATE INDEX IF NOT EXISTS "roles_tenantId_idx" ON "roles"("tenantId");
CREATE INDEX IF NOT EXISTS "user_roles_userId_idx" ON "user_roles"("userId");
CREATE INDEX IF NOT EXISTS "user_roles_roleId_idx" ON "user_roles"("roleId");
CREATE INDEX IF NOT EXISTS "user_roles_tenantId_idx" ON "user_roles"("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_userId_roleId_tenantId_key" ON "user_roles"("userId", "roleId", "tenantId");
CREATE INDEX IF NOT EXISTS "permissions_roleId_idx" ON "permissions"("roleId");
CREATE INDEX IF NOT EXISTS "permissions_action_idx" ON "permissions"("action");
CREATE INDEX IF NOT EXISTS "permissions_resource_idx" ON "permissions"("resource");
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_roleId_action_resource_key" ON "permissions"("roleId", "action", "resource");
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_domain_key" ON "tenants"("domain");
CREATE INDEX IF NOT EXISTS "work_shifts_tenantId_idx" ON "work_shifts"("tenantId");
CREATE INDEX IF NOT EXISTS "price_lists_tenantId_idx" ON "price_lists"("tenantId");
CREATE INDEX IF NOT EXISTS "rooms_locationId_idx" ON "rooms"("locationId");
CREATE INDEX IF NOT EXISTS "rooms_venueId_idx" ON "rooms"("venueId");
CREATE INDEX IF NOT EXISTS "room_pricing_roomId_idx" ON "room_pricing"("roomId");
CREATE INDEX IF NOT EXISTS "room_pricing_workShiftId_idx" ON "room_pricing"("workShiftId");
CREATE INDEX IF NOT EXISTS "room_pricing_priceListId_idx" ON "room_pricing"("priceListId");
CREATE UNIQUE INDEX IF NOT EXISTS "room_pricing_roomId_workShiftId_priceListId_key" ON "room_pricing"("roomId", "workShiftId", "priceListId");
CREATE INDEX IF NOT EXISTS "package_templates_tenantId_idx" ON "package_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "package_templates_type_idx" ON "package_templates"("type");
CREATE INDEX IF NOT EXISTS "package_template_items_packageTemplateId_idx" ON "package_template_items"("packageTemplateId");
CREATE INDEX IF NOT EXISTS "package_upgrades_packageTemplateId_idx" ON "package_upgrades"("packageTemplateId");
CREATE INDEX IF NOT EXISTS "venues_tenantId_idx" ON "venues"("tenantId");
CREATE INDEX IF NOT EXISTS "venues_isActive_idx" ON "venues"("isActive");
CREATE INDEX IF NOT EXISTS "venues_type_idx" ON "venues"("type");
CREATE UNIQUE INDEX IF NOT EXISTS "BotSession_phone_tenantId_key" ON "BotSession"("phone", "tenantId");
CREATE INDEX IF NOT EXISTS "supplier_products_supplierId_idx" ON "supplier_products"("supplierId");
CREATE INDEX IF NOT EXISTS "supplier_products_productId_idx" ON "supplier_products"("productId");
CREATE INDEX IF NOT EXISTS "supplier_services_supplierId_idx" ON "supplier_services"("supplierId");
CREATE INDEX IF NOT EXISTS "supplier_services_serviceId_idx" ON "supplier_services"("serviceId");
CREATE UNIQUE INDEX IF NOT EXISTS "clients_userId_key" ON "clients"("userId");
CREATE INDEX IF NOT EXISTS "clients_tenantId_idx" ON "clients"("tenantId");
CREATE INDEX IF NOT EXISTS "clients_type_idx" ON "clients"("type");
CREATE INDEX IF NOT EXISTS "clients_isActive_idx" ON "clients"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "clients_email_tenantId_key" ON "clients"("email", "tenantId");
CREATE INDEX IF NOT EXISTS "client_credits_clientId_idx" ON "client_credits"("clientId");
CREATE INDEX IF NOT EXISTS "client_credits_userId_idx" ON "client_credits"("userId");
CREATE INDEX IF NOT EXISTS "client_credits_type_idx" ON "client_credits"("type");
CREATE INDEX IF NOT EXISTS "loyalty_points_clientId_idx" ON "loyalty_points"("clientId");
CREATE INDEX IF NOT EXISTS "products_tenantId_idx" ON "products"("tenantId");
CREATE INDEX IF NOT EXISTS "services_tenantId_idx" ON "services"("tenantId");
CREATE INDEX IF NOT EXISTS "master_events_tenantId_idx" ON "master_events"("tenantId");
CREATE INDEX IF NOT EXISTS "master_events_clientId_idx" ON "master_events"("clientId");
CREATE INDEX IF NOT EXISTS "events_tenantId_idx" ON "events"("tenantId");
CREATE INDEX IF NOT EXISTS "events_clientId_idx" ON "events"("clientId");
CREATE INDEX IF NOT EXISTS "events_roomId_idx" ON "events"("roomId");
CREATE INDEX IF NOT EXISTS "events_venueId_idx" ON "events"("venueId");
CREATE INDEX IF NOT EXISTS "events_startDate_idx" ON "events"("startDate");
CREATE INDEX IF NOT EXISTS "events_isFullVenue_idx" ON "events"("isFullVenue");
CREATE INDEX IF NOT EXISTS "events_masterEventId_idx" ON "events"("masterEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_quoteNumber_key" ON "quotes"("quoteNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_publicToken_key" ON "quotes"("publicToken");
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_eventId_key" ON "quotes"("eventId");
CREATE INDEX IF NOT EXISTS "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX IF NOT EXISTS "quotes_clientId_idx" ON "quotes"("clientId");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "quotes"("status");
CREATE INDEX IF NOT EXISTS "quotes_templateId_idx" ON "quotes"("templateId");
CREATE INDEX IF NOT EXISTS "packages_tenantId_idx" ON "packages"("tenantId");
CREATE INDEX IF NOT EXISTS "packages_quoteId_idx" ON "packages"("quoteId");
CREATE INDEX IF NOT EXISTS "package_items_packageId_idx" ON "package_items"("packageId");
CREATE INDEX IF NOT EXISTS "quote_comments_quoteId_idx" ON "quote_comments"("quoteId");
CREATE INDEX IF NOT EXISTS "quote_templates_tenantId_idx" ON "quote_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "quote_templates_businessIdentityId_idx" ON "quote_templates"("businessIdentityId");
CREATE INDEX IF NOT EXISTS "quote_templates_type_category_idx" ON "quote_templates"("type", "category");
CREATE INDEX IF NOT EXISTS "email_templates_tenantId_idx" ON "email_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "email_templates_businessIdentityId_idx" ON "email_templates"("businessIdentityId");
CREATE INDEX IF NOT EXISTS "email_templates_category_idx" ON "email_templates"("category");
CREATE INDEX IF NOT EXISTS "email_templates_isDefault_category_idx" ON "email_templates"("isDefault", "category");
CREATE INDEX IF NOT EXISTS "email_templates_parentTemplateId_idx" ON "email_templates"("parentTemplateId");
CREATE INDEX IF NOT EXISTS "email_templates_templateType_isGlobal_idx" ON "email_templates"("templateType", "isGlobal");
CREATE INDEX IF NOT EXISTS "email_templates_inheritanceLevel_idx" ON "email_templates"("inheritanceLevel");
CREATE UNIQUE INDEX IF NOT EXISTS "configurations_tenantId_key_key" ON "configurations"("tenantId", "key");
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");
CREATE UNIQUE INDEX IF NOT EXISTS "email_changes_token_key" ON "email_changes"("token");
CREATE INDEX IF NOT EXISTS "email_changes_userId_idx" ON "email_changes"("userId");
CREATE INDEX IF NOT EXISTS "email_changes_token_idx" ON "email_changes"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "email_logs_trackingToken_key" ON "email_logs"("trackingToken");
CREATE INDEX IF NOT EXISTS "email_logs_quoteId_idx" ON "email_logs"("quoteId");
CREATE INDEX IF NOT EXISTS "email_logs_trackingToken_idx" ON "email_logs"("trackingToken");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_externalReference_key" ON "payments"("externalReference");
CREATE INDEX IF NOT EXISTS "payments_tenantId_idx" ON "payments"("tenantId");
CREATE INDEX IF NOT EXISTS "payments_quoteId_idx" ON "payments"("quoteId");
CREATE INDEX IF NOT EXISTS "payments_externalReference_idx" ON "payments"("externalReference");
CREATE INDEX IF NOT EXISTS "payments_mercadoPagoPaymentId_idx" ON "payments"("mercadoPagoPaymentId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "conversations_userId_idx" ON "conversations"("userId");
CREATE INDEX IF NOT EXISTS "conversations_platform_idx" ON "conversations"("platform");
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations"("status");
CREATE INDEX IF NOT EXISTS "conversation_messages_conversationId_idx" ON "conversation_messages"("conversationId");
CREATE INDEX IF NOT EXISTS "conversation_messages_role_idx" ON "conversation_messages"("role");
CREATE INDEX IF NOT EXISTS "content_embeddings_entityId_idx" ON "content_embeddings"("entityId");
CREATE INDEX IF NOT EXISTS "content_embeddings_entityType_idx" ON "content_embeddings"("entityType");
CREATE INDEX IF NOT EXISTS "tenant_email_configs_tenantId_idx" ON "tenant_email_configs"("tenantId");
CREATE INDEX IF NOT EXISTS "tenant_email_configs_isActive_idx" ON "tenant_email_configs"("isActive");
CREATE INDEX IF NOT EXISTS "widget_api_keys_tenantId_idx" ON "widget_api_keys"("tenantId");
CREATE INDEX IF NOT EXISTS "widget_api_keys_isActive_idx" ON "widget_api_keys"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "widget_conversations_sessionId_key" ON "widget_conversations"("sessionId");
CREATE INDEX IF NOT EXISTS "widget_conversations_widgetApiKeyId_idx" ON "widget_conversations"("widgetApiKeyId");
CREATE INDEX IF NOT EXISTS "widget_conversations_sessionId_idx" ON "widget_conversations"("sessionId");
CREATE INDEX IF NOT EXISTS "widget_conversations_status_idx" ON "widget_conversations"("status");
CREATE INDEX IF NOT EXISTS "widget_conversations_userId_idx" ON "widget_conversations"("userId");
CREATE INDEX IF NOT EXISTS "widget_messages_conversationId_idx" ON "widget_messages"("conversationId");
CREATE INDEX IF NOT EXISTS "widget_messages_direction_idx" ON "widget_messages"("direction");
CREATE INDEX IF NOT EXISTS "widget_messages_createdAt_idx" ON "widget_messages"("createdAt");
CREATE INDEX IF NOT EXISTS "expenses_tenantId_idx" ON "expenses"("tenantId");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses"("date");

-- -------------------------
-- FOREIGN KEYS / CONSTRAINTS
-- -------------------------

ALTER TABLE IF EXISTS "business_identities" ADD CONSTRAINT IF NOT EXISTS "business_identities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "locations" ADD CONSTRAINT IF NOT EXISTS "locations_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "users" ADD CONSTRAINT IF NOT EXISTS "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "accounts" ADD CONSTRAINT IF NOT EXISTS "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "roles" ADD CONSTRAINT IF NOT EXISTS "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "user_roles" ADD CONSTRAINT IF NOT EXISTS "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "user_roles" ADD CONSTRAINT IF NOT EXISTS "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "user_roles" ADD CONSTRAINT IF NOT EXISTS "user_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "user_roles" ADD CONSTRAINT IF NOT EXISTS "user_roles_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "permissions" ADD CONSTRAINT IF NOT EXISTS "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "work_shifts" ADD CONSTRAINT IF NOT EXISTS "work_shifts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "price_lists" ADD CONSTRAINT IF NOT EXISTS "price_lists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "rooms" ADD CONSTRAINT IF NOT EXISTS "rooms_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "rooms" ADD CONSTRAINT IF NOT EXISTS "rooms_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "room_pricing" ADD CONSTRAINT IF NOT EXISTS "room_pricing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "room_pricing" ADD CONSTRAINT IF NOT EXISTS "room_pricing_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "work_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "room_pricing" ADD CONSTRAINT IF NOT EXISTS "room_pricing_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "package_templates" ADD CONSTRAINT IF NOT EXISTS "package_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "package_template_items" ADD CONSTRAINT IF NOT EXISTS "package_template_items_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "package_template_items" ADD CONSTRAINT IF NOT EXISTS "package_template_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "package_template_items" ADD CONSTRAINT IF NOT EXISTS "package_template_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "package_upgrades" ADD CONSTRAINT IF NOT EXISTS "package_upgrades_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "venues" ADD CONSTRAINT IF NOT EXISTS "venues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "supplier_products" ADD CONSTRAINT IF NOT EXISTS "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "supplier_products" ADD CONSTRAINT IF NOT EXISTS "supplier_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "supplier_services" ADD CONSTRAINT IF NOT EXISTS "supplier_services_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "supplier_services" ADD CONSTRAINT IF NOT EXISTS "supplier_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "clients" ADD CONSTRAINT IF NOT EXISTS "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "clients" ADD CONSTRAINT IF NOT EXISTS "clients_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "clients" ADD CONSTRAINT IF NOT EXISTS "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "client_credits" ADD CONSTRAINT IF NOT EXISTS "client_credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "client_credits" ADD CONSTRAINT IF NOT EXISTS "client_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "client_credits" ADD CONSTRAINT IF NOT EXISTS "client_credits_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "loyalty_points" ADD CONSTRAINT IF NOT EXISTS "loyalty_points_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "loyalty_points" ADD CONSTRAINT IF NOT EXISTS "loyalty_points_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "products" ADD CONSTRAINT IF NOT EXISTS "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "services" ADD CONSTRAINT IF NOT EXISTS "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "master_events" ADD CONSTRAINT IF NOT EXISTS "master_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "master_events" ADD CONSTRAINT IF NOT EXISTS "master_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "events" ADD CONSTRAINT IF NOT EXISTS "events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "events" ADD CONSTRAINT IF NOT EXISTS "events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "events" ADD CONSTRAINT IF NOT EXISTS "events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "events" ADD CONSTRAINT IF NOT EXISTS "events_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "events" ADD CONSTRAINT IF NOT EXISTS "events_masterEventId_fkey" FOREIGN KEY ("masterEventId") REFERENCES "master_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "quotes" ADD CONSTRAINT IF NOT EXISTS "quotes_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "quote_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "quotes" ADD CONSTRAINT IF NOT EXISTS "quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "quotes" ADD CONSTRAINT IF NOT EXISTS "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "quotes" ADD CONSTRAINT IF NOT EXISTS "quotes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "packages" ADD CONSTRAINT IF NOT EXISTS "packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "packages" ADD CONSTRAINT IF NOT EXISTS "packages_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "packages" ADD CONSTRAINT IF NOT EXISTS "packages_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "package_items" ADD CONSTRAINT IF NOT EXISTS "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "package_items" ADD CONSTRAINT IF NOT EXISTS "package_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "package_items" ADD CONSTRAINT IF NOT EXISTS "package_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "quote_comments" ADD CONSTRAINT IF NOT EXISTS "quote_comments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "quote_comments" ADD CONSTRAINT IF NOT EXISTS "quote_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "quote_templates" ADD CONSTRAINT IF NOT EXISTS "quote_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "quote_templates" ADD CONSTRAINT IF NOT EXISTS "quote_templates_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "email_templates" ADD CONSTRAINT IF NOT EXISTS "email_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "email_templates" ADD CONSTRAINT IF NOT EXISTS "email_templates_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "email_templates" ADD CONSTRAINT IF NOT EXISTS "email_templates_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "configurations" ADD CONSTRAINT IF NOT EXISTS "configurations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "audit_logs" ADD CONSTRAINT IF NOT EXISTS "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "audit_logs" ADD CONSTRAINT IF NOT EXISTS "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "suppliers" ADD CONSTRAINT IF NOT EXISTS "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "email_changes" ADD CONSTRAINT IF NOT EXISTS "email_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "email_logs" ADD CONSTRAINT IF NOT EXISTS "email_logs_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "payments" ADD CONSTRAINT IF NOT EXISTS "payments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "payments" ADD CONSTRAINT IF NOT EXISTS "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "conversation_messages" ADD CONSTRAINT IF NOT EXISTS "conversation_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "content_embeddings" ADD CONSTRAINT IF NOT EXISTS "content_embeddings_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "tenant_email_configs" ADD CONSTRAINT IF NOT EXISTS "tenant_email_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "widget_api_keys" ADD CONSTRAINT IF NOT EXISTS "widget_api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "widget_configs" ADD CONSTRAINT IF NOT EXISTS "widget_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "widget_conversations" ADD CONSTRAINT IF NOT EXISTS "widget_conversations_widgetApiKeyId_fkey" FOREIGN KEY ("widgetApiKeyId") REFERENCES "widget_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "widget_messages" ADD CONSTRAINT IF NOT EXISTS "widget_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "widget_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "expenses" ADD CONSTRAINT IF NOT EXISTS "expenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "client_documents" ADD CONSTRAINT IF NOT EXISTS "client_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

-- End of consolidated migration
