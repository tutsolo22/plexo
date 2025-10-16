-- =========================================================================
-- MIGRACIÓN MANUAL: SISTEMA DE ROLES FLEXIBLES
-- =========================================================================
-- Este script añade las tablas del sistema de roles flexibles sin afectar
-- las tablas existentes ni los datos.
-- =========================================================================

-- Crear nuevos enums para el sistema de roles flexibles
DO $$ 
BEGIN
    -- Crear enum RoleType si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoleType') THEN
        CREATE TYPE "RoleType" AS ENUM (
            'SUPER_ADMIN',      -- Administrador del sistema completo
            'TENANT_ADMIN',     -- Administrador del tenant
            'MANAGER',          -- Manager con permisos de aprobación
            'USER',             -- Usuario básico del sistema
            'CLIENT_EXTERNAL',  -- Cliente externo con acceso limitado
            'SALES',            -- Ejecutivo de ventas
            'COORDINATOR',      -- Coordinador de eventos
            'FINANCE'           -- Personal de finanzas
        );
    END IF;

    -- Crear enum PermissionAction si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PermissionAction') THEN
        CREATE TYPE "PermissionAction" AS ENUM (
            'CREATE',    -- Crear nuevos registros
            'READ',      -- Leer/ver registros
            'UPDATE',    -- Actualizar registros existentes
            'DELETE',    -- Eliminar registros
            'APPROVE',   -- Aprobar cotizaciones/eventos
            'REJECT',    -- Rechazar cotizaciones/eventos
            'EXPORT',    -- Exportar datos
            'IMPORT'     -- Importar datos
        );
    END IF;

    -- Crear enum PermissionResource si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PermissionResource') THEN
        CREATE TYPE "PermissionResource" AS ENUM (
            'USERS',          -- Usuarios del sistema
            'CLIENTS',        -- Clientes
            'EVENTS',         -- Eventos
            'QUOTES',         -- Cotizaciones
            'PRODUCTS',       -- Productos
            'SERVICES',       -- Servicios
            'VENUES',         -- Venues/locales
            'PACKAGES',       -- Paquetes
            'REPORTS',        -- Reportes
            'CONFIGURATIONS', -- Configuraciones del sistema
            'ROLES'           -- Gestión de roles (meta-permiso)
        );
    END IF;
END $$;

-- Crear tabla roles si no existe
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

-- Crear índices para tabla roles
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key" ON "roles"("name");
CREATE INDEX IF NOT EXISTS "roles_type_idx" ON "roles"("type");
CREATE INDEX IF NOT EXISTS "roles_tenantId_idx" ON "roles"("tenantId");

-- Crear tabla user_roles si no existe
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

-- Crear índices para tabla user_roles
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_userId_roleId_tenantId_key" ON "user_roles"("userId", "roleId", "tenantId");
CREATE INDEX IF NOT EXISTS "user_roles_userId_idx" ON "user_roles"("userId");
CREATE INDEX IF NOT EXISTS "user_roles_roleId_idx" ON "user_roles"("roleId");
CREATE INDEX IF NOT EXISTS "user_roles_tenantId_idx" ON "user_roles"("tenantId");

-- Crear tabla permissions si no existe
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "resource" "PermissionResource" NOT NULL,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- Crear índices para tabla permissions
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_roleId_action_resource_key" ON "permissions"("roleId", "action", "resource");
CREATE INDEX IF NOT EXISTS "permissions_roleId_idx" ON "permissions"("roleId");
CREATE INDEX IF NOT EXISTS "permissions_action_idx" ON "permissions"("action");
CREATE INDEX IF NOT EXISTS "permissions_resource_idx" ON "permissions"("resource");

-- Añadir foreign keys si no existen
DO $$
BEGIN
    -- FK para roles -> tenants (solo si existe la tabla tenants)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'roles_tenantId_fkey') THEN
            ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;

    -- FK para user_roles -> roles
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_roles_roleId_fkey') THEN
        ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- FK para user_roles -> users (solo si existe la tabla users)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_roles_userId_fkey') THEN
            ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;

    -- FK para user_roles -> tenants (solo si existe la tabla tenants)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_roles_tenantId_fkey') THEN
            ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;

    -- FK para user_roles -> users (assignedBy) (solo si existe la tabla users)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_roles_assignedBy_fkey') THEN
            ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    -- FK para permissions -> roles
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'permissions_roleId_fkey') THEN
        ALTER TABLE "permissions" ADD CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Sistema de roles flexibles instalado correctamente.';
    RAISE NOTICE 'Tablas creadas: roles, user_roles, permissions';
    RAISE NOTICE 'Enums creados: RoleType, PermissionAction, PermissionResource';
END $$;