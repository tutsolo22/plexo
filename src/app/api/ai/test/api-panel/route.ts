import { NextRequest } from 'next/server';
import { ApiResponses } from '@/lib/api/responses';

/**
 * Panel de verificación simplificado - muestra el estado y permite testing básico
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
      title: 'Panel de Verificación de API Keys',
      description: 'Estado actual de las claves de API configuradas',
      providers: [
        {
          name: 'Google Gemini AI',
          configured: googleConfigured,
          keyPreview: googleKeyPreview,
          status: googleConfigured ? 'Configurado' : 'No configurado',
          statusColor: googleConfigured ? 'green' : 'red',
          envVar: 'GOOGLE_API_KEY',
          models: ['gemini-1.5-flash', 'gemini-pro'],
          docs: 'https://aistudio.google.com/',
          testEndpoint: '/api/ai/test/providers',
          testBody: {
            provider: 'google',
            testMessage: 'Hola, esto es un test',
          },
        },
        {
          name: 'OpenAI GPT',
          configured: openaiConfigured,
          keyPreview: openaiKeyPreview,
          status: openaiConfigured ? 'Configurado' : 'No configurado',
          statusColor: openaiConfigured ? 'green' : 'red',
          envVar: 'OPENAI_API_KEY',
          models: ['gpt-3.5-turbo', 'gpt-4', 'text-embedding-3-small'],
          docs: 'https://platform.openai.com/api-keys',
          testEndpoint: '/api/ai/test/providers',
          testBody: {
            provider: 'openai',
            testMessage: 'Hola, esto es un test',
          },
        },
      ],
      summary: {
        total: 2,
        configured: [googleConfigured, openaiConfigured].filter(Boolean).length,
        missing: [googleConfigured, openaiConfigured].filter(x => !x).length,
        allConfigured: googleConfigured && openaiConfigured,
        status:
          googleConfigured && openaiConfigured
            ? 'Todo configurado'
            : googleConfigured || openaiConfigured
              ? 'Parcialmente configurado'
              : 'Sin configurar',
      },
      instructions: {
        powershell: {
          testGoogle: `Invoke-WebRequest -Uri "http://localhost:3200/api/ai/test/providers" -Method POST -ContentType "application/json" -Body '{"provider": "google", "testMessage": "Test"}'`,
          testOpenAI: `Invoke-WebRequest -Uri "http://localhost:3200/api/ai/test/providers" -Method POST -ContentType "application/json" -Body '{"provider": "openai", "testMessage": "Test"}'`,
          testBoth: `Invoke-WebRequest -Uri "http://localhost:3200/api/ai/test/providers" -Method POST -ContentType "application/json" -Body '{"provider": "both", "testMessage": "Test"}'`,
        },
        curl: {
          testGoogle: `curl -X POST "http://localhost:3200/api/ai/test/providers" -H "Content-Type: application/json" -d '{"provider": "google", "testMessage": "Test"}'`,
          testOpenAI: `curl -X POST "http://localhost:3200/api/ai/test/providers" -H "Content-Type: application/json" -d '{"provider": "openai", "testMessage": "Test"}'`,
          testBoth: `curl -X POST "http://localhost:3200/api/ai/test/providers" -H "Content-Type: application/json" -d '{"provider": "both", "testMessage": "Test"}'`,
        },
      },
      recommendations: getRecommendations(googleConfigured, openaiConfigured),
      troubleshooting: {
        googleErrors: [
          'Error 404 Not Found: Verificar que el modelo esté disponible',
          'Error 403 Forbidden: Verificar que la API key sea válida',
          'Error 429 Rate Limited: Has excedido la cuota gratuita',
        ],
        openaiErrors: [
          'Error 401 Unauthorized: API key inválida',
          'Error 429 Rate Limited: Has excedido la cuota',
          'Error 503 Service Unavailable: OpenAI está experimentando problemas',
        ],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error en panel de verificación:', error);
    return ApiResponses.internalError('Error cargando panel de verificación');
  }
}

/**
 * Test rápido de conectividad sin hacer llamadas reales a las APIs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'check-config') {
      const googleConfigured = !!process.env['GOOGLE_API_KEY'];
      const openaiConfigured = !!process.env['OPENAI_API_KEY'];

      return ApiResponses.success({
        action: 'Configuration Check',
        results: {
          google: {
            configured: googleConfigured,
            keyLength: googleConfigured ? process.env['GOOGLE_API_KEY']?.length : 0,
            keyPreview: googleConfigured
              ? `${process.env['GOOGLE_API_KEY']?.substring(0, 8)}...${process.env['GOOGLE_API_KEY']?.slice(-4)}`
              : 'Not set',
          },
          openai: {
            configured: openaiConfigured,
            keyLength: openaiConfigured ? process.env['OPENAI_API_KEY']?.length : 0,
            keyPreview: openaiConfigured
              ? `${process.env['OPENAI_API_KEY']?.substring(0, 8)}...${process.env['OPENAI_API_KEY']?.slice(-4)}`
              : 'Not set',
          },
        },
        note: 'Esta es solo una verificación de configuración, no hace llamadas a las APIs',
        nextSteps: [
          'Para probar las APIs reales, usa POST /api/ai/test/providers',
          'Para usar en agentes, los endpoints están en /api/ai/chat',
          'Para probar WhatsApp, usa /api/ai/whatsapp/webhook',
        ],
        timestamp: new Date().toISOString(),
      });
    }

    return ApiResponses.badRequest('Acción no reconocida. Usa action: "check-config"');
  } catch (error) {
    console.error('Error en verificación POST:', error);
    return ApiResponses.internalError('Error en verificación');
  }
}

function getRecommendations(googleConfigured: boolean, openaiConfigured: boolean): string[] {
  const recs: string[] = [];

  if (!googleConfigured) {
    recs.push('🟡 Configura GOOGLE_API_KEY para usar Gemini AI (gratis con límites)');
    recs.push('   Obtén tu clave en: https://aistudio.google.com/');
    recs.push('   Agrega a tu .env: GOOGLE_API_KEY=AIzaSy...');
  }

  if (!openaiConfigured) {
    recs.push('🟡 Configura OPENAI_API_KEY para usar GPT (requiere crédito)');
    recs.push('   Obtén tu clave en: https://platform.openai.com/api-keys');
    recs.push('   Agrega a tu .env: OPENAI_API_KEY=sk-...');
  }

  if (googleConfigured && openaiConfigured) {
    recs.push('✅ ¡Excelente! Tienes ambos proveedores configurados');
    recs.push('   Esto te da redundancia y opciones para diferentes casos de uso');
  } else if (googleConfigured || openaiConfigured) {
    recs.push('⚠️ Solo tienes un proveedor configurado');
    recs.push('   Considera agregar el otro para mayor flexibilidad');
  } else {
    recs.push('❌ No tienes proveedores configurados');
    recs.push('   Los agentes de IA no funcionarán sin al menos una API key');
  }

  recs.push('💡 Reinicia el servidor después de cambiar variables de entorno');

  return recs;
}
