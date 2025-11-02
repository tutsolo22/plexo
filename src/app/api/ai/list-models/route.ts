import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint temporal para listar modelos disponibles en Google AI
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env['GOOGLE_API_KEY'];
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY no configurada' },
        { status: 500 }
      );
    }

    // Listar modelos disponibles
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Error al listar modelos',
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filtrar solo los modelos que soportan generateContent
    const modelsWithGenerate = data.models?.filter((model: any) => 
      model.supportedGenerationMethods?.includes('generateContent')
    );

    return NextResponse.json({
      success: true,
      totalModels: data.models?.length || 0,
      modelsWithGenerateContent: modelsWithGenerate?.length || 0,
      models: modelsWithGenerate?.map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedMethods: model.supportedGenerationMethods,
        inputTokenLimit: model.inputTokenLimit,
        outputTokenLimit: model.outputTokenLimit,
      })) || [],
      allModels: data.models?.map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        supportedMethods: model.supportedGenerationMethods,
      })) || []
    });

  } catch (error) {
    console.error('Error listando modelos:', error);
    return NextResponse.json(
      { 
        error: 'Error interno',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
