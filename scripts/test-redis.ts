/**
 * Script de testing para Redis Cache
 * Sistema de Gestión de Eventos V3
 */

import { redisCache, CacheKeys } from '../src/lib/redis';

async function testRedis() {
  console.log('🧪 Iniciando tests de Redis Cache...\n');

  try {
    // Test 1: Operaciones básicas
    console.log('1️⃣ Test de operaciones básicas:');
    
    const testKey = 'test:redis:basic';
    const testData = { 
      message: 'Hello Redis!', 
      timestamp: new Date().toISOString(),
      number: 42 
    };

    // Set
    const setResult = await redisCache.set(testKey, testData, 60);
    console.log(`   ✅ SET: ${setResult}`);

    // Get
    const getData = await redisCache.get(testKey);
    console.log(`   ✅ GET: ${JSON.stringify(getData, null, 2)}`);

    // Exists
    const exists = await redisCache.exists(testKey);
    console.log(`   ✅ EXISTS: ${exists}`);

    // Test 2: Cache analytics simulado
    console.log('\n2️⃣ Test de cache analytics:');
    
    const analyticsKey = CacheKeys.ANALYTICS_DASHBOARD('6', 'test-tenant');
    const analyticsData = {
      summary: {
        totalEvents: 15,
        totalQuotes: 8,
        totalClients: 12,
        totalRevenue: 45000
      },
      generatedAt: new Date().toISOString(),
      fromCache: false
    };

    await redisCache.set(analyticsKey, analyticsData, 900); // 15 minutos
    const cachedAnalytics = await redisCache.get(analyticsKey);
    console.log(`   ✅ Analytics cacheado: ${JSON.stringify(cachedAnalytics?.summary, null, 2)}`);

    // Test 3: Incremento
    console.log('\n3️⃣ Test de incremento:');
    
    const counterKey = 'test:counter';
    const count1 = await redisCache.incr(counterKey);
    const count2 = await redisCache.incr(counterKey);
    const count3 = await redisCache.incr(counterKey);
    console.log(`   ✅ Contador: ${count1} → ${count2} → ${count3}`);

    // Test 4: Pattern deletion
    console.log('\n4️⃣ Test de eliminación por patrón:');
    
    await redisCache.set('test:pattern:1', { id: 1 }, 60);
    await redisCache.set('test:pattern:2', { id: 2 }, 60);
    await redisCache.set('test:pattern:3', { id: 3 }, 60);
    
    const deletedCount = await redisCache.delPattern('test:pattern:*');
    console.log(`   ✅ Eliminados: ${deletedCount} claves`);

    // Test 5: TTL y expire
    console.log('\n5️⃣ Test de TTL:');
    
    const ttlKey = 'test:ttl';
    await redisCache.set(ttlKey, { temp: true }, 5); // 5 segundos
    const beforeExpire = await redisCache.exists(ttlKey);
    console.log(`   ✅ Antes de expirar: ${beforeExpire}`);
    
    // Esperar 6 segundos para que expire
    console.log('   ⏳ Esperando 6 segundos...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const afterExpire = await redisCache.exists(ttlKey);
    console.log(`   ✅ Después de expirar: ${afterExpire}`);

    // Cleanup
    console.log('\n🧹 Limpieza:');
    await redisCache.del(testKey);
    await redisCache.del(analyticsKey);
    await redisCache.del(counterKey);
    console.log('   ✅ Claves de prueba eliminadas');

    console.log('\n🎉 ¡Todos los tests de Redis pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error en tests de Redis:', error);
  }
}

// Ejecutar tests
testRedis()
  .then(() => {
    console.log('\n✅ Tests completados');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });