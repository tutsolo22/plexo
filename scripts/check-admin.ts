import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'soporteapps@hexalux.mx'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log(`No se encontró usuario con email ${email}`)
  } else {
    console.log('Usuario:', user.email)
    console.log('isActive:', user.isActive)
    console.log('emailVerified:', user.emailVerified)
    console.log('role:', user.role)
    console.log('tenantId:', user.tenantId)
    console.log('createdAt:', user.createdAt)
    console.log('updatedAt:', user.updatedAt)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
