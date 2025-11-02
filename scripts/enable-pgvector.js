/**
 * Script para habilitar pgvector en PostgreSQL
 * Ejecutar con: node scripts/enable-pgvector.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enablePgVector() {
  try {
    console.log('🔧 Habilitando extensión pgvector...');
    
    // Crear extensión pgvector si no existe
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    
    console.log('✅ Extensión pgvector habilitada correctamente');
    
    // Verificar que la extensión está instalada
    const result = await prisma.$queryRawUnsafe(
      "SELECT * FROM pg_extension WHERE extname = 'vector';"
    );
    
    if (result && result.length > 0) {
      console.log('✅ Verificación exitosa: pgvector está instalado');
    } else {
      console.warn('⚠️ No se pudo verificar la instalación de pgvector');
    }
    
  } catch (error) {
    console.error('❌ Error habilitando pgvector:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

enablePgVector();
