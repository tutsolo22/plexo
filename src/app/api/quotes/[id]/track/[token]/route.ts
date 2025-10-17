import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/quotes/[id]/track/[token] - Tracking de apertura de email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; token: string } }
) {
  try {
    const { id: quoteId, token } = params;

    // Buscar el log de email con el token
    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingToken: token },
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true
          }
        }
      }
    });

    if (!emailLog || emailLog.quoteId !== quoteId) {
      // Retornar imagen transparente 1x1 píxel
      const transparentPixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );

      return new NextResponse(transparentPixel, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Actualizar el registro de apertura si es la primera vez
    if (!emailLog.openedAt) {
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          openedAt: new Date(),
          status: 'opened'
        }
      });

      console.log(`Email abierto - Quote: ${emailLog.quote.quoteNumber}, Token: ${token}`);
    }

    // Retornar imagen transparente 1x1 píxel
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(transparentPixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error en tracking de email:', error);
    
    // Retornar imagen transparente incluso en caso de error
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(transparentPixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}