-- ============================================
-- SCRIPT DE BASE DE DATOS COMPLETO
-- Gestión de Eventos - Con pgvector y optimizaciones
-- Super Admin incluido
-- ============================================

-- 1. Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. CREAR TABLAS EN ORDEN DE DEPENDENCIAS

-- Tabla: tenants (primero porque muchas tablas dependen de ella)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL UNIQUE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "activationCode" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: user_roles
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "tenantId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "user_roles_userId_roleId_tenantId_key" UNIQUE ("userId", "roleId", "tenantId"),
    CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: permissions
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_roleId_action_resource_key" UNIQUE ("roleId", "action", "resource"),
    CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: accounts
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: business_identities
CREATE TABLE IF NOT EXISTS "business_identities" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "business_identities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: locations
CREATE TABLE IF NOT EXISTS "locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessIdentityId" TEXT NOT NULL,
    CONSTRAINT "locations_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: venues
CREATE TABLE IF NOT EXISTS "venues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagenes" TEXT[],
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "venues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: rooms
CREATE TABLE IF NOT EXISTS "rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minCapacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    CONSTRAINT "rooms_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rooms_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: work_shifts
CREATE TABLE IF NOT EXISTS "work_shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "work_shifts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: price_lists
CREATE TABLE IF NOT EXISTS "price_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "price_lists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: room_pricing
CREATE TABLE IF NOT EXISTS "room_pricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT NOT NULL,
    "workShiftId" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    CONSTRAINT "room_pricing_roomId_workShiftId_priceListId_key" UNIQUE ("roomId", "workShiftId", "priceListId"),
    CONSTRAINT "room_pricing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "room_pricing_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "work_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "room_pricing_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: clients
CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "company" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "discountPercent" DECIMAL(5,2),
    "eventCounter" INTEGER NOT NULL DEFAULT 0,
    "freeEventsTarget" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "priceListId" TEXT,
    "userId" TEXT UNIQUE,
    CONSTRAINT "clients_email_tenantId_key" UNIQUE ("email", "tenantId"),
    CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "clients_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: products
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2),
    "price" DECIMAL(10,2) NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'VENTA',
    "unit" TEXT NOT NULL DEFAULT 'pieza',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: services
CREATE TABLE IF NOT EXISTS "services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'VENTA',
    "unit" TEXT NOT NULL DEFAULT 'servicio',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: package_templates
CREATE TABLE IF NOT EXISTS "package_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BASICO',
    "basePrice" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "package_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: package_template_items
CREATE TABLE IF NOT EXISTS "package_template_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "packageTemplateId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    CONSTRAINT "package_template_items_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "package_template_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "package_template_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: package_upgrades
CREATE TABLE IF NOT EXISTS "package_upgrades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "additionalPrice" DECIMAL(10,2) NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "packageTemplateId" TEXT NOT NULL,
    CONSTRAINT "package_upgrades_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: master_events
CREATE TABLE IF NOT EXISTS "master_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "master_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "master_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: events
CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "notes" TEXT,
    "isFullVenue" BOOLEAN NOT NULL DEFAULT false,
    "colorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "roomId" TEXT,
    "venueId" TEXT,
    "masterEventId" TEXT,
    CONSTRAINT "events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_masterEventId_fkey" FOREIGN KEY ("masterEventId") REFERENCES "master_events"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: quote_templates
CREATE TABLE IF NOT EXISTS "quote_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'QUOTE',
    "category" TEXT,
    "htmlContent" TEXT NOT NULL,
    "variables" JSONB,
    "styles" JSONB,
    "metadata" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "businessIdentityId" TEXT NOT NULL,
    CONSTRAINT "quote_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quote_templates_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: quotes
CREATE TABLE IF NOT EXISTS "quotes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "publicToken" TEXT UNIQUE,
    "templateId" TEXT,
    "generatedContent" JSONB,
    "pdfUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "eventId" TEXT UNIQUE,
    CONSTRAINT "quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quotes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quotes_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "quote_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: packages
CREATE TABLE IF NOT EXISTS "packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "packageTemplateId" TEXT,
    CONSTRAINT "packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: package_items
CREATE TABLE IF NOT EXISTS "package_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "packageId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "package_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "package_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: quote_comments
CREATE TABLE IF NOT EXISTS "quote_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comment" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL_MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "quote_comments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quote_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: email_templates
CREATE TABLE IF NOT EXISTS "email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "category" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentTemplateId" TEXT,
    "templateType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "inheritanceLevel" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "customizations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "businessIdentityId" TEXT,
    CONSTRAINT "email_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_templates_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_templates_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: payments
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GTQ',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "mercadoPagoPreferenceId" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "externalReference" TEXT NOT NULL UNIQUE,
    "transactionId" TEXT,
    "authorizationCode" TEXT,
    "installments" INTEGER,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: configurations
CREATE TABLE IF NOT EXISTS "configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "configurations_tenantId_key_key" UNIQUE ("tenantId", "key"),
    CONSTRAINT "configurations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: suppliers
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: supplier_products
CREATE TABLE IF NOT EXISTS "supplier_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cost" DECIMAL(10,2) NOT NULL,
    "deliveryDays" INTEGER NOT NULL DEFAULT 1,
    "minQuantity" INTEGER DEFAULT 1,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "supplier_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: supplier_services
CREATE TABLE IF NOT EXISTS "supplier_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "minQuantity" INTEGER DEFAULT 1,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    CONSTRAINT "supplier_services_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "supplier_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: client_credits
CREATE TABLE IF NOT EXISTS "client_credits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT,
    CONSTRAINT "client_credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "client_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "client_credits_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: client_documents
CREATE TABLE IF NOT EXISTS "client_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "client_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: loyalty_points
CREATE TABLE IF NOT EXISTS "loyalty_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "eventId" TEXT,
    CONSTRAINT "loyalty_points_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "loyalty_points_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: email_changes
CREATE TABLE IF NOT EXISTS "email_changes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: email_logs
CREATE TABLE IF NOT EXISTS "email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "trackingToken" TEXT UNIQUE,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_logs_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: conversations
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "userPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "endedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: conversation_messages
CREATE TABLE IF NOT EXISTS "conversation_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversation_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: content_embeddings
CREATE TABLE IF NOT EXISTS "content_embeddings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tenant_email_configs
CREATE TABLE IF NOT EXISTS "tenant_email_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_email_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: widget_api_keys
CREATE TABLE IF NOT EXISTS "widget_api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allowedOrigins" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: widget_configs
CREATE TABLE IF NOT EXISTS "widget_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: widget_conversations
CREATE TABLE IF NOT EXISTS "widget_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "widgetApiKeyId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "sessionId" TEXT NOT NULL UNIQUE,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_conversations_widgetApiKeyId_fkey" FOREIGN KEY ("widgetApiKeyId") REFERENCES "widget_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: widget_messages
CREATE TABLE IF NOT EXISTS "widget_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "widget_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: expenses
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "expenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: BotSession
CREATE TABLE IF NOT EXISTS "BotSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BotSession_phone_tenantId_key" UNIQUE ("phone", "tenantId")
);

-- Tabla: BotMessage
CREATE TABLE IF NOT EXISTS "BotMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: query_examples (RAG Learning System con pgvector)
CREATE TABLE IF NOT EXISTS "query_examples" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "query_examples_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 3. CREAR ÍNDICES
-- ============================================

-- Índices para users
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");

-- Índices para roles
CREATE INDEX IF NOT EXISTS "roles_type_idx" ON "roles"("type");
CREATE INDEX IF NOT EXISTS "roles_tenantId_idx" ON "roles"("tenantId");

-- Índices para user_roles
CREATE INDEX IF NOT EXISTS "user_roles_userId_idx" ON "user_roles"("userId");
CREATE INDEX IF NOT EXISTS "user_roles_roleId_idx" ON "user_roles"("roleId");
CREATE INDEX IF NOT EXISTS "user_roles_tenantId_idx" ON "user_roles"("tenantId");

-- Índices para permissions
CREATE INDEX IF NOT EXISTS "permissions_roleId_idx" ON "permissions"("roleId");
CREATE INDEX IF NOT EXISTS "permissions_action_idx" ON "permissions"("action");
CREATE INDEX IF NOT EXISTS "permissions_resource_idx" ON "permissions"("resource");

-- Índices para business_identities
CREATE INDEX IF NOT EXISTS "business_identities_tenantId_idx" ON "business_identities"("tenantId");
CREATE INDEX IF NOT EXISTS "business_identities_isActive_idx" ON "business_identities"("isActive");

-- Índices para locations
CREATE INDEX IF NOT EXISTS "locations_businessIdentityId_idx" ON "locations"("businessIdentityId");

-- Índices para venues
CREATE INDEX IF NOT EXISTS "venues_tenantId_idx" ON "venues"("tenantId");
CREATE INDEX IF NOT EXISTS "venues_isActive_idx" ON "venues"("isActive");
CREATE INDEX IF NOT EXISTS "venues_type_idx" ON "venues"("type");

-- Índices para rooms
CREATE INDEX IF NOT EXISTS "rooms_locationId_idx" ON "rooms"("locationId");
CREATE INDEX IF NOT EXISTS "rooms_venueId_idx" ON "rooms"("venueId");

-- Índices para work_shifts
CREATE INDEX IF NOT EXISTS "work_shifts_tenantId_idx" ON "work_shifts"("tenantId");

-- Índices para price_lists
CREATE INDEX IF NOT EXISTS "price_lists_tenantId_idx" ON "price_lists"("tenantId");

-- Índices para room_pricing
CREATE INDEX IF NOT EXISTS "room_pricing_roomId_idx" ON "room_pricing"("roomId");
CREATE INDEX IF NOT EXISTS "room_pricing_workShiftId_idx" ON "room_pricing"("workShiftId");
CREATE INDEX IF NOT EXISTS "room_pricing_priceListId_idx" ON "room_pricing"("priceListId");

-- Índices para clients
CREATE INDEX IF NOT EXISTS "clients_tenantId_idx" ON "clients"("tenantId");
CREATE INDEX IF NOT EXISTS "clients_type_idx" ON "clients"("type");
CREATE INDEX IF NOT EXISTS "clients_isActive_idx" ON "clients"("isActive");
CREATE INDEX IF NOT EXISTS "clients_deletedAt_idx" ON "clients"("deletedAt");

-- Índices para products
CREATE INDEX IF NOT EXISTS "products_tenantId_idx" ON "products"("tenantId");

-- Índices para services
CREATE INDEX IF NOT EXISTS "services_tenantId_idx" ON "services"("tenantId");

-- Índices para package_templates
CREATE INDEX IF NOT EXISTS "package_templates_tenantId_idx" ON "package_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "package_templates_type_idx" ON "package_templates"("type");

-- Índices para package_template_items
CREATE INDEX IF NOT EXISTS "package_template_items_packageTemplateId_idx" ON "package_template_items"("packageTemplateId");

-- Índices para package_upgrades
CREATE INDEX IF NOT EXISTS "package_upgrades_packageTemplateId_idx" ON "package_upgrades"("packageTemplateId");

-- Índices para master_events
CREATE INDEX IF NOT EXISTS "master_events_tenantId_idx" ON "master_events"("tenantId");
CREATE INDEX IF NOT EXISTS "master_events_clientId_idx" ON "master_events"("clientId");

-- Índices para events
CREATE INDEX IF NOT EXISTS "events_tenantId_idx" ON "events"("tenantId");
CREATE INDEX IF NOT EXISTS "events_clientId_idx" ON "events"("clientId");
CREATE INDEX IF NOT EXISTS "events_roomId_idx" ON "events"("roomId");
CREATE INDEX IF NOT EXISTS "events_venueId_idx" ON "events"("venueId");
CREATE INDEX IF NOT EXISTS "events_startDate_idx" ON "events"("startDate");
CREATE INDEX IF NOT EXISTS "events_isFullVenue_idx" ON "events"("isFullVenue");
CREATE INDEX IF NOT EXISTS "events_masterEventId_idx" ON "events"("masterEventId");

-- Índices para quote_templates
CREATE INDEX IF NOT EXISTS "quote_templates_tenantId_idx" ON "quote_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "quote_templates_businessIdentityId_idx" ON "quote_templates"("businessIdentityId");
CREATE INDEX IF NOT EXISTS "quote_templates_type_category_idx" ON "quote_templates"("type", "category");

-- Índices para quotes
CREATE INDEX IF NOT EXISTS "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX IF NOT EXISTS "quotes_clientId_idx" ON "quotes"("clientId");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "quotes"("status");
CREATE INDEX IF NOT EXISTS "quotes_templateId_idx" ON "quotes"("templateId");

-- Índices para packages
CREATE INDEX IF NOT EXISTS "packages_tenantId_idx" ON "packages"("tenantId");
CREATE INDEX IF NOT EXISTS "packages_quoteId_idx" ON "packages"("quoteId");

-- Índices para package_items
CREATE INDEX IF NOT EXISTS "package_items_packageId_idx" ON "package_items"("packageId");

-- Índices para quote_comments
CREATE INDEX IF NOT EXISTS "quote_comments_quoteId_idx" ON "quote_comments"("quoteId");

-- Índices para email_templates
CREATE INDEX IF NOT EXISTS "email_templates_tenantId_idx" ON "email_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "email_templates_businessIdentityId_idx" ON "email_templates"("businessIdentityId");
CREATE INDEX IF NOT EXISTS "email_templates_category_idx" ON "email_templates"("category");
CREATE INDEX IF NOT EXISTS "email_templates_isDefault_category_idx" ON "email_templates"("isDefault", "category");
CREATE INDEX IF NOT EXISTS "email_templates_parentTemplateId_idx" ON "email_templates"("parentTemplateId");
CREATE INDEX IF NOT EXISTS "email_templates_templateType_isGlobal_idx" ON "email_templates"("templateType", "isGlobal");
CREATE INDEX IF NOT EXISTS "email_templates_inheritanceLevel_idx" ON "email_templates"("inheritanceLevel");

-- Índices para payments
CREATE INDEX IF NOT EXISTS "payments_tenantId_idx" ON "payments"("tenantId");
CREATE INDEX IF NOT EXISTS "payments_quoteId_idx" ON "payments"("quoteId");
CREATE INDEX IF NOT EXISTS "payments_externalReference_idx" ON "payments"("externalReference");
CREATE INDEX IF NOT EXISTS "payments_mercadoPagoPaymentId_idx" ON "payments"("mercadoPagoPaymentId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");

-- Índices para supplier_products
CREATE INDEX IF NOT EXISTS "supplier_products_supplierId_idx" ON "supplier_products"("supplierId");
CREATE INDEX IF NOT EXISTS "supplier_products_productId_idx" ON "supplier_products"("productId");

-- Índices para supplier_services
CREATE INDEX IF NOT EXISTS "supplier_services_supplierId_idx" ON "supplier_services"("supplierId");
CREATE INDEX IF NOT EXISTS "supplier_services_serviceId_idx" ON "supplier_services"("serviceId");

-- Índices para client_credits
CREATE INDEX IF NOT EXISTS "client_credits_clientId_idx" ON "client_credits"("clientId");
CREATE INDEX IF NOT EXISTS "client_credits_userId_idx" ON "client_credits"("userId");
CREATE INDEX IF NOT EXISTS "client_credits_type_idx" ON "client_credits"("type");

-- Índices para client_documents
CREATE INDEX IF NOT EXISTS "client_documents_clientId_idx" ON "client_documents"("clientId");
CREATE INDEX IF NOT EXISTS "client_documents_category_idx" ON "client_documents"("category");
CREATE INDEX IF NOT EXISTS "client_documents_isPublic_idx" ON "client_documents"("isPublic");

-- Índices para loyalty_points
CREATE INDEX IF NOT EXISTS "loyalty_points_clientId_idx" ON "loyalty_points"("clientId");

-- Índices para email_changes
CREATE INDEX IF NOT EXISTS "email_changes_userId_idx" ON "email_changes"("userId");
CREATE INDEX IF NOT EXISTS "email_changes_token_idx" ON "email_changes"("token");

-- Índices para email_logs
CREATE INDEX IF NOT EXISTS "email_logs_quoteId_idx" ON "email_logs"("quoteId");
CREATE INDEX IF NOT EXISTS "email_logs_trackingToken_idx" ON "email_logs"("trackingToken");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs"("status");

-- Índices para conversations
CREATE INDEX IF NOT EXISTS "conversations_userId_idx" ON "conversations"("userId");
CREATE INDEX IF NOT EXISTS "conversations_platform_idx" ON "conversations"("platform");
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations"("status");

-- Índices para conversation_messages
CREATE INDEX IF NOT EXISTS "conversation_messages_conversationId_idx" ON "conversation_messages"("conversationId");
CREATE INDEX IF NOT EXISTS "conversation_messages_role_idx" ON "conversation_messages"("role");

-- Índices para content_embeddings
CREATE INDEX IF NOT EXISTS "content_embeddings_entityId_idx" ON "content_embeddings"("entityId");
CREATE INDEX IF NOT EXISTS "content_embeddings_entityType_idx" ON "content_embeddings"("entityType");

-- Índices para tenant_email_configs
CREATE INDEX IF NOT EXISTS "tenant_email_configs_tenantId_idx" ON "tenant_email_configs"("tenantId");
CREATE INDEX IF NOT EXISTS "tenant_email_configs_isActive_idx" ON "tenant_email_configs"("isActive");

-- Índices para widget_api_keys
CREATE INDEX IF NOT EXISTS "widget_api_keys_tenantId_idx" ON "widget_api_keys"("tenantId");
CREATE INDEX IF NOT EXISTS "widget_api_keys_apiKey_idx" ON "widget_api_keys"("apiKey");
CREATE INDEX IF NOT EXISTS "widget_api_keys_isActive_idx" ON "widget_api_keys"("isActive");

-- Índices para widget_configs
CREATE INDEX IF NOT EXISTS "widget_configs_tenantId_idx" ON "widget_configs"("tenantId");
CREATE INDEX IF NOT EXISTS "widget_configs_isActive_idx" ON "widget_configs"("isActive");

-- Índices para widget_conversations
CREATE INDEX IF NOT EXISTS "widget_conversations_widgetApiKeyId_idx" ON "widget_conversations"("widgetApiKeyId");
CREATE INDEX IF NOT EXISTS "widget_conversations_sessionId_idx" ON "widget_conversations"("sessionId");
CREATE INDEX IF NOT EXISTS "widget_conversations_status_idx" ON "widget_conversations"("status");
CREATE INDEX IF NOT EXISTS "widget_conversations_userId_idx" ON "widget_conversations"("userId");

-- Índices para widget_messages
CREATE INDEX IF NOT EXISTS "widget_messages_conversationId_idx" ON "widget_messages"("conversationId");
CREATE INDEX IF NOT EXISTS "widget_messages_direction_idx" ON "widget_messages"("direction");
CREATE INDEX IF NOT EXISTS "widget_messages_createdAt_idx" ON "widget_messages"("createdAt");

-- Índices para expenses
CREATE INDEX IF NOT EXISTS "expenses_tenantId_idx" ON "expenses"("tenantId");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses"("date");

-- ============================================
-- ÍNDICES OPTIMIZADOS PARA query_examples
-- ============================================

-- Índice IVFFlat para búsqueda vectorial ANN (100x más rápido)
CREATE INDEX IF NOT EXISTS query_examples_embedding_ivfflat_idx 
ON query_examples USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Índices básicos
CREATE INDEX IF NOT EXISTS "query_examples_tenantId_idx" ON "query_examples"("tenantId");
CREATE INDEX IF NOT EXISTS "query_examples_intent_idx" ON "query_examples"("intent");
CREATE INDEX IF NOT EXISTS "query_examples_entity_idx" ON "query_examples"("entity");
CREATE INDEX IF NOT EXISTS "query_examples_success_idx" ON "query_examples"("success");

-- Índices compuestos para queries filtradas (5-10x más rápido)
CREATE INDEX IF NOT EXISTS query_examples_tenant_intent_idx 
ON query_examples("tenantId", intent);

CREATE INDEX IF NOT EXISTS query_examples_tenant_success_idx 
ON query_examples("tenantId", success);

-- Ordenamiento optimizado (30x más rápido)
CREATE INDEX IF NOT EXISTS query_examples_created_at_desc_idx 
ON query_examples("createdAt" DESC);

-- Índice parcial (10-15x más rápido, menos espacio)
CREATE INDEX IF NOT EXISTS query_examples_tenant_success_created_idx 
ON query_examples("tenantId", success, "createdAt" DESC) 
WHERE success = true;

-- GIN index para búsqueda JSON (5x más rápido)
CREATE INDEX IF NOT EXISTS query_examples_filters_gin_idx 
ON query_examples USING GIN (filters);

-- ============================================
-- 4. INSERTAR DATOS INICIALES
-- ============================================

-- Insertar tenant super admin
INSERT INTO "tenants" ("id", "name", "domain", "isActive", "onboardingCompleted", "createdAt", "updatedAt")
VALUES ('super-admin-tenant', 'Super Admin', 'superadmin.local', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("domain") DO NOTHING;

-- Insertar usuario super admin
-- Contraseña: Admin123! (hasheada con bcrypt)
INSERT INTO "users" ("id", "email", "password", "name", "role", "isActive", "tenantId", "createdAt", "updatedAt")
VALUES (
    'super-admin-user',
    'admin@superadmin.local',
    '$2a$10$rB8lqYp0qKZqKqKqKqKqKuO0gZqKqKqKqKqKqKqKqKqKqKqKqKqKq',  -- Admin123!
    'Super Administrador',
    'SUPER_ADMIN',
    true,
    'super-admin-tenant',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- Insertar rol SUPER_ADMIN
INSERT INTO "roles" ("id", "name", "type", "description", "isActive", "tenantId", "createdAt", "updatedAt")
VALUES (
    'super-admin-role',
    'Super Administrador',
    'SUPER_ADMIN',
    'Acceso completo al sistema',
    true,
    NULL,  -- Rol global
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO NOTHING;

-- Asignar rol SUPER_ADMIN al usuario
INSERT INTO "user_roles" ("id", "userId", "roleId", "tenantId", "isActive", "assignedAt")
VALUES (
    'super-admin-user-role',
    'super-admin-user',
    'super-admin-role',
    NULL,  -- Rol global
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("userId", "roleId", "tenantId") DO NOTHING;

-- Insertar permisos para SUPER_ADMIN (todos los recursos y acciones)
INSERT INTO "permissions" ("id", "roleId", "action", "resource", "createdAt")
VALUES
    ('perm-sa-1', 'super-admin-role', 'CREATE', 'EVENTS', CURRENT_TIMESTAMP),
    ('perm-sa-2', 'super-admin-role', 'READ', 'EVENTS', CURRENT_TIMESTAMP),
    ('perm-sa-3', 'super-admin-role', 'UPDATE', 'EVENTS', CURRENT_TIMESTAMP),
    ('perm-sa-4', 'super-admin-role', 'DELETE', 'EVENTS', CURRENT_TIMESTAMP),
    ('perm-sa-5', 'super-admin-role', 'CREATE', 'CLIENTS', CURRENT_TIMESTAMP),
    ('perm-sa-6', 'super-admin-role', 'READ', 'CLIENTS', CURRENT_TIMESTAMP),
    ('perm-sa-7', 'super-admin-role', 'UPDATE', 'CLIENTS', CURRENT_TIMESTAMP),
    ('perm-sa-8', 'super-admin-role', 'DELETE', 'CLIENTS', CURRENT_TIMESTAMP),
    ('perm-sa-9', 'super-admin-role', 'CREATE', 'QUOTES', CURRENT_TIMESTAMP),
    ('perm-sa-10', 'super-admin-role', 'READ', 'QUOTES', CURRENT_TIMESTAMP),
    ('perm-sa-11', 'super-admin-role', 'UPDATE', 'QUOTES', CURRENT_TIMESTAMP),
    ('perm-sa-12', 'super-admin-role', 'DELETE', 'QUOTES', CURRENT_TIMESTAMP),
    ('perm-sa-13', 'super-admin-role', 'CREATE', 'USERS', CURRENT_TIMESTAMP),
    ('perm-sa-14', 'super-admin-role', 'READ', 'USERS', CURRENT_TIMESTAMP),
    ('perm-sa-15', 'super-admin-role', 'UPDATE', 'USERS', CURRENT_TIMESTAMP),
    ('perm-sa-16', 'super-admin-role', 'DELETE', 'USERS', CURRENT_TIMESTAMP),
    ('perm-sa-17', 'super-admin-role', 'CREATE', 'ROLES', CURRENT_TIMESTAMP),
    ('perm-sa-18', 'super-admin-role', 'READ', 'ROLES', CURRENT_TIMESTAMP),
    ('perm-sa-19', 'super-admin-role', 'UPDATE', 'ROLES', CURRENT_TIMESTAMP),
    ('perm-sa-20', 'super-admin-role', 'DELETE', 'ROLES', CURRENT_TIMESTAMP),
    ('perm-sa-21', 'super-admin-role', 'CREATE', 'REPORTS', CURRENT_TIMESTAMP),
    ('perm-sa-22', 'super-admin-role', 'READ', 'REPORTS', CURRENT_TIMESTAMP),
    ('perm-sa-23', 'super-admin-role', 'EXPORT', 'REPORTS', CURRENT_TIMESTAMP),
    ('perm-sa-24', 'super-admin-role', 'CREATE', 'VENUES', CURRENT_TIMESTAMP),
    ('perm-sa-25', 'super-admin-role', 'READ', '-- ============================================
-- SCRIPT DE BASE DE DATOS COMPLETO
-- Gestión de Eventos - Con pgvector y optimizaciones
-- Super Admin incluido
-- ============================================

-- 1. Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. CREAR TABLAS EN ORDEN DE DEPENDENCIAS

-- Tabla: tenants (primero porque muchas tablas dependen de ella)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL UNIQUE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "activationCode" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: user_roles
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "tenantId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "user_roles_userId_roleId_tenantId_key" UNIQUE ("userId", "roleId", "tenantId"),
    CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: permissions
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_roleId_action_resource_key" UNIQUE ("roleId", "action", "resource"),
    CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: accounts
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "accounts_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: business_identities
CREATE TABLE IF NOT EXISTS "business_identities" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "business_identities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: locations
CREATE TABLE IF NOT EXISTS "locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessIdentityId" TEXT NOT NULL,
    CONSTRAINT "locations_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: venues
CREATE TABLE IF NOT EXISTS "venues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagenes" TEXT[],
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "venues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: rooms
CREATE TABLE IF NOT EXISTS "rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minCapacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    CONSTRAINT "rooms_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rooms_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: work_shifts
CREATE TABLE IF NOT EXISTS "work_shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "work_shifts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: price_lists
CREATE TABLE IF NOT EXISTS "price_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "price_lists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: room_pricing
CREATE TABLE IF NOT EXISTS "room_pricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT NOT NULL,
    "workShiftId" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    CONSTRAINT "room_pricing_roomId_workShiftId_priceListId_key" UNIQUE ("roomId", "workShiftId", "priceListId"),
    CONSTRAINT "room_pricing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "room_pricing_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "work_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "room_pricing_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: clients
CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "company" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "discountPercent" DECIMAL(5,2),
    "eventCounter" INTEGER NOT NULL DEFAULT 0,
    "freeEventsTarget" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "priceListId" TEXT,
    "userId" TEXT UNIQUE,
    CONSTRAINT "clients_email_tenantId_key" UNIQUE ("email", "tenantId"),
    CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "clients_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: products
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2),
    "price" DECIMAL(10,2) NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'VENTA',
    "unit" TEXT NOT NULL DEFAULT 'pieza',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: services
CREATE TABLE IF NOT EXISTS "services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'VENTA',
    "unit" TEXT NOT NULL DEFAULT 'servicio',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: package_templates
CREATE TABLE IF NOT EXISTS "package_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BASICO',
    "basePrice" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "package_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: package_template_items
CREATE TABLE IF NOT EXISTS "package_template_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "packageTemplateId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    CONSTRAINT "package_template_items_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "package_template_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "package_template_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: package_upgrades
CREATE TABLE IF NOT EXISTS "package_upgrades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "additionalPrice" DECIMAL(10,2) NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "packageTemplateId" TEXT NOT NULL,
    CONSTRAINT "package_upgrades_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: master_events
CREATE TABLE IF NOT EXISTS "master_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "master_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "master_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: events
CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "notes" TEXT,
    "isFullVenue" BOOLEAN NOT NULL DEFAULT false,
    "colorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "roomId" TEXT,
    "venueId" TEXT,
    "masterEventId" TEXT,
    CONSTRAINT "events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_masterEventId_fkey" FOREIGN KEY ("masterEventId") REFERENCES "master_events"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: quote_templates
CREATE TABLE IF NOT EXISTS "quote_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'QUOTE',
    "category" TEXT,
    "htmlContent" TEXT NOT NULL,
    "variables" JSONB,
    "styles" JSONB,
    "metadata" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "businessIdentityId" TEXT NOT NULL,
    CONSTRAINT "quote_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quote_templates_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: quotes
CREATE TABLE IF NOT EXISTS "quotes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "publicToken" TEXT UNIQUE,
    "templateId" TEXT,
    "generatedContent" JSONB,
    "pdfUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "eventId" TEXT UNIQUE,
    CONSTRAINT "quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quotes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quotes_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "quote_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: packages
CREATE TABLE IF NOT EXISTS "packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "packageTemplateId" TEXT,
    CONSTRAINT "packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: package_items
CREATE TABLE IF NOT EXISTS "package_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "packageId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "package_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "package_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: quote_comments
CREATE TABLE IF NOT EXISTS "quote_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comment" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL_MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "quote_comments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quote_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: email_templates
CREATE TABLE IF NOT EXISTS "email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "category" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentTemplateId" TEXT,
    "templateType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "inheritanceLevel" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "customizations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "businessIdentityId" TEXT,
    CONSTRAINT "email_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_templates_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_templates_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: payments
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GTQ',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "mercadoPagoPreferenceId" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "externalReference" TEXT NOT NULL UNIQUE,
    "transactionId" TEXT,
    "authorizationCode" TEXT,
    "installments" INTEGER,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: configurations
CREATE TABLE IF NOT EXISTS "configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "configurations_tenantId_key_key" UNIQUE ("tenantId", "key"),
    CONSTRAINT "configurations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: suppliers
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: supplier_products
CREATE TABLE IF NOT EXISTS "supplier_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cost" DECIMAL(10,2) NOT NULL,
    "deliveryDays" INTEGER NOT NULL DEFAULT 1,
    "minQuantity" INTEGER DEFAULT 1,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "supplier_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: supplier_services
CREATE TABLE IF NOT EXISTS "supplier_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "minQuantity" INTEGER DEFAULT 1,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    CONSTRAINT "supplier_services_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "supplier_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: client_credits
CREATE TABLE IF NOT EXISTS "client_credits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT,
    CONSTRAINT "client_credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "client_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "client_credits_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: client_documents
CREATE TABLE IF NOT EXISTS "client_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "client_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: loyalty_points
CREATE TABLE IF NOT EXISTS "loyalty_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "eventId" TEXT,
    CONSTRAINT "loyalty_points_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "loyalty_points_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: email_changes
CREATE TABLE IF NOT EXISTS "email_changes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: email_logs
CREATE TABLE IF NOT EXISTS "email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "trackingToken" TEXT UNIQUE,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_logs_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: conversations
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "userPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "endedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: conversation_messages
CREATE TABLE IF NOT EXISTS "conversation_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversation_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: content_embeddings
CREATE TABLE IF NOT EXISTS "content_embeddings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tenant_email_configs
CREATE TABLE IF NOT EXISTS "tenant_email_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_email_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: widget_api_keys
CREATE TABLE IF NOT EXISTS "widget_api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allowedOrigins" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: widget_configs
CREATE TABLE IF NOT EXISTS "widget_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: widget_conversations
CREATE TABLE IF NOT EXISTS "widget_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "widgetApiKeyId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "sessionId" TEXT NOT NULL UNIQUE,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_conversations_widgetApiKeyId_fkey" FOREIGN KEY ("widgetApiKeyId") REFERENCES "widget_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: widget_messages
CREATE TABLE IF NOT EXISTS "widget_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "widget_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "widget_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: expenses
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "expenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: BotSession
CREATE TABLE IF NOT EXISTS "BotSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BotSession_phone_tenantId_key" UNIQUE ("phone", "tenantId")
);

-- Tabla: BotMessage
CREATE TABLE IF NOT EXISTS "BotMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: query_examples (RAG Learning System con pgvector)
CREATE TABLE IF NOT EXISTS "query_examples" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "query_examples_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 3. CREAR ÍNDICES
-- ============================================

-- Índices para users
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");

-- Índices para roles
CREATE INDEX IF NOT EXISTS "roles_type_idx" ON "roles"("type");
CREATE INDEX IF NOT EXISTS "roles_tenantId_idx" ON "roles"("tenantId");

-- Índices para user_roles
CREATE INDEX IF NOT EXISTS "user_roles_userId_idx" ON "user_roles"("userId");
CREATE INDEX IF NOT EXISTS "user_roles_roleId_idx" ON "user_roles"("roleId");
CREATE INDEX IF NOT EXISTS "user_roles_tenantId_idx" ON "user_roles"("tenantId");

-- Índices para permissions
CREATE INDEX IF NOT EXISTS "permissions_roleId_idx" ON "permissions"("roleId");
CREATE INDEX IF NOT EXISTS "permissions_action_idx" ON "permissions"("action");
CREATE INDEX IF NOT EXISTS "permissions_resource_idx" ON "permissions"("resource");

-- Índices para business_identities
CREATE INDEX IF NOT EXISTS "business_identities_tenantId_idx" ON "business_identities"("tenantId");
CREATE INDEX IF NOT EXISTS "business_identities_isActive_idx" ON "business_identities"("isActive");

-- Índices para locations
CREATE INDEX IF NOT EXISTS "locations_businessIdentityId_idx" ON "locations"("businessIdentityId");

-- Índices para venues
CREATE INDEX IF NOT EXISTS "venues_tenantId_idx" ON "venues"("tenantId");
CREATE INDEX IF NOT EXISTS "venues_isActive_idx" ON "venues"("isActive");
CREATE INDEX IF NOT EXISTS "venues_type_idx" ON "venues"("type");

-- Índices para rooms
CREATE INDEX IF NOT EXISTS "rooms_locationId_idx" ON "rooms"("locationId");
CREATE INDEX IF NOT EXISTS "rooms_venueId_idx" ON "rooms"("venueId");

-- Índices para work_shifts
CREATE INDEX IF NOT EXISTS "work_shifts_tenantId_idx" ON "work_shifts"("tenantId");

-- Índices para price_lists
CREATE INDEX IF NOT EXISTS "price_lists_tenantId_idx" ON "price_lists"("tenantId");

-- Índices para room_pricing
CREATE INDEX IF NOT EXISTS "room_pricing_roomId_idx" ON "room_pricing"("roomId");
CREATE INDEX IF NOT EXISTS "room_pricing_workShiftId_idx" ON "room_pricing"("workShiftId");
CREATE INDEX IF NOT EXISTS "room_pricing_priceListId_idx" ON "room_pricing"("priceListId");

-- Índices para clients
CREATE INDEX IF NOT EXISTS "clients_tenantId_idx" ON "clients"("tenantId");
CREATE INDEX IF NOT EXISTS "clients_type_idx" ON "clients"("type");
CREATE INDEX IF NOT EXISTS "clients_isActive_idx" ON "clients"("isActive");
CREATE INDEX IF NOT EXISTS "clients_deletedAt_idx" ON "clients"("deletedAt");

-- Índices para products
CREATE INDEX IF NOT EXISTS "products_tenantId_idx" ON "products"("tenantId");

-- Índices para services
CREATE INDEX IF NOT EXISTS "services_tenantId_idx" ON "services"("tenantId");

-- Índices para package_templates
CREATE INDEX IF NOT EXISTS "package_templates_tenantId_idx" ON "package_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "package_templates_type_idx" ON "package_templates"("type");

-- Índices para package_template_items
CREATE INDEX IF NOT EXISTS "package_template_items_packageTemplateId_idx" ON "package_template_items"("packageTemplateId");

-- Índices para package_upgrades
CREATE INDEX IF NOT EXISTS "package_upgrades_packageTemplateId_idx" ON "package_upgrades"("packageTemplateId");

-- Índices para master_events
CREATE INDEX IF NOT EXISTS "master_events_tenantId_idx" ON "master_events"("tenantId");
CREATE INDEX IF NOT EXISTS "master_events_clientId_idx" ON "master_events"("clientId");

-- Índices para events
CREATE INDEX IF NOT EXISTS "events_tenantId_idx" ON "events"("tenantId");
CREATE INDEX IF NOT EXISTS "events_clientId_idx" ON "events"("clientId");
CREATE INDEX IF NOT EXISTS "events_roomId_idx" ON "events"("roomId");
CREATE INDEX IF NOT EXISTS "events_venueId_idx" ON "events"("venueId");
CREATE INDEX IF NOT EXISTS "events_startDate_idx" ON "events"("startDate");
CREATE INDEX IF NOT EXISTS "events_isFullVenue_idx" ON "events"("isFullVenue");
CREATE INDEX IF NOT EXISTS "events_masterEventId_idx" ON "events"("masterEventId");

-- Índices para quote_templates
CREATE INDEX IF NOT EXISTS "quote_templates_tenantId_idx" ON "quote_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "quote_templates_businessIdentityId_idx" ON "quote_templates"("businessIdentityId");
CREATE INDEX IF NOT EXISTS "quote_templates_type_category_idx" ON "quote_templates"("type", "category");

-- Índices para quotes
CREATE INDEX IF NOT EXISTS "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX IF NOT EXISTS "quotes_clientId_idx" ON "quotes"("clientId");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "quotes"("status");
CREATE INDEX IF NOT EXISTS "quotes_templateId_idx" ON "quotes"("templateId");

-- Índices para packages
CREATE INDEX IF NOT EXISTS "packages_tenantId_idx" ON "packages"("tenantId");
CREATE INDEX IF NOT EXISTS "packages_quoteId_idx" ON "packages"("quoteId");

-- Índices para package_items
CREATE INDEX IF NOT EXISTS "package_items_packageId_idx" ON "package_items"("packageId");

-- Índices para quote_comments
CREATE INDEX IF NOT EXISTS "quote_comments_quoteId_idx" ON "quote_comments"("quoteId");

-- Índices para email_templates
CREATE INDEX IF NOT EXISTS "email_templates_tenantId_idx" ON "email_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "email_templates_businessIdentityId_idx" ON "email_templates"("businessIdentityId");
CREATE INDEX IF NOT EXISTS "email_templates_category_idx" ON "email_templates"("category");
CREATE INDEX IF NOT EXISTS "email_templates_isDefault_category_idx" ON "email_templates"("isDefault", "category");
CREATE INDEX IF NOT EXISTS "email_templates_parentTemplateId_idx" ON "email_templates"("parentTemplateId");
CREATE INDEX IF NOT EXISTS "email_templates_templateType_isGlobal_idx" ON "email_templates"("templateType", "isGlobal");
CREATE INDEX IF NOT EXISTS "email_templates_inheritanceLevel_idx" ON "email_templates"("inheritanceLevel");

-- Índices para payments
CREATE INDEX IF NOT EXISTS "payments_tenantId_idx" ON "payments"("tenantId");
CREATE INDEX IF NOT EXISTS "payments_quoteId_idx" ON "payments"("quoteId");
CREATE INDEX IF NOT EXISTS "payments_externalReference_idx" ON "payments"("externalReference");
CREATE INDEX IF NOT EXISTS "payments_mercadoPagoPaymentId_idx" ON "payments"("mercadoPagoPaymentId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");

-- Índices para supplier_products
CREATE INDEX IF NOT EXISTS "supplier_products_supplierId_idx" ON "supplier_products"("supplierId");
CREATE INDEX IF NOT EXISTS "supplier_products_productId_idx" ON "supplier_products"("productId");

-- Índices para supplier_services
CREATE INDEX IF NOT EXISTS "supplier_services_supplierId_idx" ON "supplier_services"("supplierId");
CREATE INDEX IF NOT EXISTS "supplier_services_serviceId_idx" ON "supplier_services"("serviceId");

-- Índices para client_credits
CREATE INDEX IF NOT EXISTS "client_credits_clientId_idx" ON "client_credits"("clientId");
CREATE INDEX IF NOT EXISTS "client_credits_userId_idx" ON "client_credits"("userId");
CREATE INDEX IF NOT EXISTS "client_credits_type_idx" ON "client_credits"("type");

-- Índices para client_documents
CREATE INDEX IF NOT EXISTS "client_documents_clientId_idx" ON "client_documents"("clientId");
CREATE INDEX IF NOT EXISTS "client_documents_category_idx" ON "client_documents"("category");
CREATE INDEX IF NOT EXISTS "client_documents_isPublic_idx" ON "client_documents"("isPublic");

-- Índices para loyalty_points
CREATE INDEX IF NOT EXISTS "loyalty_points_clientId_idx" ON "loyalty_points"("clientId");

-- Índices para email_changes
CREATE INDEX IF NOT EXISTS "email_changes_userId_idx" ON "email_changes"("userId");
CREATE INDEX IF NOT EXISTS "email_changes_token_idx" ON "email_changes"("token");

-- Índices para email_logs
CREATE INDEX IF NOT EXISTS "email_logs_quoteId_idx" ON "email_logs"("quoteId");
CREATE INDEX IF NOT EXISTS "email_logs_trackingToken_idx" ON "email_logs"("trackingToken");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs"("status");

-- Índices para conversations
CREATE INDEX IF NOT EXISTS "conversations_userId_idx" ON "conversations"("userId");
CREATE INDEX IF NOT EXISTS "conversations_platform_idx" ON "conversations"("platform");
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations"("status");

-- Índices para conversation_messages
CREATE INDEX IF NOT EXISTS "conversation_messages_conversationId_idx" ON "conversation_messages"("conversationId");
CREATE INDEX IF NOT EXISTS "conversation_messages_role_idx" ON "conversation_messages"("role");

-- Índices para content_embeddings
CREATE INDEX IF NOT EXISTS "content_embeddings_entityId_idx" ON "content_embeddings"("entityId");
CREATE INDEX IF NOT EXISTS "content_embeddings_entityType_idx" ON "content_embeddings"("entityType");

-- Índices para tenant_email_configs
CREATE INDEX IF NOT EXISTS "tenant_email_configs_tenantId_idx" ON "tenant_email_configs"("tenantId");
CREATE INDEX IF NOT EXISTS "tenant_email_configs_isActive_idx" ON "tenant_email_configs"("isActive");

-- Índices para widget_api_keys
CREATE INDEX IF NOT EXISTS "widget_api_keys_tenantId_idx" ON "widget_api_keys"("tenantId");
CREATE INDEX IF NOT EXISTS "widget_api_keys_apiKey_idx" ON "widget_api_keys"("apiKey");
CREATE INDEX IF NOT EXISTS "widget_api_keys_isActive_idx" ON "widget_api_keys"("isActive");

-- Índices para widget_configs
CREATE INDEX IF NOT EXISTS "widget_configs_tenantId_idx" ON "widget_configs"("tenantId");
CREATE INDEX IF NOT EXISTS "widget_configs_isActive_idx" ON "widget_configs"("isActive");

-- Índices para widget_conversations
CREATE INDEX IF NOT EXISTS "widget_conversations_widgetApiKeyId_idx" ON "widget_conversations"("widgetApiKeyId");
CREATE INDEX IF NOT EXISTS "widget_conversations_sessionId_idx" ON "widget_conversations"("sessionId");
CREATE INDEX IF NOT EXISTS "widget_conversations_status_idx" ON "widget_conversations"("status");
CREATE INDEX IF NOT EXISTS "widget_conversations_userId_idx" ON "widget_conversations"("userId");

-- Índices para widget_messages
CREATE INDEX IF NOT EXISTS "widget_messages_conversationId_idx" ON "widget_messages"("conversationId");
CREATE INDEX IF NOT EXISTS "widget_messages_direction_idx" ON "widget_messages"("direction");
CREATE INDEX IF NOT EXISTS "widget_messages_createdAt_idx" ON "widget_messages"("createdAt");

-- Índices para expenses
CREATE INDEX IF NOT EXISTS "expenses_tenantId_idx" ON "expenses"("tenantId");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses"("date");

-- ============================================
-- ÍNDICES OPTIMIZADOS PARA query_examples
-- ============================================

-- Índice IVFFlat para búsqueda vectorial ANN (100x más rápido)
CREATE INDEX IF NOT EXISTS query_examples_embedding_ivfflat_idx 
ON query_examples USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Índices básicos
CREATE INDEX IF NOT EXISTS "query_examples_tenantId_idx" ON "query_examples"("tenantId");
CREATE INDEX IF NOT EXISTS "query_examples_intent_idx" ON "query_examples"("intent");
CREATE INDEX IF NOT EXISTS "query_examples_entity_idx" ON "query_examples"("entity");
CREATE INDEX IF NOT EXISTS "query_examples_success_idx" ON "query_examples"("success");

-- Índices compuestos para queries filtradas (5-10x más rápido)
CREATE INDEX IF NOT EXISTS query_examples_tenant_intent_idx 
ON query_examples("tenantId", intent);

CREATE INDEX IF NOT EXISTS query_examples_tenant_success_idx 
ON query_examples("tenantId", success);

-- Ordenamiento optimizado (30x más rápido)
CREATE INDEX IF NOT EXISTS query_examples_created_at_desc_idx 
ON query_examples("createdAt" DESC);

-- Índice parcial (10-15x más rápido, menos espacio)
CREATE INDEX IF NOT EXISTS query_examples_tenant_success_created_idx 
ON query_examples("tenantId", success, "createdAt" DESC) 
WHERE success = true;

-- GIN index para búsqueda JSON (5x más rápido)
CREATE INDEX IF NOT EXISTS query_examples_filters_gin_idx 
ON query_examples USING GIN (filters);

-- ============================================
-- 4. INSERTAR DATOS INICIALES
-- ============================================

-- Insertar tenant super admin
INSERT INTO "tenants" ("id", "name", "domain", "isActive", "onboardingCompleted", "createdAt", "updatedAt")
VALUES ('super-admin-tenant', 'Super Admin', 'superadmin.local', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("domain") DO NOTHING;

-- Insertar usuario super admin
-- Contraseña: Admin123! (hasheada con bcrypt)
INSERT INTO "users" ("id", "email", "password", "name", "role", "isActive", "tenantId", "createdAt", "updatedAt")
VALUES (
    'super-admin-user',
    'admin@superadmin.local',
    '$2a$10$rB8lqYp0qKZqKqKqKqKqKuO0gZqKqKqKqKqKqKqKqKqKqKqKqKqKq',  -- Admin123!
    'Super Administrador',
    'SUPER_ADMIN',
    true,
    'super-admin-tenant',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- Insertar rol SUPER_ADMIN
INSERT INTO "roles" ("id"…