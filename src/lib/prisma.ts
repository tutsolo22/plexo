import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function buildDatabaseUrl(): string | undefined {
  // Use a typed alias so TypeScript allows bracket access without index-sig errors
  const env = process.env as Record<string, string | undefined>

  // If full DATABASE_URL is provided, prefer it
  if (env['DATABASE_URL'] && env['DATABASE_URL']!.trim() !== '') {
    return env['DATABASE_URL']
  }

  // If Cloud SQL socket is provided, build the socket-based URL.
  // Support both DB_* and POSTGRES_* env var names (some deploys use POSTGRES_*).
  const cloudsql = env['CLOUDSQL_CONNECTION_NAME']
  const dbUser = env['DB_USER'] ?? env['POSTGRES_USER']
  const dbPass = env['DB_PASS'] ?? env['POSTGRES_PASSWORD']
  const dbName = env['DB_NAME'] ?? env['POSTGRES_DB']
  if (cloudsql && dbUser && dbPass && dbName) {
    const u = encodeURIComponent(dbUser)
    const p = encodeURIComponent(dbPass)
    const d = encodeURIComponent(dbName)
    // socket-style URL expected by libpq: host=/cloudsql/<INSTANCE>
    return `postgresql://${u}:${p}@/${d}?host=/cloudsql/${cloudsql}`
  }

  // Otherwise, try host/port style
  const host = env['DB_HOST'] ?? env['POSTGRES_HOST'] ?? env['PGHOST']
  const port = env['DB_PORT'] ?? env['POSTGRES_PORT'] ?? env['PGPORT'] ?? '5432'
  if (host && dbUser && dbPass && dbName) {
    const u = encodeURIComponent(dbUser)
    const p = encodeURIComponent(dbPass)
    const d = encodeURIComponent(dbName)
    return `postgresql://${u}:${p}@${host}:${port}/${d}`
  }

  // Nothing we can build
  return undefined
}

const runtimeDatabaseUrl = buildDatabaseUrl()

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    // If we assembled a runtime URL, pass it explicitly so Prisma doesn't rely on
    // build-time envs or implicit process.env values.
    ...(runtimeDatabaseUrl ? { datasources: { db: { url: runtimeDatabaseUrl } } } : {}),
  })

export { prisma }

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma