import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

/**
 * Schema de validación para crear turno laboral
 */
const createWorkShiftSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/work-shifts
 * Obtiene todos los turnos laborales del tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    // Construir filtros
    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const workShifts = await prisma.workShift.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            roomPricing: true,
          },
        },
      },
    });

    // Formatear las horas para que solo muestren HH:MM
    const formattedShifts = workShifts.map(shift => ({
      ...shift,
      startTime: new Date(shift.startTime).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      endTime: new Date(shift.endTime).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      roomsCount: shift._count.roomPricing,
    }));

    return ApiResponses.success(formattedShifts);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return ApiResponses.internalError('Error al obtener los turnos laborales');
  }
}

/**
 * POST /api/work-shifts
 * Crea un nuevo turno laboral
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return ApiResponses.unauthorized();
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden crear turnos
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role)) {
      return ApiResponses.forbidden('No tienes permisos para crear turnos laborales');
    }

    const body = await request.json();
    const validatedData = createWorkShiftSchema.parse(body);

    // Validar que el turno no se solape con otros turnos activos
    const overlappingShift = await prisma.workShift.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
        OR: [
          // El nuevo turno comienza durante un turno existente
          {
            AND: [
              { startTime: { lte: new Date(`1970-01-01T${validatedData.startTime}:00`) } },
              { endTime: { gt: new Date(`1970-01-01T${validatedData.startTime}:00`) } },
            ],
          },
          // El nuevo turno termina durante un turno existente
          {
            AND: [
              { startTime: { lt: new Date(`1970-01-01T${validatedData.endTime}:00`) } },
              { endTime: { gte: new Date(`1970-01-01T${validatedData.endTime}:00`) } },
            ],
          },
          // El nuevo turno abarca completamente un turno existente
          {
            AND: [
              { startTime: { gte: new Date(`1970-01-01T${validatedData.startTime}:00`) } },
              { endTime: { lte: new Date(`1970-01-01T${validatedData.endTime}:00`) } },
            ],
          },
        ],
      },
    });

    if (overlappingShift) {
      return ApiResponses.badRequest(
        `Este horario se solapa con el turno "${overlappingShift.name}" (${new Date(overlappingShift.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(overlappingShift.endTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })})`
      );
    }

    // Crear el turno con fechas base (1970-01-01) para almacenar solo la hora
    const workShift = await prisma.workShift.create({
      data: {
        name: validatedData.name,
        startTime: new Date(`1970-01-01T${validatedData.startTime}:00`),
        endTime: new Date(`1970-01-01T${validatedData.endTime}:00`),
        description: validatedData.description,
        isActive: validatedData.isActive,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        description: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Formatear respuesta
    const formattedShift = {
      ...workShift,
      startTime: new Date(workShift.startTime).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      endTime: new Date(workShift.endTime).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
    };

    return ApiResponses.created(formattedShift, 'Turno laboral creado exitosamente');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    
    console.error('Error al crear turno:', error);
    return ApiResponses.internalError('Error al crear el turno laboral');
  }
}
