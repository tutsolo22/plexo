// =========================================================================
// SEED SCRIPT: ROLES Y PERMISOS POR DEFECTO
// =========================================================================
// Este script crea los roles por defecto del sistema con sus permisos
// correspondientes. Se puede ejecutar independientemente.
// =========================================================================

import { RoleType } from '@prisma/client'
import { roleManagementService, getDefaultPermissions } from '../src/lib/role-management'
import { prisma } from '../src/lib/prisma'

// =========================================================================
// DEFINICIÓN DE ROLES POR DEFECTO
// =========================================================================

const DEFAULT_ROLES = [
  {
    name: 'Super Administrador',
    type: 'SUPER_ADMIN' as RoleType,
    description: 'Administrador del sistema completo con acceso total a todas las funcionalidades y configuraciones. Puede gestionar usuarios, roles y configuraciones globales.',
    tenantId: null, // Rol global
  },
  {
    name: 'Administrador del Tenant',
    type: 'TENANT_ADMIN' as RoleType,
    description: 'Administrador con control total dentro de su organización. Puede gestionar usuarios, eventos, clientes y configuraciones del tenant.',
    tenantId: null, // Se asignará al tenant específico cuando se use
  },
  {
    name: 'Manager',
    type: 'MANAGER' as RoleType,
    description: 'Manager con permisos de aprobación y supervisión. Puede aprobar cotizaciones, gestionar eventos y supervisar operaciones.',
    tenantId: null,
  },
  {
    name: 'Usuario',
    type: 'USER' as RoleType,
    description: 'Usuario básico del sistema con permisos estándar para operaciones cotidianas como crear eventos y cotizaciones.',
    tenantId: null,
  },
  {
    name: 'Cliente Externo',
    type: 'CLIENT_EXTERNAL' as RoleType,
    description: 'Cliente externo con acceso limitado para ver sus propias cotizaciones y eventos.',
    tenantId: null,
  },
  {
    name: 'Ejecutivo de Ventas',
    type: 'SALES' as RoleType,
    description: 'Especialista en ventas enfocado en gestión de clientes, cotizaciones y seguimiento comercial.',
    tenantId: null,
  },
  {
    name: 'Coordinador de Eventos',
    type: 'COORDINATOR' as RoleType,
    description: 'Especialista en coordinación y planificación de eventos. Gestiona la logística y coordinación operativa.',
    tenantId: null,
  },
  {
    name: 'Personal de Finanzas',
    type: 'FINANCE' as RoleType,
    description: 'Personal especializado en gestión financiera, reportes y análisis económico de eventos y operaciones.',
    tenantId: null,
  },
]

// =========================================================================
// FUNCIONES DE SEED
// =========================================================================

async function seedDefaultRoles() {
  console.log('🎭 Iniciando seed de roles por defecto...')

  try {
    for (const roleData of DEFAULT_ROLES) {
      console.log(`\n🔄 Procesando rol: ${roleData.name} (${roleData.type})`)

      // Verificar si el rol ya existe
      const existingRole = await prisma.role.findFirst({
        where: {
          type: roleData.type,
          name: roleData.name,
        },
      })

      if (existingRole) {
        console.log(`  ⚠️  Rol ya existe, omitiendo: ${roleData.name}`)
        continue
      }

      // Obtener permisos por defecto para este tipo de rol
      const defaultPermissions = getDefaultPermissions(roleData.type)
      console.log(`  📋 Permisos a asignar: ${defaultPermissions.length}`)

      // Crear el rol con sus permisos
      const newRole = await roleManagementService.createRole({
        name: roleData.name,
        type: roleData.type,
        description: roleData.description,
        ...(roleData.tenantId ? { tenantId: roleData.tenantId } : {}),
        permissions: defaultPermissions,
      })

  console.log(`  ✅ Rol creado exitosamente: ${(newRole as any)?.name} (ID: ${(newRole as any)?.id})`)
  console.log(`  📊 Permisos creados: ${((newRole as any)?.permissions || []).length}`)
    }

    console.log('\n🎉 Seed de roles completado exitosamente!')
    
    // Mostrar resumen final
    await showRolesSummary()

  } catch (error) {
    console.error('❌ Error durante el seed de roles:', error)
    throw error
  }
}

async function showRolesSummary() {
  console.log('\n📊 RESUMEN DE ROLES EN EL SISTEMA:')
  console.log('=' .repeat(60))

  // NOTE: roleManagementService.listRoles may return complex typed objects
  // from the role service. For the purpose of this seed script we cast to
  // `any[]` to avoid TS type mismatches between service return types and
  // this script's quick logging. If you need stricter types, adapt the
  // service return signature instead.
  const roles = (await roleManagementService.listRoles({
    includeGlobal: true,
  })) as any[]

  for (const role of roles) {
    console.log(`\n🎭 ${role?.name} (${role?.type})`)
    console.log(`   📝 Descripción: ${role?.description || 'Sin descripción'}`)
    console.log(`   🏢 Tenant: ${role?.tenantId || 'Global'}`)
    console.log(`   📊 Permisos: ${role?._count?.permissions || 0}`)
    console.log(`   👥 Usuarios asignados: ${role?._count?.userRoles || 0}`)
    console.log(`   ✅ Activo: ${role?.isActive ? 'Sí' : 'No'}`)
    
    // Mostrar algunos permisos como ejemplo
    if (Array.isArray(role?.permissions) && role.permissions.length > 0) {
      console.log(`   🔐 Permisos principales:`)
      role.permissions.slice(0, 5).forEach((permission: any) => {
        console.log(`      • ${permission?.action} -> ${permission?.resource}`)
      })
      if (role.permissions.length > 5) {
        console.log(`      ... y ${role.permissions.length - 5} más`)
      }
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log(`📋 Total de roles: ${roles.length}`)
  console.log(`🔐 Total de permisos: ${roles.reduce((sum, role) => sum + role._count.permissions, 0)}`)
}

// =========================================================================
// FUNCIÓN PARA ASIGNAR ROLES A USUARIOS EXISTENTES
// =========================================================================

async function assignDefaultRolesToExistingUsers() {
  console.log('\n👥 Asignando roles por defecto a usuarios existentes...')

  try {
    // Obtener usuarios existentes que usan el sistema legacy
    const usersWithLegacyRoles = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true, // Campo legacy
        tenantId: true,
      }
    })

    if (usersWithLegacyRoles.length === 0) {
      console.log('  ℹ️  No hay usuarios existentes para migrar')
      return
    }

    console.log(`  📊 Encontrados ${usersWithLegacyRoles.length} usuarios para migrar`)

    // Mapeo de roles legacy a nuevos roles
    const legacyToNewRoleMapping: Record<string, RoleType> = {
      'SUPER_ADMIN': 'SUPER_ADMIN',
      'TENANT_ADMIN': 'TENANT_ADMIN',
      'MANAGER': 'MANAGER',
      'USER': 'USER',
      'CLIENT_EXTERNAL': 'CLIENT_EXTERNAL',
    }

    for (const user of usersWithLegacyRoles) {
      console.log(`\n🔄 Procesando usuario: ${user.email}`)

      // Obtener el tipo de rol nuevo basado en el rol legacy
      const newRoleType = legacyToNewRoleMapping[user.role]
      
      if (!newRoleType) {
        console.log(`  ⚠️  Rol legacy no reconocido: ${user.role}, asignando USER por defecto`)
      }

      // Buscar el rol correspondiente en el nuevo sistema
      const targetRole = await prisma.role.findFirst({
        where: {
          type: newRoleType || 'USER',
          isActive: true,
        },
      })

      if (!targetRole) {
        console.log(`  ❌ No se encontró rol de tipo: ${newRoleType}`)
        continue
      }

      // Verificar si ya tiene asignado este rol
      const existingAssignment = await prisma.userRole.findFirst({
        where: {
          userId: user.id,
          roleId: targetRole.id,
          isActive: true,
        },
      })

      if (existingAssignment) {
        console.log(`  ⚠️  Usuario ya tiene asignado el rol: ${targetRole.name}`)
        continue
      }

      // Asignar el nuevo rol
      await roleManagementService.assignRole({
        userId: user.id,
        roleId: targetRole.id,
        tenantId: user.tenantId,
        // assignedBy: null, // Asignación automática del sistema
      })

      console.log(`  ✅ Rol asignado: ${targetRole.name} -> ${user.email}`)
    }

    console.log('\n🎉 Migración de usuarios completada!')

  } catch (error) {
    console.error('❌ Error durante la asignación de roles:', error)
    throw error
  }
}

// =========================================================================
// EJECUCIÓN PRINCIPAL
// =========================================================================

async function main() {
  console.log('🚀 INICIANDO SEED COMPLETO DEL SISTEMA DE ROLES FLEXIBLES')
  console.log('=' .repeat(70))

  try {
    // 1. Crear roles por defecto
    await seedDefaultRoles()

    // 2. Asignar roles a usuarios existentes
    await assignDefaultRolesToExistingUsers()

    console.log('\n✅ SEED COMPLETO EXITOSO!')
    console.log('🎭 Sistema de roles flexibles configurado correctamente')
    console.log('👥 Usuarios migrados al nuevo sistema de roles')

  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL SEED:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error)
}

export { seedDefaultRoles, assignDefaultRolesToExistingUsers, showRolesSummary }