import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { $Enums } from '@prisma/client';

// Schema de validación para identidades de negocio
const createBusinessIdentitySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  website: z.string().url('URL inválida').optional(),
  logo: z.string().optional(),
  slogan: z.string().optional(),
});

// GET /api/business-identities - Listar identidades de negocio
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
    };

    if (isActive !== null) where['isActive'] = isActive === 'true';

    const businessIdentities = await prisma.businessIdentity.findMany({
      where,
      include: {
        locations: {
          include: {
            rooms: {
              select: { id: true, name: true, isActive: true },
            },
          },
        },
        quoteTemplates: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
        _count: {
          select: {
            locations: true,
            quoteTemplates: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: businessIdentities,
    });
  } catch (error) {
    console.error('Error al obtener identidades de negocio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/business-identities - Crear identidad de negocio
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo TENANT_ADMIN y MANAGER pueden crear identidades
    const userRoleType = session.user.role as $Enums.RoleType;
    if (
      userRoleType !== $Enums.RoleType.SUPER_ADMIN &&
      userRoleType !== $Enums.RoleType.TENANT_ADMIN &&
      userRoleType !== $Enums.RoleType.MANAGER
    ) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createBusinessIdentitySchema.parse(body);

    // Verificar límite de identidades por tenant (máximo 5)
    const currentCount = await prisma.businessIdentity.count({
      where: { tenantId: session.user.tenantId },
    });

    if (currentCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Máximo 5 identidades de negocio por organización' },
        { status: 400 }
      );
    }

    // Transacción para crear la identidad de negocio
    const businessIdentity = await prisma.$transaction(async tx => {
      const createData = {
        tenantId: session.user.tenantId,
        name: validatedData.name,
        address: validatedData.address ?? null,
        phone: validatedData.phone ?? null,
        email: validatedData.email ?? null,
        website: validatedData.website ?? null,
        logo: validatedData.logo ?? null,
        slogan: validatedData.slogan ?? null,
      };

      return await tx.businessIdentity.create({
        data: createData,
        include: {
          _count: {
            select: {
              locations: true,
              quoteTemplates: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: businessIdentity,
        message: 'Identidad de negocio creada exitosamente',
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

    console.error('Error al crear identidad de negocio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
