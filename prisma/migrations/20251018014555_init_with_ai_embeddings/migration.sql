/*
  Warnings:

  - The values [INDIVIDUAL,CORPORATE,GOVERNMENT,NONPROFIT] on the enum `ClientType` will be removed. If these variants are still used in the database, this will fail.
  - The values [IN_PROGRESS,COMPLETED] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PRODUCT,SERVICE,VENUE,CUSTOM] on the enum `ItemType` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING_APPROVAL,APPROVED,ACCEPTED,REJECTED] on the enum `QuoteStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `clientType` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedGuests` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `eventType` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `guestCount` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `terms` on the `quotes` table. All the data in the column will be lost.
  - You are about to alter the column `subtotal` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `discount` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `quotes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `basePrice` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `services` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `hourlyRate` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the `agent_tools` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_embeddings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversation_analytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversation_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event_services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quote_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verificationtokens` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,tenantId]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[quoteNumber]` on the table `quotes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicToken]` on the table `quotes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId]` on the table `quotes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tenantId` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quoteNumber` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `venues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `venues` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LegacyUserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'USER', 'CLIENT_EXTERNAL');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'SALES', 'COORDINATOR', 'FINANCE', 'USER', 'CLIENT_EXTERNAL');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "PermissionResource" AS ENUM ('EVENTS', 'CLIENTS', 'QUOTES', 'USERS', 'ROLES', 'REPORTS', 'VENUES', 'PRODUCTS', 'SERVICES', 'PACKAGES', 'CONFIGURATIONS');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('GENERAL', 'FRIENDS', 'CORPORATE', 'VIP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('BASICO', 'VIP', 'GOLD', 'DIAMANTE');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'AUTHORIZED', 'IN_PROCESS', 'IN_MEDIATION', 'REJECTED', 'CANCELLED', 'REFUNDED', 'CHARGED_BACK');

-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('INTERNAL_MANAGER', 'CLIENT_FEEDBACK', 'SYSTEM_NOTE');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('QUOTE', 'CONTRACT', 'INVOICE', 'EMAIL', 'PROPOSAL');

-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('VENUE', 'ROOM');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PRODUCT', 'SERVICE', 'PACKAGE');

-- AlterEnum
BEGIN;
CREATE TYPE "ClientType_new" AS ENUM ('GENERAL', 'COLABORADOR', 'EXTERNO');
ALTER TABLE "clients" ALTER COLUMN "clientType" DROP DEFAULT;
ALTER TABLE "clients" ALTER COLUMN "type" TYPE "ClientType_new" USING ("type"::text::"ClientType_new");
ALTER TYPE "ClientType" RENAME TO "ClientType_old";
ALTER TYPE "ClientType_new" RENAME TO "ClientType";
DROP TYPE "ClientType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EventStatus_new" AS ENUM ('RESERVED', 'QUOTED', 'CONFIRMED', 'CANCELLED');
ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "events" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
ALTER TYPE "EventStatus" RENAME TO "EventStatus_old";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
DROP TYPE "EventStatus_old";
ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'RESERVED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ItemType_new" AS ENUM ('CONSUMO', 'VENTA');
ALTER TABLE "products" ALTER COLUMN "itemType" TYPE "ItemType_new" USING ("itemType"::text::"ItemType_new");
ALTER TABLE "services" ALTER COLUMN "itemType" TYPE "ItemType_new" USING ("itemType"::text::"ItemType_new");
ALTER TYPE "ItemType" RENAME TO "ItemType_old";
ALTER TYPE "ItemType_new" RENAME TO "ItemType";
DROP TYPE "ItemType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "QuoteStatus_new" AS ENUM ('DRAFT', 'PENDING_MANAGER', 'REJECTED_BY_MANAGER', 'APPROVED_BY_MANAGER', 'SENT_TO_CLIENT', 'CLIENT_REQUESTED_CHANGES', 'ACCEPTED_BY_CLIENT', 'EXPIRED', 'CANCELLED');
ALTER TABLE "quotes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "quotes" ALTER COLUMN "status" TYPE "QuoteStatus_new" USING ("status"::text::"QuoteStatus_new");
ALTER TYPE "QuoteStatus" RENAME TO "QuoteStatus_old";
ALTER TYPE "QuoteStatus_new" RENAME TO "QuoteStatus";
DROP TYPE "QuoteStatus_old";
ALTER TABLE "quotes" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_createdById_fkey";

-- DropForeignKey
ALTER TABLE "conversation_analytics" DROP CONSTRAINT "conversation_analytics_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_userId_fkey";

-- DropForeignKey
ALTER TABLE "event_products" DROP CONSTRAINT "event_products_eventId_fkey";

-- DropForeignKey
ALTER TABLE "event_products" DROP CONSTRAINT "event_products_productId_fkey";

-- DropForeignKey
ALTER TABLE "event_services" DROP CONSTRAINT "event_services_eventId_fkey";

-- DropForeignKey
ALTER TABLE "event_services" DROP CONSTRAINT "event_services_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_clientId_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_createdById_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_venueId_fkey";

-- DropForeignKey
ALTER TABLE "quote_items" DROP CONSTRAINT "quote_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "quote_items" DROP CONSTRAINT "quote_items_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "quote_items" DROP CONSTRAINT "quote_items_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "quote_items" DROP CONSTRAINT "quote_items_venueId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_clientId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_createdById_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropIndex
DROP INDEX "clients_email_key";

-- DropIndex
DROP INDEX "quotes_number_key";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "clientType",
DROP COLUMN "company",
DROP COLUMN "createdById",
ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "eventCounter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "freeEventsTarget" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priceListId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" "ClientType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "events" DROP COLUMN "confirmedGuests",
DROP COLUMN "createdById",
DROP COLUMN "description",
DROP COLUMN "duration",
DROP COLUMN "eventType",
DROP COLUMN "guestCount",
ADD COLUMN     "colorCode" TEXT,
ADD COLUMN     "isFullVenue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "masterEventId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'RESERVED';

-- AlterTable
ALTER TABLE "products" DROP COLUMN "basePrice",
DROP COLUMN "category",
ADD COLUMN     "cost" DECIMAL(10,2),
ADD COLUMN     "itemType" "ItemType" NOT NULL DEFAULT 'VENTA',
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ALTER COLUMN "unit" SET DEFAULT 'pieza';

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "createdById",
DROP COLUMN "number",
DROP COLUMN "tax",
DROP COLUMN "terms",
ADD COLUMN     "generatedContent" JSONB,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "previousVersionId" TEXT,
ADD COLUMN     "publicToken" TEXT,
ADD COLUMN     "quoteNumber" TEXT NOT NULL,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "viewedAt" TIMESTAMP(3),
ALTER COLUMN "subtotal" DROP DEFAULT,
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total" DROP DEFAULT,
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "services" DROP COLUMN "basePrice",
DROP COLUMN "category",
ADD COLUMN     "itemType" "ItemType" NOT NULL DEFAULT 'VENTA',
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ALTER COLUMN "unit" SET DEFAULT 'servicio';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activationCode" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "LegacyUserRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "venues" DROP COLUMN "hourlyRate",
DROP COLUMN "location",
ADD COLUMN     "imagenes" TEXT[],
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" "VenueType" NOT NULL,
ALTER COLUMN "capacity" DROP NOT NULL;

-- DropTable
DROP TABLE "agent_tools";

-- DropTable
DROP TABLE "content_embeddings";

-- DropTable
DROP TABLE "conversation_analytics";

-- DropTable
DROP TABLE "conversation_messages";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "event_products";

-- DropTable
DROP TABLE "event_services";

-- DropTable
DROP TABLE "quote_items";

-- DropTable
DROP TABLE "sessions";

-- DropTable
DROP TABLE "verificationtokens";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "business_identities" (
    "id" TEXT NOT NULL,
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
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "business_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
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

-- CreateTable
CREATE TABLE "roles" (
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

-- CreateTable
CREATE TABLE "user_roles" (
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

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "resource" "PermissionResource" NOT NULL,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_shifts" (
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

-- CreateTable
CREATE TABLE "price_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
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

-- CreateTable
CREATE TABLE "room_pricing" (
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

-- CreateTable
CREATE TABLE "package_templates" (
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

-- CreateTable
CREATE TABLE "package_template_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "packageTemplateId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,

    CONSTRAINT "package_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_upgrades" (
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

-- CreateTable
CREATE TABLE "BotSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_embeddings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector NOT NULL,
    "dimensions" INTEGER NOT NULL DEFAULT 768,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_products" (
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

-- CreateTable
CREATE TABLE "supplier_services" (
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

-- CreateTable
CREATE TABLE "client_credits" (
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

-- CreateTable
CREATE TABLE "loyalty_points" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "eventId" TEXT,

    CONSTRAINT "loyalty_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_events" (
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

-- CreateTable
CREATE TABLE "packages" (
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

-- CreateTable
CREATE TABLE "package_items" (
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

-- CreateTable
CREATE TABLE "quote_comments" (
    "id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "type" "CommentType" NOT NULL DEFAULT 'INTERNAL_MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "quote_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_templates" (
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

-- CreateTable
CREATE TABLE "configurations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
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

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
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

-- CreateTable
CREATE TABLE "payments" (
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

-- CreateIndex
CREATE INDEX "business_identities_tenantId_idx" ON "business_identities"("tenantId");

-- CreateIndex
CREATE INDEX "business_identities_isActive_idx" ON "business_identities"("isActive");

-- CreateIndex
CREATE INDEX "locations_businessIdentityId_idx" ON "locations"("businessIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_type_idx" ON "roles"("type");

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "user_roles_tenantId_idx" ON "user_roles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_tenantId_key" ON "user_roles"("userId", "roleId", "tenantId");

-- CreateIndex
CREATE INDEX "permissions_roleId_idx" ON "permissions"("roleId");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_roleId_action_resource_key" ON "permissions"("roleId", "action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "work_shifts_tenantId_idx" ON "work_shifts"("tenantId");

-- CreateIndex
CREATE INDEX "price_lists_tenantId_idx" ON "price_lists"("tenantId");

-- CreateIndex
CREATE INDEX "rooms_locationId_idx" ON "rooms"("locationId");

-- CreateIndex
CREATE INDEX "rooms_venueId_idx" ON "rooms"("venueId");

-- CreateIndex
CREATE INDEX "room_pricing_roomId_idx" ON "room_pricing"("roomId");

-- CreateIndex
CREATE INDEX "room_pricing_workShiftId_idx" ON "room_pricing"("workShiftId");

-- CreateIndex
CREATE INDEX "room_pricing_priceListId_idx" ON "room_pricing"("priceListId");

-- CreateIndex
CREATE UNIQUE INDEX "room_pricing_roomId_workShiftId_priceListId_key" ON "room_pricing"("roomId", "workShiftId", "priceListId");

-- CreateIndex
CREATE INDEX "package_templates_tenantId_idx" ON "package_templates"("tenantId");

-- CreateIndex
CREATE INDEX "package_templates_type_idx" ON "package_templates"("type");

-- CreateIndex
CREATE INDEX "package_template_items_packageTemplateId_idx" ON "package_template_items"("packageTemplateId");

-- CreateIndex
CREATE INDEX "package_upgrades_packageTemplateId_idx" ON "package_upgrades"("packageTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "BotSession_phone_tenantId_key" ON "BotSession"("phone", "tenantId");

-- CreateIndex
CREATE INDEX "ai_embeddings_tenantId_idx" ON "ai_embeddings"("tenantId");

-- CreateIndex
CREATE INDEX "ai_embeddings_entityType_idx" ON "ai_embeddings"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "ai_embeddings_entityId_entityType_key" ON "ai_embeddings"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "supplier_products_supplierId_idx" ON "supplier_products"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_products_productId_idx" ON "supplier_products"("productId");

-- CreateIndex
CREATE INDEX "supplier_services_supplierId_idx" ON "supplier_services"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_services_serviceId_idx" ON "supplier_services"("serviceId");

-- CreateIndex
CREATE INDEX "client_credits_clientId_idx" ON "client_credits"("clientId");

-- CreateIndex
CREATE INDEX "client_credits_userId_idx" ON "client_credits"("userId");

-- CreateIndex
CREATE INDEX "client_credits_type_idx" ON "client_credits"("type");

-- CreateIndex
CREATE INDEX "loyalty_points_clientId_idx" ON "loyalty_points"("clientId");

-- CreateIndex
CREATE INDEX "master_events_tenantId_idx" ON "master_events"("tenantId");

-- CreateIndex
CREATE INDEX "master_events_clientId_idx" ON "master_events"("clientId");

-- CreateIndex
CREATE INDEX "packages_tenantId_idx" ON "packages"("tenantId");

-- CreateIndex
CREATE INDEX "packages_quoteId_idx" ON "packages"("quoteId");

-- CreateIndex
CREATE INDEX "package_items_packageId_idx" ON "package_items"("packageId");

-- CreateIndex
CREATE INDEX "quote_comments_quoteId_idx" ON "quote_comments"("quoteId");

-- CreateIndex
CREATE INDEX "quote_templates_tenantId_idx" ON "quote_templates"("tenantId");

-- CreateIndex
CREATE INDEX "quote_templates_businessIdentityId_idx" ON "quote_templates"("businessIdentityId");

-- CreateIndex
CREATE INDEX "quote_templates_type_category_idx" ON "quote_templates"("type", "category");

-- CreateIndex
CREATE UNIQUE INDEX "configurations_tenantId_key_key" ON "configurations"("tenantId", "key");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "email_changes_token_key" ON "email_changes"("token");

-- CreateIndex
CREATE INDEX "email_changes_userId_idx" ON "email_changes"("userId");

-- CreateIndex
CREATE INDEX "email_changes_token_idx" ON "email_changes"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_trackingToken_key" ON "email_logs"("trackingToken");

-- CreateIndex
CREATE INDEX "email_logs_quoteId_idx" ON "email_logs"("quoteId");

-- CreateIndex
CREATE INDEX "email_logs_trackingToken_idx" ON "email_logs"("trackingToken");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_externalReference_key" ON "payments"("externalReference");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "payments"("tenantId");

-- CreateIndex
CREATE INDEX "payments_quoteId_idx" ON "payments"("quoteId");

-- CreateIndex
CREATE INDEX "payments_externalReference_idx" ON "payments"("externalReference");

-- CreateIndex
CREATE INDEX "payments_mercadoPagoPaymentId_idx" ON "payments"("mercadoPagoPaymentId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "clients_userId_key" ON "clients"("userId");

-- CreateIndex
CREATE INDEX "clients_tenantId_idx" ON "clients"("tenantId");

-- CreateIndex
CREATE INDEX "clients_type_idx" ON "clients"("type");

-- CreateIndex
CREATE INDEX "clients_isActive_idx" ON "clients"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_tenantId_key" ON "clients"("email", "tenantId");

-- CreateIndex
CREATE INDEX "events_tenantId_idx" ON "events"("tenantId");

-- CreateIndex
CREATE INDEX "events_clientId_idx" ON "events"("clientId");

-- CreateIndex
CREATE INDEX "events_roomId_idx" ON "events"("roomId");

-- CreateIndex
CREATE INDEX "events_venueId_idx" ON "events"("venueId");

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "events"("startDate");

-- CreateIndex
CREATE INDEX "events_isFullVenue_idx" ON "events"("isFullVenue");

-- CreateIndex
CREATE INDEX "events_masterEventId_idx" ON "events"("masterEventId");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quoteNumber_key" ON "quotes"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_publicToken_key" ON "quotes"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_eventId_key" ON "quotes"("eventId");

-- CreateIndex
CREATE INDEX "quotes_tenantId_idx" ON "quotes"("tenantId");

-- CreateIndex
CREATE INDEX "quotes_clientId_idx" ON "quotes"("clientId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_templateId_idx" ON "quotes"("templateId");

-- CreateIndex
CREATE INDEX "services_tenantId_idx" ON "services"("tenantId");

-- CreateIndex
CREATE INDEX "venues_tenantId_idx" ON "venues"("tenantId");

-- CreateIndex
CREATE INDEX "venues_isActive_idx" ON "venues"("isActive");

-- CreateIndex
CREATE INDEX "venues_type_idx" ON "venues"("type");

-- AddForeignKey
ALTER TABLE "business_identities" ADD CONSTRAINT "business_identities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_shifts" ADD CONSTRAINT "work_shifts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_pricing" ADD CONSTRAINT "room_pricing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_pricing" ADD CONSTRAINT "room_pricing_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "work_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_pricing" ADD CONSTRAINT "room_pricing_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_templates" ADD CONSTRAINT "package_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_template_items" ADD CONSTRAINT "package_template_items_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_template_items" ADD CONSTRAINT "package_template_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_template_items" ADD CONSTRAINT "package_template_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_upgrades" ADD CONSTRAINT "package_upgrades_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_embeddings" ADD CONSTRAINT "ai_embeddings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_services" ADD CONSTRAINT "supplier_services_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_services" ADD CONSTRAINT "supplier_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_credits" ADD CONSTRAINT "client_credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_credits" ADD CONSTRAINT "client_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_credits" ADD CONSTRAINT "client_credits_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_events" ADD CONSTRAINT "master_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_events" ADD CONSTRAINT "master_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_masterEventId_fkey" FOREIGN KEY ("masterEventId") REFERENCES "master_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "quote_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_packageTemplateId_fkey" FOREIGN KEY ("packageTemplateId") REFERENCES "package_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_comments" ADD CONSTRAINT "quote_comments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_comments" ADD CONSTRAINT "quote_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_businessIdentityId_fkey" FOREIGN KEY ("businessIdentityId") REFERENCES "business_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_changes" ADD CONSTRAINT "email_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
