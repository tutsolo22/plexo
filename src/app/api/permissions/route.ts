/**
 * API para Gestión de Permisos
 * Operaciones CRUD y consultas para el sistema de permisos
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { roleManagementService } from '@/lib/role-management';
import { $Enums } from '@prisma/client';
import { z } from 'zod';

// Schemas de validación
const CheckPermissionSchema = z.object({
  userId: z.string().min(1, 'Usuario requerido'),
  action: z.nativeEnum($Enums.PermissionAction),
  resource: z.nativeEnum($Enums.PermissionResource),
  conditions: z.record(z.any()).optional()
});

const BulkPermissionCheckSchema = z.object({
  userId: z.string().min(1, 'Usuario requerido'),
  permissions: z.array(z.object({
    action: z.nativeEnum($Enums.PermissionAction),
    resource: z.nativeEnum($Enums.PermissionResource),
    conditions: z.record(z.any()).optional()
  }))
});

/**
 * GET /api/permissions - Obtener información sobre permisos
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

    // Obtener todas las acciones y recursos disponibles
    if (action === 'available') {
        return NextResponse.json({
        success: true,
        data: {
          actions: Object.values($Enums.PermissionAction),
          resources: Object.values($Enums.PermissionResource)
        }
      });
    }

    // Obtener permisos efectivos de un usuario
    if (action === 'user-permissions') {
      const userId = searchParams.get('userId');
      
      if (!userId) {
        return NextResponse.json(
          { error: 'UserId requerido' },
          { status: 400 }
        );
      }

      const userPermissions = await roleManagementService.getUserPermissions(userId);

      return NextResponse.json({
        success: true,
        data: userPermissions
      });
    }

    return NextResponse.json(
      { error: 'Acción no especificada o inválida' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error en GET /api/permissions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/permissions - Verificar permisos
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

    // Verificar un permiso específico
    if (!action || action === 'check') {
      const validatedData = CheckPermissionSchema.parse(body);
      
      const hasPermission = await roleManagementService.hasPermission(
        validatedData.userId as string,
        validatedData.action as $Enums.PermissionAction,
        validatedData.resource as $Enums.PermissionResource
      );

      return NextResponse.json({
        success: true,
        data: { 
          hasPermission,
          userId: validatedData.userId,
          action: validatedData.action,
          resource: validatedData.resource
        }
      });
    }

    // Verificar múltiples permisos
    if (action === 'bulk-check') {
      const validatedData = BulkPermissionCheckSchema.parse(body);
      
      const results = await Promise.all(
        validatedData.permissions.map(async (permission) => {
          const hasPermission = await roleManagementService.hasPermission(
            validatedData.userId as string,
            permission.action as $Enums.PermissionAction,
            permission.resource as $Enums.PermissionResource
          );

          return {
            action: permission.action,
            resource: permission.resource,
            hasPermission
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          userId: validatedData.userId,
          results
        }
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error en POST /api/permissions:', error);
    
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