import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para configurar el proveedor de IA preferido
 * El cliente guardará esto en localStorage
 */
export async function POST(req: NextRequest) {
  try {
    const { provider } = await req.json();
    
    if (!provider || !['google', 'openai'].includes(provider)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Proveedor inválido. Use "google" o "openai"' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Proveedor configurado: ${provider}`,
      provider,
      note: 'Esta configuración debe guardarse en el cliente (localStorage)'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error configurando proveedor' 
      },
      { status: 500 }
    );
  }
}

/**
 * Obtener información de proveedores disponibles
 */
export async function GET() {
  const googleConfigured = !!process.env['GOOGLE_API_KEY'];
  const openaiConfigured = !!process.env['OPENAI_API_KEY'];

  return NextResponse.json({
    success: true,
    available: {
      google: googleConfigured,
      openai: openaiConfigured
    },
    recommended: googleConfigured ? 'google' : (openaiConfigured ? 'openai' : null)
  });
}
