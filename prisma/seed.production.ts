import { LegacyUserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Iniciando seed limpio de producción...')

  // Crear tenant principal
  const mainTenant = await prisma.tenant.upsert({
    where: { domain: 'plexo.mx' },
    update: {},
    create: {
      name: 'Plexo - Gestión de Eventos',
      domain: 'plexo.mx',
      isActive: true,
    },
  })

  console.log('✅ Tenant principal creado:', mainTenant.name)

  // Crear Business Identity básica
  const businessIdentity = await prisma.businessIdentity.upsert({
    where: {
      id: 'plexo-main-identity'
    },
    update: {},
    create: {
      id: 'plexo-main-identity',
      name: 'Plexo Eventos',
      email: 'contacto@plexo.mx',
      phone: '+52 55 1234 5678',
      address: 'Av. Reforma 123, Ciudad de México, CDMX',
      website: 'https://plexo.mx',
      logo: '/logos/plexo-logo.png',
      slogan: 'Creamos experiencias inolvidables',
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Business Identity creado:', businessIdentity.name)

  // Hash para contraseña del admin (Password123)
  const adminPasswordHash = await bcrypt.hash('Password123', 10)

  // Crear único usuario super admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'soporteapps@hexalux.mx' },
    update: {},
    create: {
      email: 'soporteapps@hexalux.mx',
      password: adminPasswordHash,
      name: 'Administrador Sistema',
      role: LegacyUserRole.SUPER_ADMIN,
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Usuario administrador creado:', adminUser.email)
  console.log('🔐 Credenciales de acceso:')
  console.log('   Email: soporteapps@hexalux.mx')
  console.log('   Password: Password123')

  console.log('🎉 Seed de producción completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })