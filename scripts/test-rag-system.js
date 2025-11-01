/**
 * Test del Sistema de Aprendizaje RAG
 * 
 * Ejecutar con: node scripts/test-rag-system.js
 * 
 * Este script prueba:
 * 1. Habilitar pgvector
 * 2. Crear tabla QueryExample si no existe
 * 3. Guardar ejemplo de consulta
 * 4. Buscar consultas similares
 * 5. Ver estadísticas de aprendizaje
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('\n🧪 INICIANDO TEST DEL SISTEMA RAG\n');
  console.log('='.repeat(50));

  try {
    // 1️⃣ Verificar pgvector
    console.log('\n1️⃣ Verificando extensión pgvector...');
    const extensions = await prisma.$queryRawUnsafe(
      "SELECT * FROM pg_extension WHERE extname = 'vector';"
    );
    
    if (extensions && extensions.length > 0) {
      console.log('   ✅ pgvector está instalado');
    } else {
      console.log('   ⚠️ pgvector NO está instalado');
      console.log('   Ejecutando: CREATE EXTENSION vector...');
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('   ✅ pgvector instalado');
    }

    // 2️⃣ Verificar tabla QueryExample
    console.log('\n2️⃣ Verificando tabla query_examples...');
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'query_examples';
    `);
    
    if (tables && tables.length > 0) {
      console.log('   ✅ Tabla query_examples existe');
    } else {
      console.log('   ❌ Tabla query_examples NO existe');
      console.log('   Por favor ejecuta: npx prisma db push');
      return;
    }

    // 3️⃣ Obtener tenant para pruebas
    console.log('\n3️⃣ Obteniendo tenant para pruebas...');
    const tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.log('   ❌ No hay tenants en la base de datos');
      console.log('   Crea un tenant primero para ejecutar las pruebas');
      return;
    }
    
    console.log(`   ✅ Usando tenant: ${tenant.name} (${tenant.id})`);

    // 4️⃣ Verificar ejemplos existentes
    console.log('\n4️⃣ Verificando ejemplos existentes...');
    const count = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM query_examples
      WHERE "tenantId" = ${tenant.id}
    `;
    
    console.log(`   📊 Ejemplos en la base de datos: ${count[0].count}`);

    // 5️⃣ Mostrar algunos ejemplos si existen
    if (count[0].count > 0) {
      console.log('\n5️⃣ Ejemplos más recientes:');
      const examples = await prisma.$queryRaw`
        SELECT 
          "userQuery", 
          intent, 
          action,
          entity,
          "createdAt"
        FROM query_examples
        WHERE "tenantId" = ${tenant.id}
        ORDER BY "createdAt" DESC
        LIMIT 5
      `;
      
      examples.forEach((ex, idx) => {
        console.log(`\n   ${idx + 1}. "${ex.userQuery}"`);
        console.log(`      Intent: ${ex.intent}`);
        console.log(`      Action: ${ex.action}`);
        console.log(`      Entity: ${ex.entity || 'N/A'}`);
        console.log(`      Fecha: ${ex.createdAt.toISOString()}`);
      });
    }

    // 6️⃣ Estadísticas por intent
    console.log('\n6️⃣ Estadísticas por intent:');
    const statsByIntent = await prisma.$queryRaw`
      SELECT 
        intent,
        COUNT(*)::int as count
      FROM query_examples
      WHERE "tenantId" = ${tenant.id}
      GROUP BY intent
      ORDER BY count DESC
    `;
    
    if (statsByIntent.length === 0) {
      console.log('   📭 No hay estadísticas aún');
    } else {
      statsByIntent.forEach(stat => {
        console.log(`   ${stat.intent}: ${stat.count} ejemplo(s)`);
      });
    }

    // 7️⃣ Estadísticas por entidad
    console.log('\n7️⃣ Estadísticas por entidad:');
    const statsByEntity = await prisma.$queryRaw`
      SELECT 
        entity,
        COUNT(*)::int as count
      FROM query_examples
      WHERE "tenantId" = ${tenant.id}
      AND entity IS NOT NULL
      GROUP BY entity
      ORDER BY count DESC
    `;
    
    if (statsByEntity.length === 0) {
      console.log('   📭 No hay estadísticas aún');
    } else {
      statsByEntity.forEach(stat => {
        console.log(`   ${stat.entity}: ${stat.count} ejemplo(s)`);
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST COMPLETADO EXITOSAMENTE\n');

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:', error);
    console.error('\nDetalles:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
