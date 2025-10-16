/**
 * API para Gestión de Roles y Permisos
 * CRUD completo para el sistema de roles flexibles
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { roleManagementService, CreateRoleInput, AssignRoleInput } from '@/lib/role-management';
import { $Enums } from '@prisma/client';
import { z } from 'zod';

// Schemas de validación
const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  type: z.nativeEnum($Enums.RoleType),
  permissions: z.array(z.object({
    action: z.nativeEnum($Enums.PermissionAction),
    resource: z.nativeEnum($Enums.PermissionResource),
    conditions: z.record(z.any()).optional()
  }))
});

const AssignRoleSchema = z.object({
  userId: z.string().min(1, 'Usuario requerido'),
  roleId: z.string().min(1, 'Rol requerido'),
  expiresAt: z.string().datetime().optional()
});

/**
 * GET /api/roles - Obtener roles del tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Obtener roles del tenant
    if (!action) {
      const result = await roleManagementService.listRoles({ tenantId: session.user.tenantId });

      return NextResponse.json({
        success: true,
        data: result
      });
    }

    // Obtener usuario con roles específico
    if (action === 'user-roles') {
      const userId = searchParams.get('userId');
      
      if (!userId) {
        return NextResponse.json(
          { error: 'UserId requerido' },
          { status: 400 }
        );
      }

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

    // Verificar permiso específico
    if (action === 'check-permission') {
      const userId = searchParams.get('userId');
      const actionParam = searchParams.get('permissionAction');
      const resource = searchParams.get('resource');

      if (!userId || !actionParam || !resource) {
        return NextResponse.json(
          { error: 'Parámetros faltantes' },
          { status: 400 }
        );
      }

      const hasPermission = await roleManagementService.hasPermission(
        userId,
        actionParam as $Enums.PermissionAction,
        resource as $Enums.PermissionResource
      );

      return NextResponse.json({
        success: true,
        data: { hasPermission }
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error en GET /api/roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/roles - Crear nuevo rol o asignar rol a usuario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Crear nuevo rol
    if (!action || action === 'create') {
      const validatedData = CreateRoleSchema.parse(body);
      
      const createInput: CreateRoleInput = {
        name: validatedData.name as string,
        type: validatedData.type as $Enums.RoleType,
        tenantId: session.user.tenantId,
        permissions: validatedData.permissions as CreateRoleInput['permissions']
      };
      
      if (validatedData.description) {
        createInput.description = validatedData.description as string;
      }

      const result = await roleManagementService.createRole(createInput);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Rol creado exitosamente'
      }, { status: 201 });
    }

    // Asignar rol a usuario
    if (action === 'assign') {
      const validatedData = AssignRoleSchema.parse(body);
      
      const inputData: AssignRoleInput = {
        userId: validatedData.userId as string,
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
    }

    // Inicializar roles del sistema - método no disponible en el servicio actual
    if (action === 'initialize') {
      return NextResponse.json(
        { error: 'Método de inicialización no disponible' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error en POST /api/roles:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles - Actualizar rol existente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json(
        { error: 'RoleId requerido' },
        { status: 400 }
      );
    }

    const UpdateRoleSchema = z.object({
      name: z.string().min(1, 'Nombre requerido').optional(),
      description: z.string().optional(),
      permissions: z.array(z.object({
        action: z.nativeEnum($Enums.PermissionAction),
        resource: z.nativeEnum($Enums.PermissionResource),
        conditions: z.record(z.any()).optional()
      })).optional()
    });

    const validatedData = UpdateRoleSchema.parse(body);
    
    // Construir objeto con tipos correctos
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name as string;
    if (validatedData.description !== undefined) updateData.description = validatedData.description as string;
    if (validatedData.permissions) updateData.permissions = validatedData.permissions;

    const result = await roleManagementService.updateRole(roleId, updateData);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Rol actualizado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en PUT /api/roles:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/roles - Remover rol de usuario o eliminar rol
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');

    // Eliminar rol del sistema
    if (action === 'delete-role') {
      if (!roleId) {
        return NextResponse.json(
          { error: 'RoleId requerido' },
          { status: 400 }
        );
      }

      await roleManagementService.deleteRole(roleId);

      return NextResponse.json({
        success: true,
        message: 'Rol eliminado exitosamente'
      });
    }

    // Remover rol de usuario (acción por defecto)
    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'UserId y RoleId requeridos' },
        { status: 400 }
      );
    }

    await roleManagementService.unassignRole(userId, roleId);

    return NextResponse.json({
      success: true,
      message: 'Rol removido del usuario exitosamente'
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}