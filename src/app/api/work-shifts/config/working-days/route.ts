import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

/**
 * Schema de validación para días laborables
 */
const workingDaysSchema = z.object({
  monday: z.boolean().default(true),
  tuesday: z.boolean().default(true),
  wednesday: z.boolean().default(true),
  thursday: z.boolean().default(true),
  friday: z.boolean().default(true),
  saturday: z.boolean().default(true),
  sunday: z.boolean().default(false),
});

const CONFIG_KEY = 'working_days';

/**
 * GET /api/work-shifts/config/working-days
 * Obtiene la configuración de días laborables
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    const config = await prisma.configuration.findUnique({
      where: {
        tenantId_key: {
          tenantId: session.user.tenantId,
          key: CONFIG_KEY,
        },
      },
    });

    // Si no existe configuración, retornar valores por defecto
    if (!config) {
      const defaultWorkingDays = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false,
      };
      return ApiResponses.success(defaultWorkingDays);
    }

    const workingDays = JSON.parse(config.value);
    return ApiResponses.success(workingDays);
  } catch (error) {
    console.error('Error al obtener días laborables:', error);
    return ApiResponses.internalError('Error al obtener la configuración de días laborables');
  }
}

/**
 * PUT /api/work-shifts/config/working-days
 * Actualiza la configuración de días laborables
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden actualizar la configuración
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para actualizar la configuración de días laborables');
    }

    const body = await request.json();
    const validatedData = workingDaysSchema.parse(body);

    // Validar que al menos un día esté activo
    const hasAtLeastOneDay = Object.values(validatedData).some(day => day === true);
    
    if (!hasAtLeastOneDay) {
      return ApiResponses.badRequest('Debe haber al menos un día laboral activo');
    }

    // Guardar o actualizar configuración
    const config = await prisma.configuration.upsert({
      where: {
        tenantId_key: {
          tenantId: session.user.tenantId,
          key: CONFIG_KEY,
        },
      },
      create: {
        tenantId: session.user.tenantId,
        key: CONFIG_KEY,
        value: JSON.stringify(validatedData),
      },
      update: {
        value: JSON.stringify(validatedData),
      },
    });

    const workingDays = JSON.parse(config.value);
    return ApiResponses.success(workingDays, 'Configuración de días laborables actualizada exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    
    console.error('Error al actualizar días laborables:', error);
    return ApiResponses.internalError('Error al actualizar la configuración de días laborables');
  }
}
