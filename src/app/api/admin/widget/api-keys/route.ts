import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// GET /api/admin/widget/api-keys - Listar todas las claves API
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const apiKeys = await prisma.widgetApiKey.findMany({
      where: {
        tenantId: session.user.tenantId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/admin/widget/api-keys - Crear nueva clave API
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, rateLimit = 100 } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    // Generar clave API única
    const apiKey = `widget_${randomBytes(32).toString('hex')}`;

    const newApiKey = await prisma.widgetApiKey.create({
      data: {
        tenantId: session.user.tenantId,
        apiKey: apiKey,
        name,
        rateLimit,
        isActive: true
      }
    });

    return NextResponse.json(newApiKey, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}