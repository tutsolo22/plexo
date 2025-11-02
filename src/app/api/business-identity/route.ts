import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/responses';

// GET - Obtener BusinessIdentity del tenant
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return ApiResponses.unauthorized();
    }

    const businessIdentity = await prisma.businessIdentity.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        slogan: true,
        facebook: true,
        instagram: true,
        twitter: true,
        website: true,
        isActive: true,
      },
    });

    if (!businessIdentity) {
      return ApiResponses.notFound('No se encontró información de negocio');
    }

    return ApiResponses.success(businessIdentity);
  } catch (error) {
    console.error('Error fetching business identity:', error);
    return ApiResponses.internalError('Error al obtener información del negocio');
  }
}

// PUT - Actualizar BusinessIdentity
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return ApiResponses.unauthorized();
    }

    const body = await req.json();
    const {
      name,
      address,
      phone,
      email,
      logo,
      slogan,
      facebook,
      instagram,
      twitter,
      website,
    } = body;

    // Buscar BusinessIdentity existente
    let businessIdentity = await prisma.businessIdentity.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
      },
    });

    if (businessIdentity) {
      // Actualizar existente
      businessIdentity = await prisma.businessIdentity.update({
        where: { id: businessIdentity.id },
        data: {
          name,
          address,
          phone,
          email,
          logo,
          slogan,
          facebook,
          instagram,
          twitter,
          website,
        },
      });
    } else {
      // Crear nuevo si no existe
      businessIdentity = await prisma.businessIdentity.create({
        data: {
          name: name || 'Mi Negocio',
          address,
          phone,
          email,
          logo,
          slogan,
          facebook,
          instagram,
          twitter,
          website,
          tenantId: session.user.tenantId,
        },
      });
    }

    return ApiResponses.success(businessIdentity, 'Información actualizada exitosamente');
  } catch (error) {
    console.error('Error updating business identity:', error);
    return ApiResponses.internalError('Error al actualizar información del negocio');
  }
}
