import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';

/**
 * GET /api/onboarding
 * Obtiene el estado del onboarding del tenant actual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    if (!session.user.tenantId) {
      return ApiResponses.forbidden('No tienes un tenant asignado');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        onboardingCompleted: true,
        onboardingStep: true,
      },
    });

    if (!tenant) {
      return ApiResponses.notFound('Tenant no encontrado');
    }

    // Verificar progreso de cada paso
    const [
      businessIdentity,
      locationsCount,
      roomsCount,
      workShiftsCount,
      priceListsCount,
    ] = await Promise.all([
      prisma.businessIdentity.findFirst({
        where: { tenantId: session.user.tenantId },
      }),
      prisma.location.count({
        where: {
          businessIdentity: {
            tenantId: session.user.tenantId,
          },
        },
      }),
      prisma.room.count({
        where: {
          location: {
            businessIdentity: {
              tenantId: session.user.tenantId,
            },
          },
        },
      }),
      prisma.workShift.count({
        where: { tenantId: session.user.tenantId },
      }),
      prisma.priceList.count({
        where: { tenantId: session.user.tenantId },
      }),
    ]);

    const steps = [
      {
        id: 1,
        title: 'Configuración de Negocio',
        description: 'Configura el nombre, logo y datos de contacto de tu negocio',
        completed: !!businessIdentity && !!businessIdentity.name && !!businessIdentity.phone,
        required: true,
        href: '/dashboard/settings/branding',
      },
      {
        id: 2,
        title: 'Ubicaciones y Salas',
        description: 'Agrega las ubicaciones de tu negocio y las salas disponibles',
        completed: locationsCount > 0 && roomsCount > 0,
        required: true,
        href: '/dashboard/settings/locations',
      },
      {
        id: 3,
        title: 'Turnos Laborales',
        description: 'Define los horarios de trabajo y días laborables',
        completed: workShiftsCount > 0,
        required: true,
        href: '/dashboard/settings/work-shifts',
      },
      {
        id: 4,
        title: 'Listas de Precios',
        description: 'Configura los precios para tus salas y servicios',
        completed: priceListsCount > 0,
        required: true,
        href: '/dashboard/settings/price-lists',
      },
      {
        id: 5,
        title: 'Integraciones (Opcional)',
        description: 'Conecta WhatsApp Business y MercadoPago',
        completed: false, // Opcional
        required: false,
        href: '/dashboard/settings/integrations',
      },
    ];

    const completedSteps = steps.filter(s => s.completed).length;
    const requiredSteps = steps.filter(s => s.required).length;
    const requiredCompleted = steps.filter(s => s.required && s.completed).length;
    const progress = Math.round((completedSteps / steps.length) * 100);
    const isComplete = requiredCompleted === requiredSteps;

    return ApiResponses.success({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        onboardingCompleted: tenant.onboardingCompleted || isComplete,
        onboardingStep: tenant.onboardingStep,
      },
      steps,
      progress: {
        completed: completedSteps,
        total: steps.length,
        required: requiredSteps,
        requiredCompleted,
        percentage: progress,
        isComplete,
      },
    });
  } catch (error) {
    console.error('Error al obtener estado de onboarding:', error);
    return ApiResponses.internalError('Error al obtener el estado del onboarding');
  }
}

/**
 * PUT /api/onboarding
 * Actualiza el estado del onboarding
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    if (!session.user.tenantId) {
      return ApiResponses.forbidden('No tienes un tenant asignado');
    }

    // Solo TENANT_ADMIN y SUPER_ADMIN pueden actualizar
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para actualizar el onboarding');
    }

    const body = await request.json();
    const { completed, step } = body;

    const updateData: any = {};
    
    if (completed !== undefined) {
      updateData.onboardingCompleted = completed;
    }
    
    if (step !== undefined) {
      updateData.onboardingStep = step;
    }

    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        onboardingCompleted: true,
        onboardingStep: true,
      },
    });

    return ApiResponses.success(tenant, 'Estado de onboarding actualizado exitosamente');
  } catch (error) {
    console.error('Error al actualizar onboarding:', error);
    return ApiResponses.internalError('Error al actualizar el estado del onboarding');
  }
}
