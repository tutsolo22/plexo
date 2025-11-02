import { prisma } from '../src/lib/prisma'

async function main(){
  const email = process.argv[2] || 'soporteapps@hexalux.mx'
  const user = await prisma.user.findUnique({ where: { email } })
  if(!user){
    console.log('NOT_FOUND', email)
  } else {
    const { password, ...rest } = user as any
    console.log('FOUND', rest)
    console.log('passwordHashPresent:', !!password)
  }
  await prisma.$disconnect()
}

main().catch(e=>{ console.error(e); process.exit(1) })
