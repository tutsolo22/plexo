import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TemplateType } from '@prisma/client';

// Schema de validación para templates
const templateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  type: z.nativeEnum(TemplateType).default(TemplateType.QUOTE),
  category: z.string().optional(),
  htmlContent: z.string().min(1, 'El contenido HTML es requerido'),
  variables: z.array(z.string()).optional(),
  styles: z.record(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Filtros
    const type = searchParams.get('type') as TemplateType | null;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const active = searchParams.get('active');

    // Construir where clause
    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active !== null) {
      where.isActive = active === 'true';
    }

    // Obtener templates con paginación
    const [templates, total] = await Promise.all([
      prisma.quoteTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isDefault: 'desc' }, // Defaults primero
          { createdAt: 'desc' }
        ],
        include: {
          businessIdentity: {
            select: {
              name: true,
              logo: true,
            }
          },
          _count: {
            select: {
              quotes: true, // Cantidad de cotizaciones usando este template
            }
          }
        }
      }),
      prisma.quoteTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Estadísticas adicionales
    const stats = await prisma.quoteTemplate.aggregate({
      where: { tenantId: session.user.tenantId, isActive: true },
      _count: {
        id: true,
      }
    });

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        total: stats._count.id,
      }
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos (MANAGER+ puede crear templates)
    // const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    // if (!allowedRoles.includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    // }

    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    // Si es default, desactivar otros defaults del mismo tipo
    if (validatedData.isDefault) {
      await prisma.quoteTemplate.updateMany({
        where: {
          tenantId: session.user.tenantId,
          type: validatedData.type,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Obtener la primera businessIdentity del tenant (para compatibilidad)
    const businessIdentity = await prisma.businessIdentity.findFirst({
      where: { tenantId: session.user.tenantId },
    });

    if (!businessIdentity) {
      return NextResponse.json(
        { error: 'No se encontró identidad de negocio' },
        { status: 400 }
      );
    }

    // Procesar variables y metadata
    const processedData = {
      name: validatedData.name,
      type: validatedData.type,
      htmlContent: validatedData.htmlContent,
      isDefault: validatedData.isDefault,
      isActive: validatedData.isActive,
      description: validatedData.description || null,
      category: validatedData.category || null,
      variables: validatedData.variables ? JSON.stringify(validatedData.variables) : null,
      styles: validatedData.styles ? JSON.stringify(validatedData.styles) : null,
      metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      tenantId: session.user.tenantId,
      businessIdentityId: businessIdentity.id,
    };

    const template = await prisma.quoteTemplate.create({
      data: processedData as any,
      include: {
        businessIdentity: {
          select: {
            name: true,
            logo: true,
          }
        },
        _count: {
          select: {
            quotes: true,
          }
        }
      }
    });

    return NextResponse.json(template, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
