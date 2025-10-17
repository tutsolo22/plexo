import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailService } from '@/lib/email/email-service';
import { renderEmailTemplate } from '@/lib/email/email-templates';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { to, subject, template, config } = await request.json();

    // Validar datos requeridos
    if (!to || !subject || !template) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Validar configuración SMTP
    if (!config?.host || !config?.user || !config?.password) {
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

    // Datos de prueba para la plantilla
    const templateData = {
      clientName: 'Usuario de Prueba',
      quoteNumber: 'TEST-001',
      total: 1500.00,
      eventTitle: 'Evento de Prueba',
      eventDate: new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      eventTime: '18:00',
      eventLocation: 'Salón de Eventos Gestión',
      items: [
        { name: 'Decoración básica', quantity: 1, price: 500.00 },
        { name: 'Catering para 50 personas', quantity: 50, price: 20.00 },
      ],
      companyName: 'Gestión de Eventos',
      companyEmail: config.from,
      companyPhone: '+1234567890',
      message: 'Este es un email de prueba para verificar la configuración SMTP.',
      trackingUrl: '' // No tracking para emails de prueba
    };

    // Compilar plantilla
    const htmlContent = renderEmailTemplate(template, templateData);

    // Crear instancia temporal del servicio con configuración personalizada
    const testEmailService = emailService;

    // Intentar enviar el email
    const result = await testEmailService.sendEmail({
      to,
      subject,
      html: htmlContent,
      from: config.from
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email de prueba enviado exitosamente',
        messageId: result.messageId
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}