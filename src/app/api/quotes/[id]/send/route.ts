import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { emailService } from '@/lib/email/email-service';
import {
  renderEmailTemplate,
  EmailTemplateType,
  QuoteEmailData,
} from '@/lib/email/email-templates';
import { NotificationService } from '@/lib/notifications/notification-service';
import { randomBytes } from 'crypto';

const SendQuoteSchema = z.object({
  template: z.enum(['basic', 'professional', 'custom']).default('professional'),
  customSubject: z.string().optional(),
  customMessage: z.string().optional(),
  ccEmails: z.array(z.string().email()).optional().default([]),
  bccEmails: z.array(z.string().email()).optional().default([]),
  attachPDF: z.boolean().optional().default(true),
  sendCopy: z.boolean().optional().default(false),
  trackOpening: z.boolean().optional().default(true),
});

// Función para generar token de seguimiento
function generateTrackingToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * POST /api/quotes/[id]/send - Enviar cotización por email
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quoteId = params.id;
    const body = await request.json();
    const validatedData = SendQuoteSchema.parse(body);

    // Verificar que la cotización existe y obtener datos completos
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            venue: { select: { name: true } },
            room: { select: { name: true } },
          },
        },
        packages: {
          include: {
            packageItems: {
              select: {
                id: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                description: true,
                product: { select: { name: true, description: true, unit: true } },
                service: { select: { name: true, description: true, unit: true } },
              },
            },
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Generar token de seguimiento si está habilitado
    let trackingToken: string | null = null;
    if (validatedData.trackOpening) {
      trackingToken = generateTrackingToken();
    }

    // Construir URL de seguimiento
    const baseUrl = process.env['NEXTAUTH_URL'] || request.nextUrl.origin;
    const trackingUrl = trackingToken
      ? `${baseUrl}/api/quotes/${quoteId}/track/${trackingToken}`
      : `${baseUrl}/dashboard/quotes/${quoteId}`;

    // Preparar datos para la plantilla de email
    const companyInfo = {
      name: process.env['COMPANY_NAME'] || 'Gestión de Eventos',
      email: process.env['COMPANY_EMAIL'] || 'info@gestiondeeventos.com',
      phone: process.env['COMPANY_PHONE'] || '',
      website: process.env['COMPANY_WEBSITE'] || '',
      address: process.env['COMPANY_ADDRESS'] || '',
    };

    const emailData: QuoteEmailData = {
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        title: quote.event?.title || 'Cotización sin evento asociado',
        ...(quote.notes && { description: quote.notes }),
        total: Number(quote.total),
        validUntil: quote.validUntil.toISOString(),
        createdAt: quote.createdAt.toISOString(),
      },
      client: {
        name: quote.client.name,
        email: quote.client.email,
        ...(quote.client.phone && { phone: quote.client.phone }),
      },
      event: quote.event
        ? {
            title: quote.event.title,
            startDate: quote.event.startDate.toISOString(),
            endDate: quote.event.endDate.toISOString(),
            ...(quote.event.venue && {
              location: `${quote.event.venue.name}${quote.event.room ? ` - ${quote.event.room.name}` : ''}`,
            }),
          }
        : {
            title: 'Evento por definir',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
          },
      packages: quote.packages.map(pkg => ({
        name: pkg.name,
        ...(pkg.description && { description: pkg.description }),
        subtotal: Number(pkg.subtotal),
        items: pkg.packageItems?.map(item => ({
          name: item.product?.name || item.service?.name || 'Ítem',
          ...(item.description && { description: item.description }),
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      })),
      company: companyInfo,
      tracking: {
        token: trackingToken || '',
        trackingUrl: trackingUrl || '',
      },
    };

    // Generar HTML del email usando la plantilla seleccionada
    const emailHtml = renderEmailTemplate(validatedData.template as EmailTemplateType, emailData);

    // Generar subject personalizado o usar el por defecto
    const defaultSubject = `Cotización ${quote.quoteNumber} - ${quote.event?.title || 'Su evento'}`;
    const emailSubject = validatedData.customSubject || defaultSubject;

    // Preparar adjuntos si se solicita PDF
    const attachments = [];
    if (validatedData.attachPDF) {
      try {
        // Generar PDF de la cotización
        const pdfResponse = await fetch(`${baseUrl}/api/quotes/${quoteId}/pdf`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          attachments.push({
            filename: `cotizacion-${quote.quoteNumber}.pdf`,
            content: Buffer.from(pdfBuffer),
            contentType: 'application/pdf',
          });
        }
      } catch (error) {
        console.error('Error generando PDF para adjunto:', error);
        // Continuar sin adjunto PDF si hay error
      }
    }

    // Preparar lista de destinatarios
    const recipients = [quote.client.email];
    const ccList = validatedData.ccEmails || [];
    const bccList = validatedData.bccEmails || [];

    // Añadir copia para el remitente si se solicita
    if (validatedData.sendCopy) {
      bccList.push(companyInfo.email);
    }

    // Preparar texto plano como fallback
    const plainText = `
Estimado/a ${quote.client.name},

Le enviamos la cotización ${quote.quoteNumber} para su evento ${quote.event?.title || 'su evento'}.

Detalles de la cotización:
- Número: ${quote.quoteNumber}
- Total: $${Number(quote.total).toLocaleString()}
- Válida hasta: ${new Date(quote.validUntil).toLocaleDateString()}

Para ver la cotización completa, visite: ${trackingUrl}

${validatedData.customMessage || 'Esperamos poder ser parte de su evento especial.'}

Saludos cordiales,
Equipo de ${companyInfo.name}
${companyInfo.email}
${companyInfo.phone}
    `.trim();

    // Enviar email
    const emailResult = await emailService.sendEmail({
      to: recipients,
      ...(ccList.length > 0 && { cc: ccList }),
      ...(bccList.length > 0 && { bcc: bccList }),
      subject: emailSubject,
      text: plainText,
      html: emailHtml,
      ...(attachments.length > 0 && { attachments }),
      replyTo: companyInfo.email,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error enviando email',
          details: emailResult.error,
        },
        { status: 500 }
      );
    }

    // Actualizar estado de la cotización y registrar envío
    await prisma.$transaction(async tx => {
      // Actualizar estado de cotización a SENT_TO_CLIENT
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: 'SENT_TO_CLIENT',
        },
      });

      // Registrar el envío en el log
      await tx.emailLog.create({
        data: {
          quoteId: quoteId,
          recipientEmail: quote.client.email,
          subject: emailSubject,
          template: validatedData.template,
          status: 'sent',
          messageId: emailResult.messageId || null,
          trackingToken: trackingToken,
          sentAt: new Date(),
          metadata: {
            attachPDF: validatedData.attachPDF,
            ccEmails: ccList,
            bccEmails: bccList,
            customMessage: validatedData.customMessage,
          },
        },
      });
    });

    // Enviar notificaciones después del envío exitoso
    try {
      await NotificationService.notifyQuoteSent(quoteId);
    } catch (notificationError) {
      console.error('Error enviando notificaciones:', notificationError);
      // No fallar la respuesta por error en notificaciones
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        messageId: emailResult.messageId,
        trackingToken: trackingToken,
        sentTo: recipients,
        cc: ccList,
        bcc: bccList,
        template: validatedData.template,
        attachedPDF: validatedData.attachPDF,
        trackingUrl: trackingUrl,
      },
      message: 'Cotización enviada exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error enviando cotización:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quotes/[id]/send - Obtener información de envío de cotización
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quoteId = params.id;

    // Obtener cotización con información básica
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Obtener histórico de envíos de email
    const emailLogs = await prisma.emailLog.findMany({
      where: { quoteId: quoteId },
      orderBy: { sentAt: 'desc' },
      take: 10,
      select: {
        id: true,
        recipientEmail: true,
        subject: true,
        template: true,
        status: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
        metadata: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        quote: {
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          status: quote.status,
          client: quote.client,
        },
        emailHistory: emailLogs,
        wasSent: emailLogs.length > 0,
        lastSent: emailLogs[0]?.sentAt || null,
        totalSends: emailLogs.length,
        hasTracking: emailLogs.some(log => log.openedAt !== null),
      },
    });
  } catch (error) {
    console.error('Error obteniendo información de envío:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo información de envío',
      },
      { status: 500 }
    );
  }
}
