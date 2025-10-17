import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para crear cliente
const createClientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(['GENERAL', 'COLABORADOR', 'EXTERNO']).default('GENERAL'),
  priceListId: z.string().optional(),
});

// GET /api/clients - Listar clientes
export async function GET(request: NextRequest) {
  try {
    // TEMPORALMENTE DESHABILITADO PARA PRUEBAS
    /*
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    */

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Record<string, unknown> = {
      // tenantId: session.user.tenantId // TEMPORALMENTE COMENTADO PARA PRUEBAS
    };

    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where['type'] = type;
    }

    /*
    // Solo CLIENT_EXTERNAL puede ver sus propios datos
    const userRoleType = session.user.role.roleId as $Enums.RoleType
    if (userRoleType === $Enums.RoleType.CLIENT_EXTERNAL) {
      where["userId"] = session.user.id
    }
    */

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          priceList: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              events: true,
              quotes: true,
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
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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
    // TEMPORALMENTE DESHABILITADO PARA PRUEBAS
    /*
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ciertos roles pueden crear clientes
    const userRoleType = session.user.role.roleId as $Enums.RoleType
    if (userRoleType !== $Enums.RoleType.SUPER_ADMIN && 
        userRoleType !== $Enums.RoleType.TENANT_ADMIN && 
        userRoleType !== $Enums.RoleType.MANAGER && 
        userRoleType !== $Enums.RoleType.USER) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    */

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    // TEMPORALMENTE SIMPLIFICADO PARA PRUEBAS
    // Verificar email único si se proporciona
    if (validatedData.email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          // tenantId: session.user.tenantId
        },
      });

      if (existingClient) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con ese email' },
          { status: 400 }
        );
      }
    }

    const createData = {
      tenantId: 'test-tenant', // VALOR TEMPORAL PARA PRUEBAS
      // userId: session.user.id,
      name: validatedData.name,
      type: validatedData.type,
      email: validatedData.email || 'default@test.com',
      phone: validatedData.phone ?? null,
      address: validatedData.address ?? null,
      notes: validatedData.notes ?? null,
      // priceListId: priceListId ?? null
    };

    const client = await prisma.client.create({
      data: createData,
      include: {
        priceList: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: client,
        message: 'Cliente creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
