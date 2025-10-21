import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { whatsappAgentService } from '@/lib/ai/whatsapp-agent';

// Función para validar API key
async function validateApiKey(apiKey: string) {
  const widgetApiKey = await prisma.widgetApiKey.findFirst({
    where: {
      apiKey: apiKey,
      isActive: true,
    },
    include: {
      tenant: true,
    },
  });

  if (!widgetApiKey) {
    throw new Error('API key inválida');
  }

  return widgetApiKey;
}

// Función para obtener o crear conversación
async function getOrCreateConversation(
  widgetApiKeyId: string,
  sessionId: string,
  userData?: any
) {
  let conversation = await prisma.widgetConversation.findFirst({
    where: {
      widgetApiKeyId: widgetApiKeyId,
      sessionId: sessionId,
      status: 'active',
    },
  });

  if (!conversation) {
    conversation = await prisma.widgetConversation.create({
      data: {
        widgetApiKeyId: widgetApiKeyId,
        sessionId: sessionId,
        userId: userData?.userId,
        userName: userData?.userName,
        userEmail: userData?.userEmail,
        userPhone: userData?.userPhone,
        userAgent: userData?.userAgent,
        ipAddress: userData?.ipAddress,
        referrer: userData?.referrer,
      },
    });
  }

  return conversation;
}

// GET - Obtener mensajes de una conversación
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const apiKey = headersList.get('x-api-key') || request.nextUrl.searchParams.get('api_key');
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!apiKey || !sessionId) {
      return NextResponse.json(
        { error: 'API key y session_id requeridos' },
        { status: 400 }
      );
    }

    const widgetApiKey = await validateApiKey(apiKey);

    const conversation = await prisma.widgetConversation.findFirst({
      where: {
        widgetApiKeyId: widgetApiKey.id,
        sessionId: sessionId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    // Formatear mensajes para el frontend
    const messages = conversation.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      type: msg.messageType,
      direction: msg.direction,
      status: msg.status,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      fileType: msg.fileType,
      fileUrl: msg.fileUrl,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({
      conversationId: conversation.id,
      messages: messages,
      status: conversation.status,
      isOnline: conversation.isOnline,
    });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Enviar mensaje
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, sessionId, userData, messageType = 'text' } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Mensaje y session_id requeridos' },
        { status: 400 }
      );
    }

    const widgetApiKey = await validateApiKey(apiKey);

    // Obtener o crear conversación
    const conversation = await getOrCreateConversation(
      widgetApiKey.id,
      sessionId,
      userData
    );

    // Guardar mensaje del usuario
    const userMessage = await prisma.widgetMessage.create({
      data: {
        conversationId: conversation.id,
        content: message,
        messageType: messageType,
        direction: 'inbound',
        status: 'delivered',
      },
    });

    // Actualizar estadísticas de conversación
    await prisma.widgetConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    });

    // Procesar mensaje con el agente de WhatsApp
    let botResponse = 'Gracias por tu mensaje. Un agente te contactará pronto.';

    try {
      // Crear contexto para el agente
      const context = {
        phone: `widget_${conversation.sessionId}`,
        tenantId: widgetApiKey.tenantId,
        message: message,
        conversationId: conversation.id,
      };

      // Obtener respuesta del agente
      const agentResponse = await whatsappAgentService.processWidgetMessage(context);
      botResponse = agentResponse.message;

    } catch (agentError) {
      console.error('Error procesando mensaje con agente:', agentError);
      // Mantener respuesta por defecto
    }

    // Guardar respuesta del bot
    const botMessage = await prisma.widgetMessage.create({
      data: {
        conversationId: conversation.id,
        content: botResponse,
        messageType: 'text',
        direction: 'outbound',
        status: 'sent',
      },
    });

    // Actualizar estadísticas nuevamente
    await prisma.widgetConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      userMessage: {
        id: userMessage.id,
        content: userMessage.content,
        type: userMessage.messageType,
        direction: userMessage.direction,
        status: userMessage.status,
        createdAt: userMessage.createdAt,
      },
      botMessage: {
        id: botMessage.id,
        content: botMessage.content,
        type: botMessage.messageType,
        direction: botMessage.direction,
        status: botMessage.status,
        createdAt: botMessage.createdAt,
      },
      conversationId: conversation.id,
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}