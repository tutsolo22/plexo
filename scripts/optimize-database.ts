/**
 * Script para crear índices optimizados
 * Sistema de Gestión de Eventos V3
 */

import { prisma } from '../src/lib/prisma';
import { RECOMMENDED_INDEXES } from '../src/lib/database-optimizer';

async function createOptimizedIndexes() {
  console.log('🔧 Creando índices optimizados para mejor performance...\n');

  try {
    // Verificar conexión a BD
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL');

    // Crear cada índice
    for (const [indexName, sql] of Object.entries(RECOMMENDED_INDEXES)) {
      try {
        console.log(`📝 Creando índice: ${indexName}`);
        
        await prisma.$executeRawUnsafe(sql);
        console.log(`✅ Índice ${indexName} creado exitosamente`);
        
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Índice ${indexName} ya existe`);
        } else {
          console.error(`❌ Error creando índice ${indexName}:`, error.message);
        }
      }
    }

    // Verificar estadísticas de índices
    console.log('\n📊 Verificando índices existentes...');
    
    const indexStats = await prisma.$queryRaw`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
        AND (
          indexname LIKE 'idx_events%' OR
          indexname LIKE 'idx_quotes%' OR
          indexname LIKE 'idx_clients%'
        )
      ORDER BY tablename, indexname
    `;

    console.log('\n🔍 Índices personalizados encontrados:');
    if (Array.isArray(indexStats) && indexStats.length > 0) {
      indexStats.forEach((index: any) => {
        console.log(`   📌 ${index.tablename}.${index.indexname}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron índices personalizados');
    }

    // Analizar tablas para actualizar estadísticas
    console.log('\n🔄 Actualizando estadísticas de tablas...');
    
    const tables = ['Event', 'Quote', 'Client', 'User'];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
      console.log(`✅ Estadísticas actualizadas para tabla ${table}`);
    }

    console.log('\n🎉 ¡Optimización de base de datos completada!');
    console.log('\nRecomendaciones adicionales:');
    console.log('1. Monitorear queries lentas con pg_stat_statements');
    console.log('2. Considerar particionado para tablas grandes');
    console.log('3. Revisar configuración de PostgreSQL para production');

  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
createOptimizedIndexes()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });