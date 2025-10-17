import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/email-service';

/**
 * POST /api/emails/[id]/resend - Reenviar un email fallido
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emailId = params.id;

    // Buscar el email original
    const originalEmail = await prisma.emailLog.findUnique({
      where: { id: emailId },
      include: {
        quote: {
          include: {
            client: true,
            packages: {
              include: {
                items: true
              }
            },
            adjustments: true
          }
        }
      }
    });

    if (!originalEmail) {
      return NextResponse.json(
        { success: false, error: 'Email no encontrado' },
        { status: 404 }
      );
    }

    if (originalEmail.status !== 'FAILED') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden reenviar emails fallidos' },
        { status: 400 }
      );
    }

    // Generar nuevo token de tracking
    const newTrackingToken = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Intentar reenviar el email
      await sendEmail({
        to: originalEmail.toEmail,
        subject: originalEmail.subject,
        template: originalEmail.template as 'basic' | 'professional' | 'custom',
        data: {
          quote: originalEmail.quote,
          client: originalEmail.quote.client,
          trackingToken: newTrackingToken
        }
      });

      // Actualizar el email original
      const updatedEmail = await prisma.emailLog.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          trackingToken: newTrackingToken,
          sentAt: new Date(),
          failureReason: null
        },
        include: {
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              title: true,
              client: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: updatedEmail,
        message: 'Email reenviado exitosamente'
      });

    } catch (emailError) {
      // Actualizar el log con el nuevo error
      await prisma.emailLog.update({
        where: { id: emailId },
        data: {
          failureReason: emailError instanceof Error ? emailError.message : 'Error desconocido al reenviar'
        }
      });

      throw emailError;
    }

  } catch (error) {
    console.error('Error reenviando email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error reenviando email',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}