/**
 * API para Gestión de Roles y Permisos
 * CRUD completo para el sistema de roles flexibles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { roleManagementService } from '@/lib/services/role-management';
import { RoleType, PermissionAction, PermissionResource } from '@prisma/client';
import { z } from 'zod';

// Schemas de validación
const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  type: z.nativeEnum(RoleType),
  permissions: z.array(z.object({
    action: z.nativeEnum(PermissionAction),
    resource: z.nativeEnum(PermissionResource),
    conditions: z.record(z.any()).optional()
  }))
});

const AssignRoleSchema = z.object({
  userId: z.string().min(1, 'Usuario requerido'),
  roleId: z.string().min(1, 'Rol requerido'),
  isPrimary: z.boolean().optional(),
  expiresAt: z.string().datetime().optional()
});

/**
 * GET /api/roles - Obtener roles del tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
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
      const result = await roleManagementService.getTenantRoles(session.user.tenantId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data
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

      const userWithRoles = await roleManagementService.getUserWithRoles(userId);
      
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
        actionParam as PermissionAction,
        resource as PermissionResource
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
    const session = await getServerSession(authOptions);
    
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
      
      const result = await roleManagementService.createRole({
        ...validatedData,
        tenantId: session.user.tenantId,
        createdById: session.user.id
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message
      }, { status: 201 });
    }

    // Asignar rol a usuario
    if (action === 'assign') {
      const validatedData = AssignRoleSchema.parse(body);
      
      const result = await roleManagementService.assignRole({
        ...validatedData,
        assignedById: session.user.id,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message
      }, { status: 201 });
    }

    // Inicializar roles del sistema
    if (action === 'initialize') {
      const result = await roleManagementService.initializeSystemRoles(
        session.user.tenantId,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message
      });
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
 * DELETE /api/roles - Remover rol de usuario
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'UserId y RoleId requeridos' },
        { status: 400 }
      );
    }

    const result = await roleManagementService.removeRole(
      userId,
      roleId,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}