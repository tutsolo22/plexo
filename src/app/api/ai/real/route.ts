import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Datos de ejemplo que ya tienes en la base de datos
const SAMPLE_DATA = {
  events: [
    {
      id: "1",
      name: "Boda García-López",
      date: "2024-10-02",
      client: "Patricia García",
      venue: "Salón Principal",
      guests: 140,
      status: "Completado",
      total: 15750,
      services: ["Decoración", "DJ", "Fotografía", "Catering"]
    },
    {
      id: "2", 
      name: "Lanzamiento App TechCorp",
      date: "2024-09-15",
      client: "Tecnológica Innovar",
      venue: "Jardín Terraza",
      guests: 80,
      status: "Completado",
      total: 8500,
      services: ["Catering cocktail", "Sonido profesional", "Streaming en vivo"]
    },
    {
      id: "3",
      name: "Boda Méndez-Torres",
      date: "2025-02-14",
      client: "Carlos Méndez",
      venue: "Salón Principal", 
      guests: 120,
      status: "Confirmado",
      total: 12500,
      services: ["Decoración romántica", "Música en vivo", "Fotografía"]
    }
  ],
  clients: [
    {
      id: "1",
      name: "María González",
      email: "maria.gonzalez@constructora-gonzalez.com",
      company: "Constructora González S.A.",
      type: "Corporativo",
      events: 4,
      totalSpent: 28750,
      notes: "Cliente Premium - Paga puntualmente. Siempre solicita valet parking."
    },
    {
      id: "2",
      name: "Carlos Méndez", 
      email: "carlos.mendez@email.com",
      company: null,
      type: "Individual",
      events: 1,
      totalSpent: 12500,
      notes: "Boda San Valentín. Preferencia por decoración romántica en tonos rosas."
    }
  ],
  venues: [
    {
      id: "1",
      name: "Salón Principal",
      capacity: 150,
      pricePerHour: 500,
      amenities: ["Aire acondicionado", "Sistema de sonido", "Iluminación LED", "Proyector"],
      location: "Planta principal",
      size: "200 m²"
    },
    {
      id: "2",
      name: "Jardín Terraza",
      capacity: 100, 
      pricePerHour: 400,
      amenities: ["Vista panorámica", "Jardín natural", "Pérgola", "Iluminación exterior"],
      location: "Terraza superior",
      size: "300 m²"
    },
    {
      id: "3",
      name: "Salón Ejecutivo",
      capacity: 50,
      pricePerHour: 300,
      amenities: ["Mesa boardroom", "Proyector 4K", "WiFi empresarial", "Catering ejecutivo"],
      location: "Segundo piso", 
      size: "80 m²"
    }
  ]
};

// SYSTEM_PROMPT será construido en tiempo de ejecución para evitar work en build-time
function buildSystemPrompt() {
  return `Eres un asistente AI especializado en gestión de eventos para "Casona María". Tu trabajo es ayudar con consultas sobre eventos, clientes, venues y cotizaciones.\n\nDATOS DISPONIBLES:\n${JSON.stringify(
    SAMPLE_DATA,
    null,
    2
  )}\n\nINSTRUCCIONES:\n1. Responde siempre de manera profesional y útil\n2. Usa los datos reales disponibles cuando sea relevante\n3. Para búsquedas de eventos, filtra por tipo, fecha, cliente, etc.\n4. Para cotizaciones, calcula precios basados en venue, servicios y duración\n5. Para análisis de clientes, usa el historial y datos disponibles\n6. Formatea las respuestas de manera clara y profesional\n7. Incluye emojis para hacer las respuestas más atractivas\n8. Siempre ofrece ayuda adicional al final\n\nEJEMPLOS DE RESPUESTAS:\n- Para búsquedas: Lista los eventos relevantes con detalles\n- Para disponibilidad: Verifica fechas y da información del venue\n- Para cotizaciones: Calcula precios detallados con subtotales\n- Para clientes: Analiza historial y da recomendaciones`;
  }

function getRelevantData(message: string) {
  const msg = message.toLowerCase();
  let relevantData = {};
  
  if (msg.includes('evento') || msg.includes('boda') || msg.includes('event')) {
    relevantData = { ...relevantData, events: SAMPLE_DATA.events };
  }
  
  if (msg.includes('cliente') || msg.includes('maría') || msg.includes('carlos') || msg.includes('client')) {
    relevantData = { ...relevantData, clients: SAMPLE_DATA.clients };
  }
  
  if (msg.includes('venue') || msg.includes('salón') || msg.includes('jardín') || msg.includes('espacio') || msg.includes('disponib')) {
    relevantData = { ...relevantData, venues: SAMPLE_DATA.venues };
  }
  
  if (msg.includes('cotiz') || msg.includes('precio') || msg.includes('quote') || msg.includes('costo')) {
    relevantData = { ...relevantData, venues: SAMPLE_DATA.venues, events: SAMPLE_DATA.events };
  }
  
  return relevantData;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, history } = body;
    
    if (!message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El mensaje es requerido' 
        },
        { status: 400 }
      );
    }

    // Obtener datos relevantes basados en el mensaje
    const relevantData = getRelevantData(message);
    
    // Crear cliente OpenAI en tiempo de ejecución (evitar usar variables/creación en módulo)
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

    // Crear el prompt con datos contextuales
    const systemPrompt = buildSystemPrompt();
    const contextualPrompt = `${systemPrompt}\n\nDATOS RELEVANTES PARA ESTA CONSULTA:\n${JSON.stringify(
      relevantData,
      null,
      2
    )}`;

    // Construir array de mensajes incluyendo historial si está presente
    const messagesForAPI: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: contextualPrompt,
      }
    ];

    // Añadir historial previo si existe (últimos mensajes para mantener contexto)
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messagesForAPI.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Añadir el mensaje actual del usuario si no está ya en el historial
    const lastMessage = history && history.length > 0 ? history[history.length - 1] : null;
    if (!lastMessage || lastMessage.content !== message) {
      messagesForAPI.push({
        role: 'user',
        content: message,
      });
    }

    // Llamar a OpenAI con el historial completo
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesForAPI,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = response.choices[0]?.message?.content;

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse || 'Lo siento, no pude procesar tu consulta.',
        conversationId: sessionId || `real-ai-${Date.now()}`,
        platform: 'web',
        metadata: {
          model: 'gpt-4o-mini',
          timestamp: new Date().toISOString(),
          tokensUsed: response.usage?.total_tokens || 0,
          relevantDataTypes: Object.keys(relevantData),
          historyLength: history ? history.length : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error en AI real:', error);
    
    // Error específico de OpenAI
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error de configuración de OpenAI',
          message: 'La API key de OpenAI no está configurada correctamente'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'Error procesando la consulta con IA',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
