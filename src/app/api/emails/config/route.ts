import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/emails/config - Obtener configuración de email del tenant actual
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // Obtener tenantId de query si viene (p. ej. ?tenantId=...)
    const qTenantId = request.nextUrl.searchParams.get('tenantId') || undefined;

    // Determinar tenantId objetivo: usar tenant de la sesión si existe.
    // Si el actor es SUPER_ADMIN puede pasar ?tenantId= para operar sobre un tenant específico.
    // Si no existe tenantId en sesión y no se pasó query, and the actor is SUPER_ADMIN, usaremos targetTenantId = null (configuración global).
    let targetTenantId: string | null | undefined = session.user.tenantId as string | undefined;
    if (!targetTenantId && session.user.role === 'SUPER_ADMIN') {
      targetTenantId = qTenantId ?? null; // puede ser null para indicar configuración global
    }

    // Obtener configuración específica del tenant
    const whereGet: Prisma.TenantEmailConfigWhereInput = { isActive: true };
    if (typeof targetTenantId !== 'undefined') {
      // cuando targetTenantId === null buscamos configuración global (tenantId IS NULL)
      whereGet.tenantId = targetTenantId as string | null;
    }

    const config = await prisma.tenantEmailConfig.findFirst({ where: whereGet });

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
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { success: false, error: String((error as Error).message), stack: (error as Error).stack },
        { status: 500 }
      );
    }
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

    // Normalizar puerto
    const smtpPort = Number(config.smtpPort) || 587;

    // Determinar tenant objetivo: usar tenant de la sesión si existe, o permitir que SUPER_ADMIN indique tenantId en el body.
    // Si el actor es SUPER_ADMIN y no se especifica tenantId, permitimos crear/actualizar la configuración global (tenantId == null).
    let targetTenantId: string | null | undefined = session.user.tenantId as string | undefined;
    if (!targetTenantId && session.user.role === 'SUPER_ADMIN') {
      // permitir que el body incluya tenantId cuando el actor es SUPER_ADMIN
      if (config.tenantId && typeof config.tenantId === 'string') {
        targetTenantId = config.tenantId;
      } else {
        // explícitamente permitimos targetTenantId = null para configuración global
        targetTenantId = null;
      }
    }

    // Guardar o actualizar configuración en la base de datos
    const whereFind: Prisma.TenantEmailConfigWhereInput = {};
    if (typeof targetTenantId !== 'undefined') {
      whereFind.tenantId = targetTenantId as string | null;
    }
    const existingConfig = await prisma.tenantEmailConfig.findFirst({ where: whereFind });

    if (existingConfig) {
      // Actualizar configuración existente
      await prisma.tenantEmailConfig.update({
        where: { id: existingConfig.id },
        data: {
          smtpHost: config.smtpHost,
          smtpPort: smtpPort,
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
      // Build data object and include tenantId only when defined (avoid undefined assignment)
      const createData: Prisma.TenantEmailConfigCreateInput = {
        smtpHost: config.smtpHost,
        smtpPort: smtpPort,
        smtpSecure: Boolean(config.smtpSecure),
        smtpUser: config.smtpUser,
        smtpPassword: config.smtpPassword,
        fromEmail: config.fromEmail,
        fromName: config.fromName || null,
        replyToEmail: config.replyToEmail || null,
        provider: config.provider || 'smtp',
        isActive: true,
      } as Prisma.TenantEmailConfigCreateInput;

      // tenantId is optional in the model now; set it only when explicitly provided (or null for global)
      if (typeof targetTenantId !== 'undefined') {
        // assign as string | null
        (createData as any).tenantId = targetTenantId as string | null;
      }

      await prisma.tenantEmailConfig.create({ data: createData });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
    });
  } catch (error) {
    console.error('Error saving email configuration:', error);
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { success: false, error: String((error as Error).message), stack: (error as Error).stack },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función helper para obtener la configuración actual de un tenant
export async function getTenantSMTPConfig(tenantId?: string | null) {
  try {
    // Primero intentar configuración específica del tenant (si se pasó tenantId)
    let config = null as any | null;
    if (tenantId) {
      config = await prisma.tenantEmailConfig.findFirst({
        where: {
          tenantId,
          isActive: true,
        },
      });
    }

    // Si no hay config específica, intentar configuración global (tenantId == null)
    if (!config) {
      config = await prisma.tenantEmailConfig.findFirst({
        where: {
          tenantId: null,
          isActive: true,
        },
      });
    }

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

  // Fallback a configuración por defecto (env)
  return {
    smtpHost: process.env['SMTP_HOST'] || '',
    smtpPort: Number(process.env['SMTP_PORT'] || '587'),
    smtpSecure: process.env['SMTP_SECURE'] === 'true',
    smtpUser: process.env['SMTP_USER'] || '',
    smtpPassword: process.env['SMTP_PASSWORD'] || '',
    fromEmail: process.env['SMTP_FROM'] || '',
    fromName: process.env['SMTP_FROM_NAME'] || '',
    replyToEmail: process.env['SMTP_REPLY_TO'] || '',
    provider: process.env['EMAIL_SERVICE'] || 'smtp',
  };
}
