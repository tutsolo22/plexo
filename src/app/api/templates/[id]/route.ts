import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TemplateType } from '@prisma/client';

// Schema de validación para actualización de templates
const updateTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().optional(),
  type: z.nativeEnum(TemplateType).optional(),
  category: z.string().optional(),
  htmlContent: z.string().min(1, 'El contenido HTML es requerido').optional(),
  variables: z.array(z.string()).optional(),
  styles: z.record(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.quoteTemplate.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        businessIdentity: {
          select: {
            name: true,
            logo: true,
            email: true,
            phone: true,
            address: true,
          }
        },
        quotes: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            createdAt: true,
            client: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          take: 10, // Últimas 10 cotizaciones usando este template
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            quotes: true,
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Parsear campos JSON
    const processedTemplate = {
      ...template,
      variables: template.variables ? JSON.parse(template.variables as string) : [],
      styles: template.styles ? JSON.parse(template.styles as string) : {},
      metadata: template.metadata ? JSON.parse(template.metadata as string) : {},
    };

    return NextResponse.json(processedTemplate);

  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos (MANAGER+ puede editar templates)
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    
    // Como session.user.role es un objeto UserRole, necesitamos acceder a la información del rol
    // Temporalmente usamos la verificación legacy hasta migrar completamente
    const userRole = (session.user as any).role;
    const hasRole = Array.isArray(userRole) 
      ? userRole.some((r: any) => allowedRoles.includes(r.role?.type || r.type))
      : allowedRoles.includes(userRole?.type || userRole);
      
    if (!hasRole) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Verificar que el template existe y pertenece al tenant
    const existingTemplate = await prisma.quoteTemplate.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Si se está marcando como default, desactivar otros defaults del mismo tipo
    if (validatedData.isDefault && validatedData.type) {
      await prisma.quoteTemplate.updateMany({
        where: {
          tenantId: session.user.tenantId,
          type: validatedData.type,
          isDefault: true,
          id: { not: id }, // Excluir el template actual
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Procesar campos JSON
    const updateData: any = { ...validatedData };
    if (validatedData.variables) {
      updateData.variables = JSON.stringify(validatedData.variables);
    }
    if (validatedData.styles) {
      updateData.styles = JSON.stringify(validatedData.styles);
    }
    if (validatedData.metadata) {
      updateData.metadata = JSON.stringify(validatedData.metadata);
    }

    // Incrementar versión si se cambia el contenido
    if (validatedData.htmlContent && validatedData.htmlContent !== existingTemplate.htmlContent) {
      updateData.version = existingTemplate.version + 1;
    }

    const updatedTemplate = await prisma.quoteTemplate.update({
      where: { id },
      data: updateData,
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

    // Parsear campos JSON para respuesta
    const processedTemplate = {
      ...updatedTemplate,
      variables: updatedTemplate.variables ? JSON.parse(updatedTemplate.variables as string) : [],
      styles: updatedTemplate.styles ? JSON.parse(updatedTemplate.styles as string) : {},
      metadata: updatedTemplate.metadata ? JSON.parse(updatedTemplate.metadata as string) : {},
    };

    return NextResponse.json(processedTemplate);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos (MANAGER+ puede eliminar templates)
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'];
    
    // Como session.user.role es un objeto UserRole, necesitamos acceder a la información del rol
    // Temporalmente usamos la verificación legacy hasta migrar completamente
    const userRole = (session.user as any).role;
    const hasRole = Array.isArray(userRole) 
      ? userRole.some((r: any) => allowedRoles.includes(r.role?.type || r.type))
      : allowedRoles.includes(userRole?.type || userRole);
      
    if (!hasRole) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que el template existe y pertenece al tenant
    const template = await prisma.quoteTemplate.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            quotes: true,
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar templates que están siendo usados
    if (template._count.quotes > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar un template que está siendo usado por cotizaciones',
          quotesCount: template._count.quotes
        },
        { status: 400 }
      );
    }

    // No permitir eliminar el template por defecto si es el único
    if (template.isDefault) {
      const otherDefaults = await prisma.quoteTemplate.count({
        where: {
          tenantId: session.user.tenantId,
          type: template.type,
          isActive: true,
          id: { not: id },
        },
      });

      if (otherDefaults === 0) {
        return NextResponse.json(
          { error: 'No se puede eliminar el único template por defecto. Cree otro primero.' },
          { status: 400 }
        );
      }
    }

    await prisma.quoteTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Template eliminado correctamente' 
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}