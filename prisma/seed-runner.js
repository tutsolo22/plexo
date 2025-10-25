// JavaScript seed runner that uses the generated Prisma Client directly.
// This file is safe to run from the production image (no TypeScript runtime required).
const bcrypt = require('bcryptjs')

function buildDatabaseUrl() {
  const env = process.env
  if (env.DATABASE_URL && env.DATABASE_URL.trim() !== '') return env.DATABASE_URL

  // Prefer explicit host/port if provided (e.g., 127.0.0.1 when Cloud SQL proxy listens on localhost)
  const host = env.DB_HOST ?? env.POSTGRES_HOST ?? env.PGHOST
  const port = env.DB_PORT ?? env.POSTGRES_PORT ?? env.PGPORT ?? '5432'
  const dbUser = env.DB_USER ?? env.POSTGRES_USER
  const dbPass = env.DB_PASS ?? env.POSTGRES_PASSWORD
  const dbName = env.DB_NAME ?? env.POSTGRES_DB
  if (host && dbUser && dbPass && dbName) {
    const u = encodeURIComponent(dbUser)
    const p = encodeURIComponent(dbPass)
    const d = encodeURIComponent(dbName)
    return `postgresql://${u}:${p}@${host}:${port}/${d}`
  }

  // Fallback: Cloud SQL Unix socket connection
  const cloudsql = env.CLOUDSQL_CONNECTION_NAME
  if (cloudsql && dbUser && dbPass && dbName) {
    const u = encodeURIComponent(dbUser)
    const p = encodeURIComponent(dbPass)
    const d = encodeURIComponent(dbName)
    return `postgresql://${u}:${p}@/${d}?host=/cloudsql/${cloudsql}`
  }

  return undefined
}

const runtimeDatabaseUrl = buildDatabaseUrl()
// If we built a runtime URL, ensure Prisma reads it by setting DATABASE_URL
if (runtimeDatabaseUrl && (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '')) {
  // Diagnostic: don't print secrets. Log presence and whether encoding changed.
  try {
    const env = process.env
    const pass = env.DB_PASS ?? env.POSTGRES_PASSWORD
    const passPresent = !!(pass && pass.length > 0)
    const encodedPass = passPresent ? encodeURIComponent(pass) : undefined
    const needsEncoding = passPresent ? encodedPass !== pass : false
    console.log('🔎 seed-runner: DB envs present ->', {
      DB_HOST: !!env.DB_HOST,
      POSTGRES_USER: !!env.POSTGRES_USER,
      POSTGRES_DB: !!env.POSTGRES_DB,
      POSTGRES_PASSWORD_present: passPresent,
      POSTGRES_PASSWORD_needsEncoding: needsEncoding,
    })
    // Mask password when logging the URL
    const maskedUrl = runtimeDatabaseUrl.replace(/:(?:[^:@]+)@/, ':***@')
    console.log('🔎 seed-runner: constructed DATABASE_URL (masked):', maskedUrl)
  } catch (e) {
    console.log('🔎 seed-runner: diagnostic logging failed:', e?.message ?? e)
  }

  process.env.DATABASE_URL = runtimeDatabaseUrl
}

// Require Prisma after DATABASE_URL is set so the client doesn't attempt to
// resolve env() in the schema before we provide the value.
const { PrismaClient, LegacyUserRole } = require('@prisma/client')
const prisma = new PrismaClient(runtimeDatabaseUrl ? { datasources: { db: { url: runtimeDatabaseUrl } } } : {})

async function main() {
  console.log('🌱 Iniciando seed limpio de producción (runner JS)...')
  // Tenant: crear sólo si no existe
  let mainTenant = await prisma.tenant.findUnique({ where: { domain: 'plexo.mx' } })
  if (!mainTenant) {
    mainTenant = await prisma.tenant.create({
      data: {
        name: 'Plexo - Gestión de Eventos',
        domain: 'plexo.mx',
        isActive: true,
      },
    })
    console.log('✅ Tenant principal creado:', mainTenant.name)
  } else {
    console.log('ℹ️ Tenant principal ya existe, se omitió creación:', mainTenant.name)
  }

  // BusinessIdentity: crear sólo si no existe
  let businessIdentity = await prisma.businessIdentity.findUnique({ where: { id: 'plexo-main-identity' } })
  if (!businessIdentity) {
    businessIdentity = await prisma.businessIdentity.create({
      data: {
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
  } else {
    console.log('ℹ️ Business Identity ya existe, se omitió creación:', businessIdentity.name)
  }

  // Usuario administrador: crear sólo si no existe
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'soporteapps@hexalux.mx' } })
  if (existingAdmin) {
    console.log('ℹ️ Usuario administrador ya existe, se omitió creación:', existingAdmin.email)
  } else {
    const adminPasswordHash = await bcrypt.hash('Password123', 10)
    const adminUser = await prisma.user.create({
      data: {
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
  }
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
