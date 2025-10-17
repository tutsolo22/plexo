import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/emails/track/[token] - Tracking de apertura de emails
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const trackingToken = params.token;

    if (!trackingToken) {
      return new Response('Invalid tracking token', { status: 400 });
    }

    // Buscar el email log con el token
    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingToken }
    });

    if (!emailLog) {
      return new Response('Tracking token not found', { status: 404 });
    }

    // Solo registrar la primera apertura
    if (!emailLog.openedAt) {
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'opened',
          openedAt: new Date()
        }
      });
    }

    // Devolver un pixel transparente de 1x1
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new Response(pixel, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error tracking email:', error);
    
    // Devolver pixel transparente incluso en error para no romper el email
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new Response(pixel, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length.toString()
      }
    });
  }
}