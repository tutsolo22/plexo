import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Función para validar API key
async function validateApiKey(apiKey: string) {
  const widgetApiKey = await prisma.widgetApiKey.findFirst({
    where: {
      apiKey: apiKey,
      isActive: true,
    },
    include: {
      tenant: {
        include: {
          businessIdentities: {
            where: { isActive: true },
            take: 1,
          },
          products: {
            where: { isActive: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          services: {
            where: { isActive: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!widgetApiKey) {
    throw new Error('API key inválida');
  }

  return widgetApiKey;
}

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

    const widgetApiKey = await validateApiKey(apiKey);

    const businessIdentity = widgetApiKey.tenant.businessIdentities[0];

    // Obtener estadísticas básicas
    const [eventsCount, clientsCount, quotesCount] = await Promise.all([
      prisma.event.count({
        where: { tenantId: widgetApiKey.tenantId },
      }),
      prisma.client.count({
        where: { tenantId: widgetApiKey.tenantId },
      }),
      prisma.quote.count({
        where: { tenantId: widgetApiKey.tenantId },
      }),
    ]);

    // Obtener productos y servicios destacados
    const products = widgetApiKey.tenant.products.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      type: product.itemType,
    }));

    const services = widgetApiKey.tenant.services.map((service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      unit: service.unit,
    }));

    const businessInfo = {
      business: {
        name: businessIdentity?.name || widgetApiKey.tenant.name,
        description: businessIdentity?.slogan,
        address: businessIdentity?.address,
        phone: businessIdentity?.phone,
        email: businessIdentity?.email,
        website: businessIdentity?.website,
        logo: businessIdentity?.logo,
      },
      stats: {
        events: eventsCount,
        clients: clientsCount,
        quotes: quotesCount,
      },
      offerings: {
        products: products,
        services: services,
      },
      capabilities: [
        'Gestión de eventos corporativos',
        'Cotizaciones personalizadas',
        'Sistema de reservas online',
        'Reportes y analytics',
        'Integración WhatsApp',
        'Soporte multi-idioma',
      ],
      contact: {
        primary: {
          type: 'phone',
          value: businessIdentity?.phone || '+52 55 1234 5678',
          label: 'Teléfono principal',
        },
        secondary: {
          type: 'email',
          value: businessIdentity?.email || 'contacto@plexo.mx',
          label: 'Correo electrónico',
        },
      },
    };

    // Actualizar estadísticas de uso
    await prisma.widgetApiKey.update({
      where: { id: widgetApiKey.id },
      data: {
        totalRequests: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json(businessInfo);

  } catch (error) {
    console.error('Error obteniendo información del negocio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
