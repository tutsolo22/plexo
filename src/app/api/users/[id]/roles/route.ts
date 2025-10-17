/**
 * API para Gestión de Roles de Usuario Específico
 * Operaciones CRUD para los roles asignados a un usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { roleManagementService } from '@/lib/role-management';
import { z } from 'zod';

// Schemas de validación
const AssignRoleSchema = z.object({
  roleId: z.string().min(1, 'Rol requerido'),
  isPrimary: z.boolean().optional(),
  expiresAt: z.string().datetime().optional()
});

// Esquema temporal - será usado en futura implementación
/* const UpdateUserRoleSchema = z.object({
  isPrimary: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable()
}); */

/**
 * GET /api/users/[id]/roles - Obtener roles de usuario específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID requerido' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includePermissions = searchParams.get('includePermissions') === 'true';

    if (includePermissions) {
      // Obtener usuario con roles y permisos completos
      const userWithRoles = await roleManagementService.getUserRoles(userId);
      
      if (!userWithRoles) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // También obtener permisos efectivos
      const effectivePermissions = await roleManagementService.getUserPermissions(userId);

      return NextResponse.json({
        success: true,
        data: {
          user: userWithRoles,
          effectivePermissions
        }
      });
    } else {
      // Solo obtener usuario con roles
      const userWithRoles = await roleManagementService.getUserRoles(userId);
      
      if (!userWithRoles) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: userWithRoles
      });
    }

  } catch (error: any) {
    console.error('Error en GET /api/users/[id]/roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/roles - Asignar rol a usuario
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: userId } = params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID requerido' },
        { status: 400 }
      );
    }

    const validatedData = AssignRoleSchema.parse(body);
    
    const inputData: any = {
      userId,
      roleId: validatedData.roleId as string,
      assignedBy: session.user.id
    };
    
    if (validatedData.expiresAt) {
      inputData.expiresAt = new Date(validatedData.expiresAt as string);
    }

    const assignedRole = await roleManagementService.assignRole(inputData);

    return NextResponse.json({
      success: true,
      data: assignedRole,
      message: 'Rol asignado exitosamente'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/users/[id]/roles:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El usuario ya tiene este rol asignado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]/roles - Actualizar asignación de rol
 * Nota: Funcionalidad pendiente de implementación en el servicio
 */
export async function PUT(
  _request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Funcionalidad de actualización de roles pendiente de implementación' },
    { status: 501 }
  );
}

/**
 * DELETE /api/users/[id]/roles - Remover rol de usuario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: userId } = params;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID y Role ID requeridos' },
        { status: 400 }
      );
    }

    await roleManagementService.unassignRole(userId, roleId);

    return NextResponse.json({
      success: true,
      message: 'Rol removido del usuario exitosamente'
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/users/[id]/roles:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Asignación de rol no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}