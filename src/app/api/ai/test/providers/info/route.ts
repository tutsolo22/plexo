import { NextRequest } from 'next/server';
import { ApiResponses } from '@/lib/api/responses';

/**
 * Endpoint simple para probar las API keys básicamente
 */
export async function GET(_req: NextRequest) {
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
      status: 'API Key Verification Panel',
      providers: {
        google: {
          configured: googleConfigured,
          keyPreview: googleKeyPreview,
          status: googleConfigured ? 'ready' : 'missing',
        },
        openai: {
          configured: openaiConfigured,
          keyPreview: openaiKeyPreview,
          status: openaiConfigured ? 'ready' : 'missing',
        },
      },
      summary: {
        totalProviders: 2,
        configured: [googleConfigured, openaiConfigured].filter(Boolean).length,
        allReady: googleConfigured && openaiConfigured,
      },
      instructions: {
        testEndpoint: '/api/ai/test/providers',
        methods: ['GET (info)', 'POST (test)'],
        examples: {
          testGoogle: {
            method: 'POST',
            body: { provider: 'google', testMessage: 'Hola test' },
          },
          testOpenAI: {
            method: 'POST',
            body: { provider: 'openai', testMessage: 'Hola test' },
          },
          testBoth: {
            method: 'POST',
            body: { provider: 'both', testMessage: 'Hola test' },
          },
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error en verificación de API keys:', error);
    return ApiResponses.internalError('Error verificando API keys');
  }
}
