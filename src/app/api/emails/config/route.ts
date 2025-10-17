import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// En un entorno de producción, esto debería estar en una base de datos
// Por simplicidad, lo almacenamos en variables de entorno
let smtpConfig: any = null;

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Intentar cargar desde variables de entorno
    const config = {
      host: process.env['SMTP_HOST'] || '',
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: process.env['SMTP_SECURE'] === 'true',
      user: process.env['SMTP_USER'] || '',
      password: process.env['SMTP_PASSWORD'] || '',
      from: process.env['SMTP_FROM'] || '',
      replyTo: process.env['SMTP_REPLY_TO'] || ''
    };

    // Si hay configuración guardada en memoria, usarla
    if (smtpConfig) {
      Object.assign(config, smtpConfig);
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        password: config.password ? '********' : '' // Ocultar contraseña
      }
    });

  } catch (error) {
    console.error('Error loading email configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const config = await request.json();

    // Validar campos requeridos
    if (!config.host || !config.port || !config.user || !config.password || !config.from) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos marcados con * son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.from)) {
      return NextResponse.json(
        { success: false, error: 'El email remitente no tiene un formato válido' },
        { status: 400 }
      );
    }

    if (config.replyTo && !emailRegex.test(config.replyTo)) {
      return NextResponse.json(
        { success: false, error: 'El email de respuesta no tiene un formato válido' },
        { status: 400 }
      );
    }

    // Guardar configuración en memoria (en producción, usar base de datos)
    smtpConfig = {
      host: config.host,
      port: parseInt(config.port),
      secure: Boolean(config.secure),
      user: config.user,
      password: config.password,
      from: config.from,
      replyTo: config.replyTo || ''
    };

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    });

  } catch (error) {
    console.error('Error saving email configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función helper para obtener la configuración actual
export function getCurrentSMTPConfig() {
  const defaultConfig = {
    host: process.env['SMTP_HOST'] || '',
    port: parseInt(process.env['SMTP_PORT'] || '587'),
    secure: process.env['SMTP_SECURE'] === 'true',
    user: process.env['SMTP_USER'] || '',
    password: process.env['SMTP_PASSWORD'] || '',
    from: process.env['SMTP_FROM'] || '',
    replyTo: process.env['SMTP_REPLY_TO'] || ''
  };

  return smtpConfig || defaultConfig;
}