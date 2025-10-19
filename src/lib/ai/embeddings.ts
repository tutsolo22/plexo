import OpenAI from 'openai';

// Configuración del cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export interface SearchResult {
  id: string;
  similarity: number;
  content: string;
  metadata: any;
  type: 'event' | 'client' | 'quote' | 'venue';
}

export class EmbeddingService {
  private model: string;

  constructor(model = process.env['OPENAI_EMBEDDING_MODEL'] || 'text-embedding-3-small') {
    this.model = model;
  }

  /**
   * Genera un embedding para el texto proporcionado
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

      return {
        embedding: response.data[0]?.embedding || [],
        tokens: response.usage.total_tokens,
      };
    } catch (error) {
      console.error('Error generando embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Genera embeddings para múltiples textos
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float',
      });

      return response.data.map((item, index) => ({
        embedding: item.embedding,
        tokens: response.usage.total_tokens / texts.length, // Aproximado
      }));
    } catch (error) {
      console.error('Error generando embeddings batch:', error);
      throw new Error('Failed to generate batch embeddings');
    }
  }

  /**
   * Procesa texto antes de generar embedding
   * Limpia y normaliza el contenido
   */
  prepareTextForEmbedding(content: any): string {
    if (typeof content === 'string') {
      return content.trim();
    }

    if (typeof content === 'object') {
      // Convertir objeto a texto descriptivo
      const textParts = [];
      
      if (content.name || content.title) {
        textParts.push(content.name || content.title);
      }
      
      if (content.description) {
        textParts.push(content.description);
      }

      if (content.type) {
        textParts.push(`Tipo: ${content.type}`);
      }

      if (content.location) {
        textParts.push(`Ubicación: ${content.location}`);
      }

      if (content.date) {
        textParts.push(`Fecha: ${content.date}`);
      }

      if (content.status) {
        textParts.push(`Estado: ${content.status}`);
      }

      return textParts.join('. ').trim();
    }

    return String(content).trim();
  }
}

// Instancia singleton del servicio
export const embeddingService = new EmbeddingService();