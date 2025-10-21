import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/widget/api-keys/[id] - Obtener clave API específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const apiKey = await prisma.widgetApiKey.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      }
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'Clave API no encontrada' }, { status: 404 });
    }

    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/admin/widget/api-keys/[id] - Actualizar clave API
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, rateLimit, isActive } = body;

    const updatedApiKey = await prisma.widgetApiKey.updateMany({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      },
      data: {
        ...(name && { name }),
        ...(rateLimit && { rateLimit }),
        ...(isActive !== undefined && { isActive })
      }
    });

    if (updatedApiKey.count === 0) {
      return NextResponse.json({ error: 'Clave API no encontrada' }, { status: 404 });
    }

    // Obtener la clave actualizada
    const apiKey = await prisma.widgetApiKey.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      }
    });

    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/admin/widget/api-keys/[id] - Eliminar clave API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deletedApiKey = await prisma.widgetApiKey.deleteMany({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      }
    });

    if (deletedApiKey.count === 0) {
      return NextResponse.json({ error: 'Clave API no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Clave API eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}