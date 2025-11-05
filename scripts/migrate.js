#!/usr/bin/env node#!/usr/bin/env node

// eslint-disable-next-line eslint-comments/disable-enable-pair

/**/* eslint-disable */

 * Script para ejecutar migraciones y luego iniciar Next.js

 * Se ejecuta automáticamente cuando inicia la aplicación en Cloud Run/**

 * Usa las variables de entorno de Cloud Run en tiempo de ejecución * Script para ejecutar migraciones y luego iniciar Next.js

 */ * Se ejecuta automáticamente cuando inicia la aplicación en Cloud Run

 * Usa las variables de entorno de Cloud Run en tiempo de ejecución

const { execSync } = require('child_process'); */



try {const { execSync } = require('child_process');

  console.log('🚀 Iniciando secuencia de startup...');

try {

  // Verificar que DATABASE_URL existe  console.log('🚀 Iniciando secuencia de startup...');

  if (!process.env.DATABASE_URL) {  

    console.warn('⚠️  DATABASE_URL no configurada, omitiendo migraciones');  // Verificar que DATABASE_URL existe

  } else {  if (!process.env.DATABASE_URL) {

    console.log('📦 Ejecutando migraciones de Prisma...');    console.warn('⚠️  DATABASE_URL no configurada, omitiendo migraciones');

  } else {

    try {    console.log('📦 Ejecutando migraciones de Prisma...');

      execSync('npx prisma migrate deploy --skip-generate', {    

        stdio: 'inherit',    try {

        env: {      execSync('npx prisma migrate deploy --skip-generate', {

          ...process.env,        stdio: 'inherit',

          NODE_ENV: 'production'        env: {

        }          ...process.env,

      });          NODE_ENV: 'production'

      console.log('✅ Migraciones completadas');        }

    } catch (error) {      });

      console.warn('⚠️  Advertencia en migraciones (continuando):', error.message);      console.log('✅ Migraciones completadas');

      // No detener si hay error - las tablas pueden ya existir    } catch (error) {

    }      console.warn('⚠️  Advertencia en migraciones (continuando):', error.message);

  }      // No detener si hay error - las tablas pueden ya existir

    }

  console.log('🔄 Iniciando Next.js...');  }

  execSync('next start', {

    stdio: 'inherit',  console.log('🔄 Iniciando Next.js...');

    cwd: process.cwd()  execSync('next start', {

  });    stdio: 'inherit',

} catch (error) {    cwd: process.cwd()

  console.error('❌ Error:', error.message);  });

  process.exit(1);

}} catch (error) {

  console.error('❌ Error:', error.message);
  process.exit(1);
}

