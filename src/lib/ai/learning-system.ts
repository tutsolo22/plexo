/**
 * Learning System - Aprende de conversaciones exitosas usando RAG
 * Guarda ejemplos de consultas exitosas con embeddings para búsqueda semántica
 */

import { prisma } from '@/lib/prisma';
import { GoogleAIClient } from './google-ai-client';

export interface QueryExample {
  id: string;
  userQuery: string;
  intent: string;
  action: string;
  entity?: string;
  filters?: any;
  response: string;
  success: boolean;
  embedding?: number[];
  tenantId: string;
  createdAt: Date;
}

export class LearningSystem {
  private aiClient: GoogleAIClient;

  constructor() {
    this.aiClient = new GoogleAIClient();
  }

  /**
   * Guarda un ejemplo de consulta exitosa para aprendizaje futuro
   */
  async saveSuccessfulQuery(example: {
    userQuery: string;
    intent: string;
    action: string;
    entity?: string;
    filters?: any;
    response: string;
    tenantId: string;
  }): Promise<void> {
    try {
      // Generar embedding de la consulta para búsqueda semántica
      const embedding = await this.aiClient.embedContent(example.userQuery);

      // Guardar en la base de datos con embedding
      await prisma.$executeRaw`
        INSERT INTO "QueryExample" (
          id, 
          "userQuery", 
          intent, 
          action, 
          entity, 
          filters, 
          response, 
          success, 
          embedding, 
          "tenantId", 
          "createdAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${example.userQuery},
          ${example.intent},
          ${example.action},
          ${example.entity || null},
          ${JSON.stringify(example.filters || {})}::jsonb,
          ${example.response},
          true,
          ${JSON.stringify(embedding)}::vector,
          ${example.tenantId},
          NOW()
        )
        ON CONFLICT DO NOTHING
      `;

      console.log('✅ Ejemplo guardado para aprendizaje:', example.userQuery);
    } catch (error) {
      console.error('Error guardando ejemplo:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }

  /**
   * Busca ejemplos similares a la consulta actual
   * Usa búsqueda semántica con embeddings
   */
  async findSimilarExamples(
    query: string,
    tenantId: string,
    limit: number = 5
  ): Promise<QueryExample[]> {
    try {
      // Generar embedding de la consulta actual
      const queryEmbedding = await this.aiClient.embedContent(query);

      // Buscar ejemplos similares usando similitud de coseno
      const examples = await prisma.$queryRaw<QueryExample[]>`
        SELECT 
          id,
          "userQuery",
          intent,
          action,
          entity,
          filters,
          response,
          success,
          "tenantId",
          "createdAt",
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM "QueryExample"
        WHERE "tenantId" = ${tenantId}
          AND success = true
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      `;

      console.log(`🔍 Encontrados ${examples.length} ejemplos similares para: "${query}"`);
      return examples;
    } catch (error) {
      console.error('Error buscando ejemplos similares:', error);
      return [];
    }
  }

  /**
   * Genera contexto de aprendizaje basado en ejemplos similares
   */
  async getLearnedContext(query: string, tenantId: string): Promise<string> {
    const examples = await this.findSimilarExamples(query, tenantId, 3);

    if (examples.length === 0) {
      return 'No hay ejemplos previos similares.';
    }

    let context = 'Ejemplos de consultas similares que funcionaron antes:\n\n';

    examples.forEach((ex, idx) => {
      context += `Ejemplo ${idx + 1}:\n`;
      context += `Usuario preguntó: "${ex.userQuery}"\n`;
      context += `Acción tomada: ${ex.action}\n`;
      context += `Entidad: ${ex.entity || 'N/A'}\n`;
      if (ex.filters && Object.keys(ex.filters).length > 0) {
        context += `Filtros: ${JSON.stringify(ex.filters)}\n`;
      }
      context += `Respuesta: ${ex.response.substring(0, 100)}...\n\n`;
    });

    return context;
  }

  /**
   * Obtiene estadísticas de aprendizaje
   */
  async getLearningStats(tenantId: string): Promise<{
    totalExamples: number;
    byIntent: Record<string, number>;
    byEntity: Record<string, number>;
  }> {
    try {
      const total = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "QueryExample"
        WHERE "tenantId" = ${tenantId}
          AND success = true
      `;

      const byIntent = await prisma.$queryRaw<Array<{ intent: string; count: bigint }>>`
        SELECT intent, COUNT(*) as count
        FROM "QueryExample"
        WHERE "tenantId" = ${tenantId}
          AND success = true
        GROUP BY intent
      `;

      const byEntity = await prisma.$queryRaw<Array<{ entity: string; count: bigint }>>`
        SELECT entity, COUNT(*) as count
        FROM "QueryExample"
        WHERE "tenantId" = ${tenantId}
          AND success = true
          AND entity IS NOT NULL
        GROUP BY entity
      `;

      return {
        totalExamples: Number(total[0]?.count || 0),
        byIntent: Object.fromEntries(
          byIntent.map(row => [row.intent, Number(row.count)])
        ),
        byEntity: Object.fromEntries(
          byEntity.map(row => [row.entity, Number(row.count)])
        ),
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { totalExamples: 0, byIntent: {}, byEntity: {} };
    }
  }
}

export const learningSystem = new LearningSystem();
