// =========================================================================
// SCRIPT DE MIGRACIÓN MANUAL: SISTEMA DE ROLES FLEXIBLES
// =========================================================================
// Este script ejecuta la migración manual del sistema de roles flexibles
// usando PostgreSQL directamente.
// =========================================================================

import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

async function executeMigration() {
  // Configuración de la base de datos desde variables de entorno
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'gestion_user',
    password: 'gestion_password',
    database: 'gestion_de_eventos_db',
  })

  try {
    console.log('🔌 Conectando a la base de datos...')
    await client.connect()
    
    console.log('📄 Leyendo script de migración...')
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'manual-roles-migration.sql'), 
      'utf8'
    )
    
    console.log('🚀 Ejecutando migración del sistema de roles flexibles...')
    const result = await client.query(sqlScript)
    
    console.log('✅ Migración ejecutada exitosamente!')
    console.log(`📊 Resultado:`, result)
    
    // Verificar que las tablas fueron creadas
    console.log('🔍 Verificando tablas creadas...')
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('roles', 'user_roles', 'permissions')
      ORDER BY table_name;
    `
    
    const tablesResult = await client.query(tablesQuery)
    console.log('📋 Tablas del sistema de roles:')
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })
    
    // Verificar que los enums fueron creados
    console.log('🔍 Verificando enums creados...')
    const enumsQuery = `
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('RoleType', 'PermissionAction', 'PermissionResource')
      ORDER BY typname;
    `
    
    const enumsResult = await client.query(enumsQuery)
    console.log('🏷️ Enums del sistema de roles:')
    enumsResult.rows.forEach(row => {
      console.log(`  ✓ ${row.typname}`)
    })
    
    console.log('\n🎉 Sistema de roles flexibles instalado correctamente!')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Conexión cerrada.')
  }
}

// Ejecutar la migración
executeMigration().catch(console.error)