import { NextRequest } from 'next/server';
import { ApiResponses } from '@/lib/api/responses';
import { OpenAI } from 'openai';
import { z } from 'zod';

// Schema para testing de API keys
const apiTestSchema = z.object({
  provider: z.enum(['google', 'openai', 'both']).default('both'),
  customKey: z.string().optional(), // Para probar una key específica
  testMessage: z.string().default('Hola, este es un test de conexión'),
});

interface ProviderTestResult {
  provider: string;
  status: 'success' | 'error' | 'not_configured';
  configured: boolean;
  keyVisible: string;
  response?: string;
  error?: string;
  responseTime?: number;
  details?: any;
}

/**
 * Endpoint para verificar y probar API keys de proveedores de IA
 * POST /api/ai/test/providers
 */
async function testProvidersHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, customKey, testMessage } = apiTestSchema.parse(body);

    const results: ProviderTestResult[] = [];

    // Test Google Gemini
    if (provider === 'google' || provider === 'both') {
      const googleResult = await testGoogleAI(customKey, testMessage);
      results.push(googleResult);
    }

    // Test OpenAI
    if (provider === 'openai' || provider === 'both') {
      const openaiResult = await testOpenAI(customKey, testMessage);
      results.push(openaiResult);
    }

    // Calcular estadísticas generales
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const notConfiguredCount = results.filter(r => r.status === 'not_configured').length;

    return ApiResponses.success({
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount,
        notConfigured: notConfiguredCount,
        allWorking: errorCount === 0 && notConfiguredCount === 0,
      },
      testMessage,
      results,
      timestamp: new Date().toISOString(),
      note: 'Las API keys se muestran parcialmente por seguridad',
    });
  } catch (error) {
    console.error('Error en test de proveedores:', error);
    return ApiResponses.internalError(
      error instanceof Error ? error.message : 'Error desconocido en test de proveedores'
    );
  }
}

/**
 * Obtener información de configuración de proveedores sin hacer requests
 */
async function getProvidersInfoHandler(_req: NextRequest) {
  try {
    const googleConfigured = !!process.env['GOOGLE_API_KEY'];
    const openaiConfigured = !!process.env['OPENAI_API_KEY'];

    const googleKeyPreview = googleConfigured
      ? `${process.env['GOOGLE_API_KEY']?.substring(0, 8)}...${process.env['GOOGLE_API_KEY']?.slice(-4)}`
      : 'No configurada';

    const openaiKeyPreview = openaiConfigured
      ? `${process.env['OPENAI_API_KEY']?.substring(0, 8)}...${process.env['OPENAI_API_KEY']?.slice(-4)}`
      : 'No configurada';

    return ApiResponses.success({
      providers: {
        google: {
          name: 'Google Gemini AI',
          configured: googleConfigured,
          keyPreview: googleKeyPreview,
          envVar: 'GOOGLE_API_KEY',
          models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest'],
          status: googleConfigured ? 'configured' : 'missing',
        },
        openai: {
          name: 'OpenAI GPT',
          configured: openaiConfigured,
          keyPreview: openaiKeyPreview,
          envVar: 'OPENAI_API_KEY',
          models: ['gpt-3.5-turbo', 'gpt-4', 'text-embedding-3-small'],
          status: openaiConfigured ? 'configured' : 'missing',
        },
      },
      summary: {
        totalProviders: 2,
        configured: [googleConfigured, openaiConfigured].filter(Boolean).length,
        missing: [googleConfigured, openaiConfigured].filter(x => !x).length,
        allConfigured: googleConfigured && openaiConfigured,
      },
      recommendations: getConfigurationRecommendations(googleConfigured, openaiConfigured),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error obteniendo info de proveedores:', error);
    return ApiResponses.internalError('Error obteniendo información de proveedores');
  }
}

/**
 * Test específico para Google AI
 */
async function testGoogleAI(customKey?: string, testMessage?: string): Promise<ProviderTestResult> {
  const startTime = Date.now();
  const apiKey = customKey || process.env['GOOGLE_API_KEY'];

  if (!apiKey) {
    return {
      provider: 'Google Gemini',
      status: 'not_configured',
      configured: false,
      keyVisible: 'No configurada',
      error: 'GOOGLE_API_KEY no está configurada en las variables de entorno',
    };
  }

  try {
    // Usar directamente la API REST v1beta en lugar del SDK
    const modelName = 'models/gemini-2.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: testMessage || 'Responde solo con "OK" si recibes este mensaje'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
    const responseTime = Date.now() - startTime;

    return {
      provider: 'Google Gemini',
      status: 'success',
      configured: true,
      keyVisible: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      response: text,
      responseTime,
      details: {
        model: modelName,
        apiVersion: 'v1beta',
        tokensUsed: 'No disponible en respuesta',
        finishReason: data.candidates?.[0]?.finishReason || 'unknown',
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      provider: 'Google Gemini',
      status: 'error',
      configured: true,
      keyVisible: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      error: error.message || 'Error desconocido con Google AI',
      responseTime,
      details: {
        errorType: error.constructor.name,
        statusCode: error.status || 'unknown',
      },
    };
  }
}

/**
 * Test específico para OpenAI
 */
async function testOpenAI(customKey?: string, testMessage?: string): Promise<ProviderTestResult> {
  const startTime = Date.now();
  const apiKey = customKey || process.env['OPENAI_API_KEY'];

  if (!apiKey) {
    return {
      provider: 'OpenAI GPT',
      status: 'not_configured',
      configured: false,
      keyVisible: 'No configurada',
      error: 'OPENAI_API_KEY no está configurada en las variables de entorno',
    };
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: testMessage || 'Responde solo con "OK" si recibes este mensaje',
        },
      ],
      model: 'gpt-3.5-turbo',
      max_tokens: 50,
    });

    const responseTime = Date.now() - startTime;
    const message = completion.choices[0]?.message?.content || 'Sin respuesta';

    return {
      provider: 'OpenAI GPT',
      status: 'success',
      configured: true,
      keyVisible: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      response: message,
      responseTime,
      details: {
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0,
        finishReason: completion.choices[0]?.finish_reason || 'unknown',
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      provider: 'OpenAI GPT',
      status: 'error',
      configured: true,
      keyVisible: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      error: error.message || 'Error desconocido con OpenAI',
      responseTime,
      details: {
        errorType: error.constructor.name,
        statusCode: error.status || 'unknown',
      },
    };
  }
}

/**
 * Generar recomendaciones de configuración
 */
function getConfigurationRecommendations(
  googleConfigured: boolean,
  openaiConfigured: boolean
): string[] {
  const recommendations: string[] = [];

  if (!googleConfigured) {
    recommendations.push(
      'Configura GOOGLE_API_KEY: Obtén una clave en https://aistudio.google.com/'
    );
  }

  if (!openaiConfigured) {
    recommendations.push(
      'Configura OPENAI_API_KEY: Obtén una clave en https://platform.openai.com/api-keys'
    );
  }

  if (!googleConfigured && !openaiConfigured) {
    recommendations.push(
      'Se recomienda configurar al menos un proveedor para que funcionen los agentes de IA'
    );
  }

  if (googleConfigured && openaiConfigured) {
    recommendations.push(
      '¡Excelente! Tienes ambos proveedores configurados para máxima redundancia'
    );
  }

  return recommendations;
}

// POST - Probar API keys de proveedores
export const POST = testProvidersHandler;

// GET - Obtener información de configuración
export const GET = getProvidersInfoHandler;
