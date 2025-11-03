import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClientSchema, clientFiltersSchema } from '@/lib/validations/client';
import { ApiResponses } from '@/lib/api/response-builder';

// GET /api/clients - Listar clientes con búsqueda avanzada
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parsear y validar filtros
    const filters = clientFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    });

    const skip = (filters.page - 1) * filters.limit;

    // Construir filtros de búsqueda avanzada
    const where: Record<string, unknown> = {
      deletedAt: null, // Soft delete - solo mostrar no eliminados
      // tenantId: session.user.tenantId // TODO: Habilitar cuando se implemente auth
    };

    // Búsqueda global por múltiples campos
    if (filters.search) {
      where['OR'] = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtros específicos
    if (filters.type) {
      where['type'] = filters.type;
    }

    if (filters.isActive !== undefined) {
      where['isActive'] = filters.isActive;
    }

    // Filtro por rango de fechas
    if (filters.dateFrom || filters.dateTo) {
      const createdAtFilter: Record<string, Date> = {};
      if (filters.dateFrom) {
        createdAtFilter['gte'] = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        createdAtFilter['lte'] = new Date(filters.dateTo);
      }
      where['createdAt'] = createdAtFilter;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: filters.limit,
        include: {
          priceList: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              events: true,
              quotes: true,
              documents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Crear cliente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session?.user) {
      return ApiResponses.unauthorized('No autenticado');
    }

    if (!session.user.tenantId) {
      return ApiResponses.unauthorized('Usuario sin tenant asignado');
    }

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    // Verificar email único si se proporciona
    if (validatedData.email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          tenantId: session.user.tenantId,
          deletedAt: null,
        },
      });

      if (existingClient) {
        return ApiResponses.badRequest('Ya existe un cliente con ese email');
      }
    }

    const createData = {
      tenantId: session.user.tenantId,
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || null,
      address: validatedData.address || null,
      company: validatedData.company || null,
      type: validatedData.type,
      discountPercent: validatedData.discountPercent || null,
      notes: validatedData.notes || null,
      priceListId: validatedData.priceListId || null,
    };

    const client = await prisma.client.create({
      data: createData,
      include: {
        priceList: true,
        _count: {
          select: {
            events: true,
            quotes: true,
            documents: true,
          },
        },
      },
    });

    console.log('✅ Cliente creado exitosamente:', client.id);

    return ApiResponses.created({
      client,
      message: 'Cliente creado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest('Datos inválidos', error.errors);
    }

    console.error('Error al crear cliente:', error);
    return ApiResponses.internalError(
      error instanceof Error ? error.message : 'Error interno del servidor'
    );
  }
}
