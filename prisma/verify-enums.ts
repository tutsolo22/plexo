// Script de verificación de enums
import { prisma } from '../src/lib/prisma'

async function verifyEnums() {
  console.log('🔍 Verificando enums disponibles...')
  
  try {
    // Intentar consultar directamente la base de datos para ver los enums
    const result = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'RoleType')
      ORDER BY enumlabel;
    `
    
    console.log('✅ Valores de RoleType en BD:', result)
    
    const result2 = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PermissionResource')
      ORDER BY enumlabel;
    `
    
    console.log('✅ Valores de PermissionResource en BD:', result2)
    
    const result3 = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PermissionAction')
      ORDER BY enumlabel;
    `
    
    console.log('✅ Valores de PermissionAction en BD:', result3)
    
  } catch (error) {
    console.error('❌ Error verificando enums:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyEnums()