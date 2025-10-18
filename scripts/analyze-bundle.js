/**
 * Script para análisis de Bundle Size
 * Sistema de Gestión de Eventos V3
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function analyzeBundleSize() {
  console.log('📦 Analizando tamaño del bundle...\n');

  try {
    // 1. Build normal
    console.log('1️⃣ Construyendo aplicación...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Analizar tamaños de archivos
    console.log('\n2️⃣ Analizando archivos generados...');
    
    const buildDir = path.join(process.cwd(), '.next');
    const staticDir = path.join(buildDir, 'static');
    
    if (fs.existsSync(staticDir)) {
      const chunks = fs.readdirSync(path.join(staticDir, 'chunks')).filter(f => f.endsWith('.js'));
      
      console.log('\n📊 Chunks principales:');
      chunks.forEach(chunk => {
        const filePath = path.join(staticDir, 'chunks', chunk);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   📦 ${chunk}: ${sizeKB} KB`);
      });
    }

    // 3. Generar reporte con bundle analyzer
    console.log('\n3️⃣ Generando reporte de bundle analyzer...');
    process.env.ANALYZE = 'true';
    execSync('npm run build', { stdio: 'inherit' });

    console.log('\n🎉 Análisis completado!');
    console.log('\nRecomendaciones de optimización:');
    console.log('1. Lazy load componentes pesados');
    console.log('2. Code splitting por rutas');
    console.log('3. Tree shaking de librerías no usadas');
    console.log('4. Compresión gzip en servidor');

  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
  }
}

// Ejecutar análisis
analyzeBundleSize()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });