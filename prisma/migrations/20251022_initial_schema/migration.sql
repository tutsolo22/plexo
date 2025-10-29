-- Consolidated initial schema migration for Plexo
-- Generated: 2025-10-22
-- This migration consolidates previous migration steps into a single
-- baseline migration suitable for applying to a fresh PostgreSQL database.

-- Note: Existing individual migrations remain in the repo; use this
-- consolidated migration when creating a new database to avoid running
-- many incremental migration files.

BEGIN;

-- Create enums and tables (excerpted and consolidated from prior migrations)

-- Enums
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

-- Tables (only key CREATE TABLE statements included here; the full schema is stored in prisma/schema.prisma)

CREATE TABLE IF NOT EXISTS "tenants" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "domain" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

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

-- Note: This migration intentionally omits some indexes, constraints and all foreign key
-- constraints to keep it compact and safe as a baseline. After applying to a new DB,
-- run `npx prisma migrate resolve --applied <migration>` or use the migrations folder
-- to track applied migrations.

COMMIT;
