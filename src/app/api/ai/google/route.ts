import { NextRequest, NextResponse } from 'next/server';

// IMPORTANT: Este endpoint requiere configurar GOOGLE_API_KEY en las variables de entorno
// Obtener tu API key en: https://makersuite.google.com/app/apikey

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, history } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El prompt es requerido' 
        },
        { status: 400 }
      );
    }

    // Verificar que la API key esté configurada
    const apiKey = process.env['GOOGLE_API_KEY'];
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google API Key no configurada',
          message: 'Por favor configura GOOGLE_API_KEY en las variables de entorno'
        },
        { status: 500 }
      );
    }

    // Usar el modelo configurado o el modelo por defecto (Gemini 2.5 Flash)
    let modelName = process.env['GOOGLE_AI_MODEL'] || 'gemini-2.5-flash';
    
    // Asegurar que tenga el prefijo 'models/'
    if (!modelName.startsWith('models/')) {
      modelName = `models/${modelName}`;
    }

    // Construir el contexto con el historial si existe
    let fullPrompt = '';
    
    if (history && Array.isArray(history) && history.length > 0) {
      // Incluir historial de conversación para mantener contexto
      fullPrompt = 'Historial de conversación:\n\n';
      history.forEach((msg: any) => {
        const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
        fullPrompt += `${role}: ${msg.content}\n\n`;
      });
      fullPrompt += `\nNueva consulta del usuario: ${prompt}`;
    } else {
      fullPrompt = prompt;
    }

    // Añadir contexto del sistema (opcional - puedes personalizarlo según tu caso de uso)
    const systemContext = `Eres un asistente AI especializado en gestión de eventos para "Plexo". 
Tu trabajo es ayudar con consultas sobre eventos, clientes, venues y cotizaciones.
Responde de manera profesional, útil y concisa.`;

    const finalPrompt = `${systemContext}\n\n${fullPrompt}`;

    // Llamar directamente a la API REST de Google (usando v1beta que soporta Gemini)
    // El modelo ya incluye el prefijo 'models/'
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
                text: finalPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar respuesta';

    return NextResponse.json({
      success: true,
      data: {
        message: text || 'Lo siento, no pude generar una respuesta.',
        conversationId: `google-ai-${Date.now()}`,
        platform: 'web',
        metadata: {
          model: modelName,
          timestamp: new Date().toISOString(),
          provider: 'google',
          historyLength: history ? history.length : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error en Google AI:', error);
    
    // Error específico de Google AI
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error de configuración de Google AI',
            message: 'La API key de Google no está configurada correctamente'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Límite de uso alcanzado',
            message: 'Se ha excedido la cuota de la API de Google AI'
          },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: 'Error procesando la consulta con Google AI',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
