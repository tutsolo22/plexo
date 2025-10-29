import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { renderEmailTemplate } from '@/lib/email/email-templates';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { to, subject, template, config } = await request.json();

    // Validar datos requeridos
    if (!to || !subject || !template) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Normalizar distintos shapes de config que puede enviar el cliente
    // (legacy: { host, user, password, from } || new: { smtpHost, smtpUser, smtpPassword, fromEmail })
    const normalizedConfig = {
      host: config?.host || config?.smtpHost || '',
      port: config?.port || config?.smtpPort || undefined,
      secure: config?.secure || config?.smtpSecure || undefined,
      user: config?.user || config?.smtpUser || '',
      password: config?.password || config?.smtpPassword || '',
      from: config?.from || config?.fromEmail || '',
    };

    // Validar configuración SMTP mínima
    if (!normalizedConfig.host || !normalizedConfig.user || !normalizedConfig.password || !normalizedConfig.from) {
      return NextResponse.json(
        { success: false, error: 'Configuración SMTP incompleta' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Email de destino no válido' },
        { status: 400 }
      );
    }

    // Construir datos con la forma esperada por renderEmailTemplate (QuoteEmailData)
    const nowIso = new Date().toISOString();
    const in30DaysIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const templateData = {
      quote: {
        id: 'test-quote',
        quoteNumber: 'TEST-001',
        title: 'Cotización de Prueba',
        description: 'Cotización generada para verificar SMTP',
        total: 1500.0,
        validUntil: in30DaysIso,
        createdAt: nowIso,
      },
      client: {
        name: 'Usuario de Prueba',
        email: to,
      },
      event: {
        title: 'Evento de Prueba',
        startDate: nowIso,
        endDate: in30DaysIso,
        location: 'Salón de Eventos Gestión',
      },
      packages: [
        {
          name: 'Decoración básica',
          description: 'Decoración sencilla',
          subtotal: 500.0,
          items: [
            { name: 'Decoración básica', description: '', quantity: 1, unitPrice: 500.0, totalPrice: 500.0 }
          ]
        }
      ],
      company: {
        name: 'Gestión de Eventos',
        email: normalizedConfig.from,
        phone: '+1234567890'
      },
      tracking: {
        token: 'test-token',
        trackingUrl: ''
      }
    } as any;

    // Compilar plantilla
    const htmlContent = renderEmailTemplate(template as any, templateData as any);

    // Crear un transportador temporal con la configuración proporcionada para probar credenciales
    const smtpOptions: any = {
      host: normalizedConfig.host,
      port: normalizedConfig.port ? Number(normalizedConfig.port) : 587,
      secure: normalizedConfig.secure === true, // true para 465
    };
    if (normalizedConfig.user && normalizedConfig.password) {
      smtpOptions.auth = { user: normalizedConfig.user, pass: normalizedConfig.password };
    }

    const tempTransporter = nodemailer.createTransport(smtpOptions);

    // Intentar enviar usando el transportador temporal
    const info = await tempTransporter.sendMail({
      from: normalizedConfig.from,
      to,
      subject,
      html: htmlContent,
    });

    const result = { success: true, messageId: info.messageId };

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email de prueba enviado exitosamente',
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
