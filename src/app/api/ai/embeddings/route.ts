import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { crmEmbeddingService } from '@/lib/ai/crm-embeddings';
import { $Enums } from '@prisma/client';
import { z } from 'zod';

// Schema de validación para búsqueda vectorial
const searchEmbeddingsSchema = z.object({
  query: z.string().min(1, 'La consulta es requerida'),
  type: z.enum(['event', 'client', 'quote', 'product', 'service', 'room']).optional(),
  limit: z.number().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  businessIdentityId: z.string().optional(),
  includeEntity: z.boolean().default(false),
});

// POST /api/ai/embeddings/search - Búsqueda semántica
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = searchEmbeddingsSchema.parse(body);

    // Realizar búsqueda vectorial
    const searchOptions = {
      limit: validatedData.limit,
      threshold: validatedData.threshold,
      tenantId: session.user.tenantId,
      includeEntity: validatedData.includeEntity,
      ...(validatedData.type && { type: validatedData.type }),
      ...(validatedData.businessIdentityId && {
        businessIdentityId: validatedData.businessIdentityId,
      }),
    };

    const results = await crmEmbeddingService.searchSimilar(validatedData.query, searchOptions);

    return NextResponse.json({
      success: true,
      data: {
        query: validatedData.query,
        results,
        total: results.length,
        metadata: {
          threshold: validatedData.threshold,
          type: validatedData.type,
          tenantId: session.user.tenantId,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error en búsqueda de embeddings:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/embeddings - Re-indexar entidades específicas
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo SUPER_ADMIN y TENANT_ADMIN pueden re-indexar
    const userRoleType = session.user.role as $Enums.RoleType;
    if (
      userRoleType !== $Enums.RoleType.SUPER_ADMIN &&
      userRoleType !== $Enums.RoleType.TENANT_ADMIN
    ) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { entityType, entityId, reindexAll } = body;

    if (reindexAll) {
      // Re-indexar todo el tenant
      await crmEmbeddingService.reindexTenant(session.user.tenantId);

      return NextResponse.json({
        success: true,
        message: 'Re-indexación completa iniciada',
        data: {
          tenantId: session.user.tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } else if (entityType && entityId) {
      // Re-indexar entidad específica
      switch (entityType.toLowerCase()) {
        case 'event':
          await crmEmbeddingService.indexEvent(entityId, session.user.tenantId);
          break;
        case 'client':
          await crmEmbeddingService.indexClient(entityId, session.user.tenantId);
          break;
        case 'quote':
          await crmEmbeddingService.indexQuote(entityId, session.user.tenantId);
          break;
        case 'product':
          await crmEmbeddingService.indexProduct(entityId, session.user.tenantId);
          break;
        default:
          return NextResponse.json(
            { success: false, error: 'Tipo de entidad no soportado' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        message: `${entityType} re-indexado exitosamente`,
        data: {
          entityType,
          entityId,
          tenantId: session.user.tenantId,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere reindexAll o entityType + entityId' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error en re-indexación:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/ai/embeddings/stats - Estadísticas de embeddings
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo roles administrativos pueden ver estadísticas
    const userRoleType = session.user.role as $Enums.RoleType;
    if (
      userRoleType !== $Enums.RoleType.SUPER_ADMIN &&
      userRoleType !== $Enums.RoleType.TENANT_ADMIN &&
      userRoleType !== $Enums.RoleType.MANAGER
    ) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const businessIdentityId = searchParams.get('businessIdentityId');

    // Construir query para estadísticas
    const whereClause = [`tenant_id = '${session.user.tenantId}'`];

    if (businessIdentityId) {
      whereClause.push(`metadata->>'businessIdentity' = '${businessIdentityId}'`);
    }

    const whereCondition = whereClause.join(' AND ');

    // Obtener estadísticas de embeddings por tipo
    const statsQuery = `
      SELECT 
        entity_type,
        COUNT(*) as total,
        AVG(array_length(embedding, 1)) as avg_dimensions,
        MIN(updated_at) as oldest_update,
        MAX(updated_at) as newest_update
      FROM ai_embeddings 
      WHERE ${whereCondition}
      GROUP BY entity_type
      ORDER BY total DESC
    `;

    const stats = (await prisma.$queryRawUnsafe(statsQuery)) as Array<{
      entity_type: string;
      total: number;
      avg_dimensions: number;
      oldest_update: string;
      newest_update: string;
    }>;

    // Obtener total general
    const totalQuery = `
      SELECT COUNT(*) as total_embeddings
      FROM ai_embeddings 
      WHERE ${whereCondition}
    `;

    const [totalResult] = (await prisma.$queryRawUnsafe(totalQuery)) as Array<{
      total_embeddings: number;
    }>;

    return NextResponse.json({
      success: true,
      data: {
        totalEmbeddings: totalResult ? parseInt(totalResult.total_embeddings.toString()) : 0,
        byType: stats.map(stat => ({
          entityType: stat.entity_type,
          total: parseInt(stat.total.toString()),
          avgDimensions: Math.round(stat.avg_dimensions),
          oldestUpdate: stat.oldest_update,
          newestUpdate: stat.newest_update,
        })),
        tenantId: session.user.tenantId,
        businessIdentityId,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de embeddings:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
