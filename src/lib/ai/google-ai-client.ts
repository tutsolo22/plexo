/**
 * Cliente para Google Generative AI usando API REST directa
 * 
 * NOTA IMPORTANTE: Actualmente usa v1beta porque la API v1 (estable) aún no 
 * soporta completamente todos los modelos Gemini como gemini-1.5-flash.
 * Cuando Google migre completamente a v1, se deberá actualizar las URLs.
 * 
 * Reemplaza el uso del SDK @google/generative-ai para evitar problemas
 * de versiones y tener control directo sobre las peticiones HTTP.
 */

export interface GoogleAIConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface GoogleAIResponse {
  text: string;
  finishReason?: string;
  safetyRatings?: any[];
}

/**
 * Cliente para llamadas directas a Google Generative AI API v1
 */
export class GoogleAIClient {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private topK: number;
  private topP: number;
  private maxOutputTokens: number;

  constructor(config?: GoogleAIConfig) {
    this.apiKey = config?.apiKey || 
                  process.env['GOOGLE_API_KEY'] || 
                  process.env['GOOGLE_AI_API_KEY'] || 
                  '';
    
    // El modelo debe incluir el prefijo 'models/' para v1beta
    let modelName = config?.model || 
                    process.env['GOOGLE_AI_MODEL'] || 
                    'gemini-2.5-flash';
    
    // Asegurar que tenga el prefijo 'models/'
    this.model = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
    
    this.temperature = config?.temperature ?? 0.7;
    this.topK = config?.topK ?? 40;
    this.topP = config?.topP ?? 0.9;
    this.maxOutputTokens = config?.maxOutputTokens ?? 2048;

    if (!this.apiKey) {
      console.warn('Google API Key no configurada. Establece GOOGLE_API_KEY o GOOGLE_AI_API_KEY');
    }
  }

  /**
   * Genera contenido usando el modelo de Google AI
   */
  async generateContent(prompt: string): Promise<GoogleAIResponse> {
    if (!this.apiKey) {
      throw new Error('Google API Key no configurada');
    }

    // NOTA: Usando v1beta porque v1 aún no soporta todos los modelos Gemini
    // El nombre del modelo ya incluye el prefijo 'models/'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: this.temperature,
          topK: this.topK,
          topP: this.topP,
          maxOutputTokens: this.maxOutputTokens,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Google AI API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    
    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error('No se recibió respuesta válida del modelo');
    }

    return {
      text: candidate.content.parts[0].text,
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings,
    };
  }

  /**
   * Genera contenido con historial de conversación
   */
  async generateContentWithHistory(
    prompt: string,
    history: Array<{ role: 'user' | 'model'; text: string }>
  ): Promise<GoogleAIResponse> {
    if (!this.apiKey) {
      throw new Error('Google API Key no configurada');
    }

    // NOTA: Usando v1beta porque v1 aún no soporta todos los modelos Gemini
    // El nombre del modelo ya incluye el prefijo 'models/'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${this.model}:generateContent?key=${this.apiKey}`;
    
    // Convertir el historial al formato de la API
    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user' as const,
        parts: [{ text: prompt }]
      }
    ];

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: this.temperature,
          topK: this.topK,
          topP: this.topP,
          maxOutputTokens: this.maxOutputTokens,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Google AI API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    
    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error('No se recibió respuesta válida del modelo');
    }

    return {
      text: candidate.content.parts[0].text,
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings,
    };
  }

  /**
   * Genera embeddings para texto (para búsquedas semánticas)
   */
  async embedContent(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('Google API Key no configurada');
    }

    // Modelo específico para embeddings (v1beta soporta embeddings)
    const embeddingModel = 'models/text-embedding-004';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${embeddingModel}:embedContent?key=${this.apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Google AI Embedding API Error: ${response.status}`
      );
    }

    const data = await response.json();
    return data.embedding?.values || [];
  }

  /**
   * Actualiza la configuración del cliente
   */
  configure(config: GoogleAIConfig): void {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    if (config.topK !== undefined) this.topK = config.topK;
    if (config.topP !== undefined) this.topP = config.topP;
    if (config.maxOutputTokens !== undefined) this.maxOutputTokens = config.maxOutputTokens;
  }
}

/**
 * Instancia global del cliente (singleton)
 */
export const googleAI = new GoogleAIClient();
