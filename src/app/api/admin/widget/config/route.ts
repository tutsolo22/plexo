import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/widget/config - Obtener configuración del widget
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let config = await prisma.widgetConfig.findFirst({
      where: {
        tenantId: session.user.tenantId
      }
    });

    // Si no existe configuración, crear una por defecto
    if (!config) {
      config = await prisma.widgetConfig.create({
        data: {
          tenantId: session.user.tenantId,
          businessName: 'Mi Negocio',
          primaryColor: '#3B82F6',
          secondaryColor: '#F3F4F6',
          welcomeMessage: '¡Hola! Soy el asistente de tu negocio. ¿En qué puedo ayudarte hoy?',
          isActive: true
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching widget config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/admin/widget/config - Actualizar configuración del widget
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      logoUrl,
      primaryColor,
      secondaryColor,
      welcomeMessage,
      isActive
    } = body;

    // Buscar configuración existente para este tenant
    const existingConfig = await prisma.widgetConfig.findFirst({
      where: {
        tenantId: session.user.tenantId
      }
    });

    const updatedConfig = existingConfig
      ? await prisma.widgetConfig.update({
          where: {
            id: existingConfig.id
          },
          data: {
            ...(businessName && { businessName }),
            ...(logoUrl !== undefined && { logoUrl }),
            ...(primaryColor && { primaryColor }),
            ...(secondaryColor && { secondaryColor }),
            ...(welcomeMessage && { welcomeMessage }),
            ...(isActive !== undefined && { isActive })
          }
        })
      : await prisma.widgetConfig.create({
          data: {
            tenantId: session.user.tenantId,
            businessName: businessName || 'Mi Negocio',
            logoUrl,
            primaryColor: primaryColor || '#3B82F6',
            secondaryColor: secondaryColor || '#F3F4F6',
            welcomeMessage: welcomeMessage || '¡Hola! Soy el asistente de tu negocio. ¿En qué puedo ayudarte hoy?',
            isActive: isActive ?? true
          }
        });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating widget config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}