import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main(){
  const email = process.argv[2] || 'soporteapps@hexalux.mx'
  const plain = process.argv[3] || 'Password123'
  const hashed = await bcrypt.hash(plain, 10)
  const user = await prisma.user.update({ where: { email }, data: { password: hashed } })
  console.log('Updated', user.email)
  await prisma.$disconnect()
}

main().catch(e=>{ console.error(e); process.exit(1) })
