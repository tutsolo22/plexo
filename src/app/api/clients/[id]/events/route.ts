import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

// GET /api/clients/[id]/events - Obtener eventos de un cliente
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
    const userRoleType = session.user.role as $Enums.RoleType;
    const whereClause: any = {
      clientId: clientId,
    };

    // Solo CLIENT_EXTERNAL puede ver sus propios eventos
    if (userRoleType === $Enums.RoleType.CLIENT_EXTERNAL) {
      if (client.userId !== session.user.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            venue: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        quote: {
          select: {
            id: true,
            subtotal: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Mapear los eventos al formato esperado por el frontend
    const mappedEvents = events.map(event => ({
      id: event.id,
      name: event.title,
      date: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      status: event.status,
      totalAmount: event.quote?.total ? Number(event.quote.total) : null,
      venue: event.venue || event.room?.venue || null,
      room: event.room,
      quote: event.quote
        ? {
            id: event.quote.id,
            subtotal: Number(event.quote.subtotal),
            totalAmount: Number(event.quote.total),
            status: event.quote.status,
          }
        : null,
      notes: event.notes,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: mappedEvents,
    });
  } catch (error) {
    console.error('Error al obtener eventos del cliente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
