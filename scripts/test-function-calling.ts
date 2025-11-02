/**
 * Script de prueba rápida para Function Calling
 * Prueba las mutaciones del CRM Agent v2.4
 */

import { crmAgentService } from '@/lib/ai/crm-agent-v2';

async function testMutations() {
  console.log('🧪 Iniciando pruebas de Function Calling\n');

  const context = {
    tenantId: 'test-tenant-id',
    userRole: 'TENANT_ADMIN',
  };

  // TEST 1: Crear cliente
  console.log('📝 Test 1: Crear cliente');
  const createClientResult = await crmAgentService.processQuery(
    'Crea un cliente llamado Juan Pérez con email juan.perez@example.com y teléfono 555-1234',
    context
  );
  console.log('Resultado:', createClientResult.response);
  console.log('---\n');

  // TEST 2: Listar clientes
  console.log('📝 Test 2: Listar clientes');
  const listClientsResult = await crmAgentService.processQuery(
    'Dame la lista de todos los clientes',
    context
  );
  console.log('Resultado:', listClientsResult.response);
  console.log('---\n');

  // TEST 3: Crear evento (requiere clientId del test 1)
  console.log('📝 Test 3: Crear evento');
  const createEventResult = await crmAgentService.processQuery(
    'Crea un evento llamado "Boda de Juan" para el 25 de diciembre de 2025 de 6pm a 11pm',
    context
  );
  console.log('Resultado:', createEventResult.response);
  console.log('---\n');

  // TEST 4: Contar eventos
  console.log('📝 Test 4: Contar eventos');
  const countEventsResult = await crmAgentService.processQuery(
    '¿Cuántos eventos tengo?',
    context
  );
  console.log('Resultado:', countEventsResult.response);
  console.log('---\n');

  // TEST 5: Crear cotización
  console.log('📝 Test 5: Crear cotización');
  const createQuoteResult = await crmAgentService.processQuery(
    'Genera una cotización de $5000 válida hasta el 31 de enero',
    context
  );
  console.log('Resultado:', createQuoteResult.response);
  console.log('---\n');

  // TEST 6: Actualizar cliente
  console.log('📝 Test 6: Actualizar cliente');
  const updateClientResult = await crmAgentService.processQuery(
    'Actualiza el cliente y cambia su tipo a VIP',
    context
  );
  console.log('Resultado:', updateClientResult.response);
  console.log('---\n');

  console.log('✅ Pruebas completadas');
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testMutations().catch(console.error);
}

export { testMutations };
