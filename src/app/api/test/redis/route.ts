import { NextResponse } from 'next/server';
import { testUpstashConnection } from '@/lib/redis';

export async function GET() {
  try {
    console.log('🔍 Probando conexión a Upstash Redis...');

    const result = await testUpstashConnection();

    if (result.connected) {
      console.log('✅ Conexión exitosa:', result.message);
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          service: result.service,
          timestamp: new Date().toISOString(),
          upstash_url: process.env['UPSTASH_REDIS_REST_URL'] ? 'Configurada' : 'No configurada',
          upstash_token: process.env['UPSTASH_REDIS_REST_TOKEN'] ? 'Configurada' : 'No configurada',
        },
        { status: 200 }
      );
    } else {
      console.error('❌ Error de conexión:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          service: result.service,
          timestamp: new Date().toISOString(),
          upstash_url: process.env['UPSTASH_REDIS_REST_URL'] ? 'Configurada' : 'No configurada',
          upstash_token: process.env['UPSTASH_REDIS_REST_TOKEN'] ? 'Configurada' : 'No configurada',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Error inesperado: ${error}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
