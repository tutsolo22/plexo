import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id] - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = session.user.role;
    const userTenantId = (session.user as any).tenantId;

    // Solo SUPER_ADMIN, TENANT_ADMIN, MANAGER pueden ver usuarios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // TENANT_ADMIN y MANAGER solo pueden ver usuarios de su tenant
    if (userRole !== 'SUPER_ADMIN' && user.tenantId !== userTenantId) {
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a este usuario' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo usuario' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Eliminar usuario (borrado completo)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = session.user.role;
    const userId = (session.user as any).id;
    const userTenantId = (session.user as any).tenantId;

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden eliminar usuarios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Solo SUPER_ADMIN y TENANT_ADMIN pueden eliminar usuarios' },
        { status: 403 }
      );
    }

    // No se puede eliminar a sí mismo
    if (params.id === userId) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        role: true,
        tenantId: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // TENANT_ADMIN solo puede eliminar usuarios de su tenant
    if (userRole === 'TENANT_ADMIN') {
      if (user.tenantId !== userTenantId) {
        return NextResponse.json(
          { success: false, error: 'No tienes acceso a este usuario' },
          { status: 403 }
        );
      }

      // TENANT_ADMIN no puede eliminar SUPER_ADMIN o TENANT_ADMIN
      if (['SUPER_ADMIN', 'TENANT_ADMIN'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'No puedes eliminar usuarios SUPER_ADMIN o TENANT_ADMIN' },
          { status: 403 }
        );
      }
    }

    // SUPER_ADMIN eliminando un TENANT_ADMIN: eliminar también su tenant si no tiene otros usuarios
    if (userRole === 'SUPER_ADMIN' && user.role === 'TENANT_ADMIN' && user.tenantId) {
      // Contar cuántos usuarios tiene el tenant
      const tenantUsersCount = await prisma.user.count({
        where: { tenantId: user.tenantId },
      });

      // Si solo tiene un usuario (el que vamos a eliminar), eliminar el tenant también
      if (tenantUsersCount === 1) {
        await prisma.$transaction([
          prisma.user.delete({ where: { id: params.id } }),
          prisma.tenant.delete({ where: { id: user.tenantId } }),
        ]);

        console.log('✅ Usuario y Tenant eliminados:', user.id, 'Tenant:', user.tenantId);

        return NextResponse.json({
          success: true,
          message: 'Usuario y su organización eliminados exitosamente',
          data: { deletedUser: user.id, deletedTenant: user.tenantId },
        });
      }
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: params.id },
    });

    console.log('✅ Usuario eliminado:', user.id, 'Email:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: { deletedUser: user.id },
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error eliminando usuario' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = session.user.role;
    const userTenantId = (session.user as any).tenantId;

    // Solo SUPER_ADMIN, TENANT_ADMIN pueden actualizar usuarios
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Sin permisos para actualizar usuarios' },
        { status: 403 }
      );
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        role: true,
        tenantId: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // TENANT_ADMIN solo puede actualizar usuarios de su tenant
    if (userRole === 'TENANT_ADMIN') {
      if (existingUser.tenantId !== userTenantId) {
        return NextResponse.json(
          { success: false, error: 'No tienes acceso a este usuario' },
          { status: 403 }
        );
      }

      // TENANT_ADMIN no puede actualizar SUPER_ADMIN o TENANT_ADMIN
      if (['SUPER_ADMIN', 'TENANT_ADMIN'].includes(existingUser.role)) {
        return NextResponse.json(
          { success: false, error: 'No puedes actualizar usuarios SUPER_ADMIN o TENANT_ADMIN' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Campos permitidos para actualizar
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) {
      // Verificar que el email no esté en uso
      const emailExists = await prisma.user.findFirst({
        where: {
          email: body.email,
          id: { not: params.id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'El email ya está en uso' },
          { status: 400 }
        );
      }

      updateData.email = body.email;
      updateData.emailVerified = null; // Requiere reverificación
    }
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Solo SUPER_ADMIN puede cambiar roles
    if (body.role !== undefined && userRole === 'SUPER_ADMIN') {
      updateData.role = body.role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phone: true,
        updatedAt: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    console.log('✅ Usuario actualizado:', updatedUser.id);

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error actualizando usuario' },
      { status: 500 }
    );
  }
}
