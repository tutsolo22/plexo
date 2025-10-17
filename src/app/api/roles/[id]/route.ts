/**
 * API para Gestión de Roles Individuales
 * Operaciones CRUD para roles específicos por ID
 */

import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth'; // Temporarily disabled
import { roleManagementService } from '@/lib/role-management';
import { $Enums } from '@prisma/client';
import { z } from 'zod';

// Schemas de validación
const UpdateRoleSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.object({
    action: z.nativeEnum($Enums.PermissionAction),
    resource: z.nativeEnum($Enums.PermissionResource),
    conditions: z.record(z.any()).optional()
  })).optional()
});

/**
 * GET /api/roles/[id] - Obtener rol específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: roleId } = params;

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID requerido' },
        { status: 400 }
      );
    }

    const role = await roleManagementService.getRoleById(roleId);

    if (!role) {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role
    });

  } catch (error: any) {
    console.error('Error en GET /api/roles/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/[id] - Actualizar rol específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: roleId } = params;
    const body = await request.json();

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID requerido' },
        { status: 400 }
      );
    }

    const validatedData = UpdateRoleSchema.parse(body);
    
    // Construir objeto con tipos correctos
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.permissions) updateData.permissions = validatedData.permissions;
    
    const updatedRole = await roleManagementService.updateRole(roleId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: 'Rol actualizado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en PUT /api/roles/[id]:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/roles/[id] - Eliminar rol específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: roleId } = params;

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID requerido' },
        { status: 400 }
      );
    }

    await roleManagementService.deleteRole(roleId);

    return NextResponse.json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/roles/[id]:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar el rol porque tiene usuarios asignados' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}