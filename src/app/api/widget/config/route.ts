import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const apiKey = headersList.get('x-api-key') || request.nextUrl.searchParams.get('api_key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 401 }
      );
    }

    // Buscar la API key y obtener el tenant
    const widgetApiKey = await prisma.widgetApiKey.findFirst({
      where: {
        apiKey: apiKey,
        isActive: true,
      },
      include: {
        tenant: {
          include: {
            widgetConfigs: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!widgetApiKey) {
      return NextResponse.json(
        { error: 'API key inválida o inactiva' },
        { status: 401 }
      );
    }

    // Obtener configuración del widget
    const widgetConfig = widgetApiKey.tenant.widgetConfigs[0];

    if (!widgetConfig) {
      return NextResponse.json(
        { error: 'Configuración del widget no encontrada' },
        { status: 404 }
      );
    }

    // Obtener información del negocio
    const businessIdentity = await prisma.businessIdentity.findFirst({
      where: {
        tenantId: widgetApiKey.tenantId,
        isActive: true,
      },
    });

    // Actualizar estadísticas de uso
    await prisma.widgetApiKey.update({
      where: { id: widgetApiKey.id },
      data: {
        totalRequests: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Preparar respuesta
    const config = {
      widget: {
        logoUrl: widgetConfig.logoUrl,
        primaryColor: widgetConfig.primaryColor,
        secondaryColor: widgetConfig.secondaryColor,
        position: widgetConfig.position,
        welcomeMessage: widgetConfig.welcomeMessage,
        offlineMessage: widgetConfig.offlineMessage,
        businessHours: widgetConfig.businessHours,
        showTypingIndicator: widgetConfig.showTypingIndicator,
        allowFileUpload: widgetConfig.allowFileUpload,
        maxFileSize: widgetConfig.maxFileSize,
        autoOpenDelay: widgetConfig.autoOpenDelay,
      },
      business: {
        name: widgetConfig.businessName || businessIdentity?.name,
        description: widgetConfig.businessDescription || businessIdentity?.slogan,
        phone: widgetConfig.contactPhone || businessIdentity?.phone,
        email: widgetConfig.contactEmail || businessIdentity?.email,
        website: businessIdentity?.website,
        address: businessIdentity?.address,
      },
      settings: {
        tenantId: widgetApiKey.tenantId,
        rateLimit: widgetApiKey.rateLimit,
        allowedOrigins: widgetApiKey.allowedOrigins,
      },
    };

    return NextResponse.json(config);

  } catch (error) {
    console.error('Error en widget config:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
