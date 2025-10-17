import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

// GET /api/clients/[id]/quotes - Obtener cotizaciones de un cliente
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = params.id;

    // Verificar que el cliente existe y pertenece al tenant
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: session.user.tenantId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Verificar permisos según rol
    const userRoleType = session.user.role.roleId as $Enums.RoleType;
    if (userRoleType === $Enums.RoleType.CLIENT_EXTERNAL) {
      if (client.userId !== session.user.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }

    const quotes = await prisma.quote.findMany({
      where: {
        clientId: clientId,
      },
      select: {
        id: true,
        quoteNumber: true,
        status: true,
        subtotal: true,
        totalAmount: true,
        validUntil: true,
        createdAt: true,
        updatedAt: true,
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        _count: {
          select: {
            quoteItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mapear las cotizaciones al formato esperado por el frontend
    const mappedQuotes = quotes.map(quote => ({
      id: quote.id,
      name: `Cotización ${quote.quoteNumber}`,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      subtotal: Number(quote.subtotal),
      totalAmount: Number(quote.totalAmount),
      validUntil: quote.validUntil?.toISOString() || null,
      event: quote.event
        ? {
            id: quote.event.id,
            title: quote.event.title,
            startDate: quote.event.startDate.toISOString(),
            endDate: quote.event.endDate.toISOString(),
            status: quote.event.status,
          }
        : null,
      itemsCount: quote._count.quoteItems,
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: mappedQuotes,
    });
  } catch (error) {
    console.error('Error al obtener cotizaciones del cliente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
