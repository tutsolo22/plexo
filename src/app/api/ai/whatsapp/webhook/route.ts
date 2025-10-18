import { NextRequest } from 'next/server';
import { agentCoordinator } from '@/lib/ai/agent-coordinator';
import { withErrorHandling } from '@/lib/api/middleware/error-handling';
import { ApiResponses } from '@/lib/api/responses';
import { z } from 'zod';

// Schema de validación para webhook de WhatsApp
const whatsappWebhookSchema = z.object({
  // Estructura típica de webhook de WhatsApp Business API
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.literal('whatsapp'),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string()
        }),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          type: z.enum(['text', 'image', 'document', 'audio', 'video']),
          text: z.object({
            body: z.string()
          }).optional(),
          image: z.object({
            id: z.string(),
            mime_type: z.string(),
            sha256: z.string(),
            caption: z.string().optional()
          }).optional(),
          document: z.object({
            id: z.string(),
            mime_type: z.string(),
            sha256: z.string(),
            filename: z.string().optional(),
            caption: z.string().optional()
          }).optional()
        })).optional(),
        statuses: z.array(z.object({
          id: z.string(),
          status: z.enum(['sent', 'delivered', 'read', 'failed']),
          timestamp: z.string(),
          recipient_id: z.string()
        })).optional()
      }),
      field: z.literal('messages')
    }))
  }))
});

// Schema alternativo para testing directo
const directMessageSchema = z.object({
  from: z.string(),
  body: z.string(),
  tenantId: z.string(),
  type: z.enum(['text', 'image', 'document', 'audio', 'video']).default('text'),
  mediaUrl: z.string().optional()
});

/**
 * Webhook para recibir mensajes de WhatsApp Business API
 * POST /api/ai/whatsapp/webhook
 */
async function whatsappWebhookHandler(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Verificar token de verificación para webhook (GET request)
    const verifyToken = process.env['WHATSAPP_VERIFY_TOKEN'];
    const mode = new URL(req.url).searchParams.get('hub.mode');
    const token = new URL(req.url).searchParams.get('hub.verify_token');
    const challenge = new URL(req.url).searchParams.get('hub.challenge');

    // Verificación inicial del webhook (solo para GET requests, pero manejamos aquí por simplicidad)
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verificado');
      return ApiResponses.success(challenge);
    }

    // Intentar parsear como webhook oficial de WhatsApp
    let messages: any[] = [];
    let tenantId = 'default'; // Se puede obtener del phone_number_id mapeado a tenant

    try {
      const webhookData = whatsappWebhookSchema.parse(body);
      
      // Extraer mensajes de la estructura del webhook
      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            // Mapear phone_number_id a tenantId (esto se haría con una tabla de mapeo)
            tenantId = await mapPhoneNumberToTenant(change.value.metadata.phone_number_id);
            
            for (const message of change.value.messages) {
              messages.push({
                id: message.id,
                from: message.from,
                to: 'assistant',
                body: message.text?.body || message.image?.caption || message.document?.caption || '',
                timestamp: new Date(parseInt(message.timestamp) * 1000),
                type: message.type,
                mediaUrl: message.image?.id || message.document?.id
              });
            }
          }
        }
      }
    } catch (webhookError) {
      // Si falla el parsing como webhook oficial, intentar como mensaje directo (para testing)
      try {
        const directMessage = directMessageSchema.parse(body);
        messages.push({
          id: `msg_${Date.now()}`,
          from: directMessage.from,
          to: 'assistant',
          body: directMessage.body,
          timestamp: new Date(),
          type: directMessage.type,
          mediaUrl: directMessage.mediaUrl
        });
        tenantId = directMessage.tenantId;
      } catch (directError) {
        console.error('Error parsing webhook data:', webhookError, directError);
        return ApiResponses.badRequest('Formato de webhook inválido');
      }
    }

    // Procesar cada mensaje a través del coordinador de agentes
    const responses = [];
    
    for (const message of messages) {
      try {
        // Usar el coordinador para procesar el mensaje
        const coordinatorResponse = await agentCoordinator.processMessage(message, tenantId);
        
        // Enviar respuesta de vuelta por WhatsApp (implementar según proveedor)
        await sendWhatsAppMessage(
          message.from,
          coordinatorResponse.response.message,
          tenantId
        );
        
        responses.push({
          messageId: message.id,
          from: message.from,
          processed: true,
          agent: coordinatorResponse.source,
          escalated: coordinatorResponse.escalated,
          processingTime: coordinatorResponse.metadata.processingTime
        });
        
      } catch (error) {
        console.error(`Error procesando mensaje ${message.id}:`, error);
        
        // Enviar mensaje de error al usuario
        await sendWhatsAppMessage(
          message.from,
          'Lo siento, estoy experimentando dificultades técnicas. Por favor intenta de nuevo en unos momentos.',
          tenantId
        );
        
        responses.push({
          messageId: message.id,
          from: message.from,
          processed: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return ApiResponses.success({
      processed: responses.length,
      responses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en webhook de WhatsApp:', error);
    return ApiResponses.internalError('Error procesando webhook');
  }
}

/**
 * Verificación del webhook de WhatsApp (GET request)
 */
async function whatsappVerificationHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env['WHATSAPP_VERIFY_TOKEN'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WhatsApp webhook verificado correctamente');
    return ApiResponses.success(challenge);
  }

  console.log('Verificación de webhook fallida:', { mode, token, verifyToken });
  return ApiResponses.forbidden('Token de verificación inválido');
}

/**
 * Mapea un phone_number_id de WhatsApp a un tenantId
 * En producción, esto consultaría una tabla de mapeo
 */
async function mapPhoneNumberToTenant(phoneNumberId: string): Promise<string> {
  // TODO: Implementar mapeo real desde base de datos
  // Por ahora, retornar un tenant por defecto o hacer mapeo hardcoded
  const phoneToTenantMap: Record<string, string> = {
    // Agregar mapeos específicos aquí
    // 'phone_number_id_1': 'tenant_1',
    // 'phone_number_id_2': 'tenant_2',
  };

  return phoneToTenantMap[phoneNumberId] || process.env['DEFAULT_TENANT_ID'] || 'default';
}

/**
 * Envía un mensaje de respuesta por WhatsApp
 * Implementar según el proveedor de WhatsApp API que se use
 */
async function sendWhatsAppMessage(
  to: string,
  message: string,
  tenantId: string
): Promise<void> {
  try {
    // TODO: Implementar envío real según proveedor
    // Ejemplos de proveedores:
    // - WhatsApp Business API oficial
    // - Twilio WhatsApp API
    // - Meta WhatsApp Cloud API
    // - Otros proveedores como Wassenger, ChatAPI, etc.
    
    const whatsappProvider = process.env['WHATSAPP_PROVIDER'] || 'meta';
    
    switch (whatsappProvider) {
      case 'meta':
        await sendMetaWhatsAppMessage(to, message, tenantId);
        break;
      case 'twilio':
        await sendTwilioWhatsAppMessage(to, message, tenantId);
        break;
      default:
        console.log(`[MOCK] Enviando WhatsApp a ${to}: ${message}`);
    }
    
    // Guardar en base de datos para tracking
    // await prisma.botMessage.create({
    //   data: {
    //     tenantId,
    //     phone: to,
    //     direction: 'out',
    //     text: message
    //   }
    // });
    
  } catch (error) {
    console.error('Error enviando mensaje de WhatsApp:', error);
    throw error;
  }
}

/**
 * Implementación para Meta WhatsApp Cloud API
 */
async function sendMetaWhatsAppMessage(to: string, message: string, tenantId: string) {
  const accessToken = process.env['WHATSAPP_ACCESS_TOKEN'];
  const phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID'];
  
  if (!accessToken || !phoneNumberId) {
    throw new Error('Configuración de Meta WhatsApp faltante');
  }

  const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error enviando mensaje Meta WhatsApp: ${error}`);
  }
}

/**
 * Implementación para Twilio WhatsApp API
 */
async function sendTwilioWhatsAppMessage(to: string, message: string, tenantId: string) {
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken = process.env['TWILIO_AUTH_TOKEN'];
  const fromNumber = process.env['TWILIO_WHATSAPP_NUMBER'];
  
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Configuración de Twilio WhatsApp faltante');
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${to}`,
      Body: message
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error enviando mensaje Twilio WhatsApp: ${error}`);
  }
}

// POST - Webhook para recibir mensajes
export const POST = withErrorHandling(whatsappWebhookHandler);

// GET - Verificación del webhook
export const GET = withErrorHandling(whatsappVerificationHandler);