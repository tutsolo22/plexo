// Script de prueba para configuración SMTP
// Ejecutar con: node test-smtp.js

import { EmailService } from '../src/lib/email/email-service.js';

async function testSMTPConfiguration() {
  console.log('🧪 Probando configuración SMTP...\n');
  
  try {
    // Verificar variables de entorno
    console.log('📋 Variables de entorno:');
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'NO CONFIGURADO'}`);
    console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'NO CONFIGURADO'}`);
    console.log(`SMTP_USER: ${process.env.SMTP_USER || 'NO CONFIGURADO'}`);
    console.log(`SMTP_FROM: ${process.env.SMTP_FROM || 'NO CONFIGURADO'}`);
    console.log('');

    // Crear instancia del servicio de email
    const emailService = new EmailService();
    
    // Verificar conexión SMTP
    console.log('🔌 Verificando conexión SMTP...');
    const isConnected = await emailService.verifyConnection();
    
    if (isConnected) {
      console.log('✅ Conexión SMTP exitosa!');
      
      // Probar envío de email de prueba (opcional)
      console.log('\n📧 ¿Quieres enviar un email de prueba? (requiere configuración real)');
      console.log('Descomenta las líneas siguientes para probar:');
      console.log('');
      console.log('/*');
      console.log('const testResult = await emailService.sendEmail({');
      console.log('  to: "destinatario@example.com",');
      console.log('  subject: "Test Email - Gestión de Eventos",');
      console.log('  html: "<h1>¡Email funcionando!</h1><p>El sistema de emails está configurado correctamente.</p>"');
      console.log('});');
      console.log('console.log("📧 Email enviado:", testResult);');
      console.log('*/');
      
    } else {
      console.log('❌ Error en conexión SMTP');
      console.log('Verifica tu configuración en el archivo .env');
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.log('\n🔧 Soluciones posibles:');
    console.log('1. Verificar credenciales SMTP');
    console.log('2. Habilitar "Apps menos seguras" o generar App Password');
    console.log('3. Verificar firewall/antivirus');
    console.log('4. Probar con diferentes proveedores de email');
  }
}

// Verificar que tenemos las variables necesarias
if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
  console.log('⚠️  Configuración SMTP incompleta!');
  console.log('');
  console.log('📝 Para testing real, actualiza tu archivo .env con:');
  console.log('');
  console.log('# Gmail Example:');
  console.log('SMTP_HOST="smtp.gmail.com"');
  console.log('SMTP_PORT="587"');
  console.log('SMTP_USER="tu-email@gmail.com"');
  console.log('SMTP_PASS="tu-app-password"');
  console.log('SMTP_FROM="tu-email@gmail.com"');
  console.log('');
  console.log('# Outlook Example:');
  console.log('SMTP_HOST="smtp-mail.outlook.com"');
  console.log('SMTP_PORT="587"');
  console.log('SMTP_USER="tu-email@outlook.com"');
  console.log('SMTP_PASS="tu-password"');
  console.log('SMTP_FROM="tu-email@outlook.com"');
  console.log('');
  console.log('🔑 Para Gmail, necesitas generar un "App Password":');
  console.log('1. Habilitar 2FA en tu cuenta de Google');
  console.log('2. Ir a "Contraseñas de aplicaciones"');
  console.log('3. Generar nueva contraseña para "Mail"');
  console.log('4. Usar esa contraseña en SMTP_PASS');
} else {
  // Ejecutar pruebas
  testSMTPConfiguration();
}