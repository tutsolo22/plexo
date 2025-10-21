import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/emails/config - Obtener configuración de email del tenant actual
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // Obtener configuración específica del tenant
    const config = await prisma.tenantEmailConfig.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
      },
    });

    if (!config) {
      // Si no hay configuración específica, devolver configuración por defecto
      return NextResponse.json({
        success: true,
        config: {
          smtpHost: '',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: '',
          smtpPassword: '',
          fromEmail: '',
          fromName: '',
          replyToEmail: '',
          provider: 'smtp',
          isActive: false,
        },
        message: 'No hay configuración específica para este tenant',
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        smtpHost: config.smtpHost || '',
        smtpPort: config.smtpPort,
        smtpSecure: config.smtpSecure,
        smtpUser: config.smtpUser || '',
        smtpPassword: config.smtpPassword ? '********' : '', // Ocultar contraseña
        fromEmail: config.fromEmail || '',
        fromName: config.fromName || '',
        replyToEmail: config.replyToEmail || '',
        provider: config.provider || 'smtp',
        isActive: config.isActive,
      },
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

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const config = await request.json();

    // Validar campos requeridos
    if (
      !config.smtpHost ||
      !config.smtpPort ||
      !config.smtpUser ||
      !config.smtpPassword ||
      !config.fromEmail
    ) {
      return NextResponse.json(
        { success: false, error: 'Los campos marcados con * son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.fromEmail)) {
      return NextResponse.json(
        { success: false, error: 'El email remitente no tiene un formato válido' },
        { status: 400 }
      );
    }

    if (config.replyToEmail && !emailRegex.test(config.replyToEmail)) {
      return NextResponse.json(
        { success: false, error: 'El email de respuesta no tiene un formato válido' },
        { status: 400 }
      );
    }

    // Guardar o actualizar configuración en la base de datos
    const existingConfig = await prisma.tenantEmailConfig.findFirst({
      where: {
        tenantId: session.user.tenantId,
      },
    });

    if (existingConfig) {
      // Actualizar configuración existente
      await prisma.tenantEmailConfig.update({
        where: { id: existingConfig.id },
        data: {
          smtpHost: config.smtpHost,
          smtpPort: parseInt(config.smtpPort),
          smtpSecure: Boolean(config.smtpSecure),
          smtpUser: config.smtpUser,
          smtpPassword: config.smtpPassword,
          fromEmail: config.fromEmail,
          fromName: config.fromName || null,
          replyToEmail: config.replyToEmail || null,
          provider: config.provider || 'smtp',
          isActive: true,
        },
      });
    } else {
      // Crear nueva configuración
      await prisma.tenantEmailConfig.create({
        data: {
          tenantId: session.user.tenantId,
          smtpHost: config.smtpHost,
          smtpPort: parseInt(config.smtpPort),
          smtpSecure: Boolean(config.smtpSecure),
          smtpUser: config.smtpUser,
          smtpPassword: config.smtpPassword,
          fromEmail: config.fromEmail,
          fromName: config.fromName || null,
          replyToEmail: config.replyToEmail || null,
          provider: config.provider || 'smtp',
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
    });
  } catch (error) {
    console.error('Error saving email configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función helper para obtener la configuración actual de un tenant
export async function getTenantSMTPConfig(tenantId: string) {
  try {
    const config = await prisma.tenantEmailConfig.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
    });

    if (config) {
      return {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpSecure: config.smtpSecure,
        smtpUser: config.smtpUser,
        smtpPassword: config.smtpPassword,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        replyToEmail: config.replyToEmail,
        provider: config.provider,
      };
    }
  } catch (error) {
    console.error('Error loading tenant SMTP config:', error);
  }

  // Fallback a configuración por defecto
  return {
    smtpHost: process.env['SMTP_HOST'] || '',
    smtpPort: parseInt(process.env['SMTP_PORT'] || '587'),
    smtpSecure: process.env['SMTP_SECURE'] === 'true',
    smtpUser: process.env['SMTP_USER'] || '',
    smtpPassword: process.env['SMTP_PASSWORD'] || '',
    fromEmail: process.env['SMTP_FROM'] || '',
    fromName: process.env['SMTP_FROM_NAME'] || '',
    replyToEmail: process.env['SMTP_REPLY_TO'] || '',
    provider: process.env['EMAIL_SERVICE'] || 'smtp',
  };
}
