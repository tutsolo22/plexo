import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main(){
  const email = process.argv[2] || 'soporteapps@hexalux.mx'
  const plain = process.argv[3] || 'Password123'
  const user = await prisma.user.findUnique({ where: { email }, select: { password: true, email: true } })
  if(!user){
    console.log('NOT_FOUND', email)
  } else {
    console.log('FOUND', user.email)
    const ok = await bcrypt.compare(plain, user.password || '')
    console.log('bcrypt.compare ->', ok)
  }
  await prisma.$disconnect()
}

main().catch(e=>{ console.error(e); process.exit(1) })
