import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

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

const SYSTEM_PROMPT = `Eres un asistente AI especializado en gestión de eventos para "Casona María". Tu trabajo es ayudar con consultas sobre eventos, clientes, venues y cotizaciones.

CONTEXTO DE LA EMPRESA:
- Nombre: Casona María
- Especialidad: Gestión integral de eventos
- Servicios: Bodas, eventos corporativos, celebraciones privadas
- Ubicación: Guatemala

DATOS DISPONIBLES:
${JSON.stringify(SAMPLE_DATA, null, 2)}

INSTRUCCIONES PARA RESPONDER:
1. Responde siempre de manera profesional, cálida y útil
2. Usa los datos reales disponibles cuando sea relevante
3. Para búsquedas de eventos, filtra por tipo, fecha, cliente, etc.
4. Para cotizaciones, calcula precios basados en venue, servicios y duración
5. Para análisis de clientes, usa el historial y datos disponibles
6. Formatea las respuestas de manera clara y profesional
7. Incluye emojis para hacer las respuestas más atractivas
8. Siempre ofrece ayuda adicional al final
9. Si no tienes información específica, sé honesto pero ofrece alternativas
10. Usa formato profesional con secciones claras

FORMATO DE RESPUESTA PREFERIDO:
- Saludo inicial
- Información solicitada organizada
- Detalles relevantes
- Recomendaciones si aplica
- Oferta de ayuda adicional

EJEMPLOS DE RESPUESTAS:
- Para búsquedas: Lista los eventos relevantes con detalles
- Para disponibilidad: Verifica fechas y da información del venue
- Para cotizaciones: Calcula precios detallados con subtotales
- Para clientes: Analiza historial y da recomendaciones`;

function getRelevantData(message: string) {
  const msg = message.toLowerCase();
  let relevantData = {};
  
  if (msg.includes('evento') || msg.includes('boda') || msg.includes('event') || msg.includes('celebración')) {
    relevantData = { ...relevantData, events: SAMPLE_DATA.events };
  }
  
  if (msg.includes('cliente') || msg.includes('maría') || msg.includes('carlos') || msg.includes('client') || msg.includes('patricia')) {
    relevantData = { ...relevantData, clients: SAMPLE_DATA.clients };
  }
  
  if (msg.includes('venue') || msg.includes('salón') || msg.includes('jardín') || msg.includes('espacio') || msg.includes('disponib') || msg.includes('lugar')) {
    relevantData = { ...relevantData, venues: SAMPLE_DATA.venues };
  }
  
  if (msg.includes('cotiz') || msg.includes('precio') || msg.includes('quote') || msg.includes('costo') || msg.includes('presupuesto')) {
    relevantData = { ...relevantData, venues: SAMPLE_DATA.venues, events: SAMPLE_DATA.events };
  }
  
  return relevantData;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, model } = body;
    
    if (!message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El mensaje es requerido' 
        },
        { status: 400 }
      );
    }

    // Verificar API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key de Google AI no configurada',
          message: 'La API key de Google AI no está configurada correctamente'
        },
        { status: 500 }
      );
    }

    // Obtener datos relevantes basados en el mensaje
    const relevantData = getRelevantData(message);
    
    // Crear el prompt con datos contextuales
    const contextualPrompt = `${SYSTEM_PROMPT}

DATOS RELEVANTES PARA ESTA CONSULTA:
${JSON.stringify(relevantData, null, 2)}

CONSULTA DEL USUARIO: ${message}

Por favor responde de manera profesional y útil basándote en los datos disponibles.`;

    // Obtener el modelo Gemini (usando el modelo seleccionado o por defecto)
    const selectedModel = model || "gemini-pro";
    const geminiModel = genAI.getGenerativeModel({ model: selectedModel });

    // Llamar a Google AI
    const result = await geminiModel.generateContent(contextualPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse || 'Lo siento, no pude procesar tu consulta.',
        conversationId: sessionId || `gemini-ai-${Date.now()}`,
        platform: 'web',
        metadata: {
          model: selectedModel,
          timestamp: new Date().toISOString(),
          provider: 'Google AI',
          relevantDataTypes: Object.keys(relevantData)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en Google AI:', error);
    
    // Error específico de Google AI
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('API key')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error de configuración de Google AI',
            message: 'La API key de Google AI no está configurada correctamente'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('not supported')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Modelo no disponible',
            message: 'El modelo de IA solicitado no está disponible'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Límite de API alcanzado',
            message: 'Se ha alcanzado el límite de la API de Google AI'
          },
          { status: 429 }
        );
      }
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