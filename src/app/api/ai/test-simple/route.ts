import { NextRequest } from 'next/server';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

// Schema simple para testing
const testMessageSchema = z.object({
  message: z.string().min(1, 'El mensaje es requerido'),
  platform: z.enum(['web', 'whatsapp']).default('whatsapp'),
  testMode: z.boolean().default(true)
});

/**
 * Endpoint de test simple que simula el comportamiento de los agentes
 * sin requerir Google AI API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, platform, testMode } = testMessageSchema.parse(body);

    // Simular la lógica del coordinador sin usar Google AI
    let selectedAgent = 'whatsapp-agent';
    let response = '';
    let intent = 'unknown';

    // Lógica simple de detección basada en palabras clave
    const messageLC = message.toLowerCase();
    
    if (messageLC.includes('cliente') || messageLC.includes('cotización') || messageLC.includes('evento') || messageLC.includes('búsqueda')) {
      selectedAgent = 'crm-agent';
      intent = 'business_query';
      response = `[SIMULADO - CRM Agent]: He entendido tu consulta sobre "${message}". En modo real, buscaría en la base de datos de clientes, eventos y cotizaciones para darte información específica.`;
    } else if (messageLC.includes('hola') || messageLC.includes('ayuda') || messageLC.includes('información')) {
      selectedAgent = 'whatsapp-agent';
      intent = 'greeting_or_help';
      response = `[SIMULADO - WhatsApp Agent]: ¡Hola! He recibido tu mensaje: "${message}". En modo real, tendría una conversación más natural y podría escalarte con un humano si necesitas ayuda especializada.`;
    } else {
      selectedAgent = 'whatsapp-agent';
      intent = 'general_conversation';
      response = `[SIMULADO - WhatsApp Agent]: Entiendo tu mensaje sobre "${message}". En modo real, usaría Google AI para generar una respuesta más natural y contextual.`;
    }

    const processingTime = Math.floor(Math.random() * 1000) + 200; // Simular tiempo de procesamiento

    return ApiResponses.success({
      test: {
        originalMessage: message,
        platform,
        testMode: true,
        note: "Este es un test sin Google AI - las respuestas son simuladas"
      },
      response: {
        message: response,
        agent: selectedAgent,
        intent,
        confidence: 0.85,
        escalated: false
      },
      performance: {
        processingTime,
        simulatedProcessing: true
      },
      configuration: {
        googleAiAvailable: !!process.env['GOOGLE_API_KEY'],
        testModeActive: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en test simulado:', error);
    return ApiResponses.internalError(
      error instanceof Error ? error.message : 'Error desconocido en test simulado'
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    return ApiResponses.success({
      message: "Endpoint de test simulado - Listo para recibir mensajes POST",
      availableTests: [
        "Mensaje con 'cliente' o 'cotización' → CRM Agent simulado",
        "Mensaje con 'hola' o 'ayuda' → WhatsApp Agent simulado",
        "Otros mensajes → WhatsApp Agent general"
      ],
      configuration: {
        googleAiRequired: false,
        googleAiConfigured: !!process.env['GOOGLE_API_KEY'],
        status: "ready"
      },
      example: {
        url: "POST /api/ai/test-simple",
        body: {
          message: "Hola, necesito ayuda con mi evento",
          platform: "whatsapp"
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en GET test simulado:', error);
    return ApiResponses.internalError('Error en endpoint GET');
  }
}