# Health Check Endpoint para Gestión de Eventos
# Ruta: /api/health
# Método: GET

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from 'redis';

export async function GET(request: NextRequest) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
      smtp: 'unknown'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };

  try {
    // Verificar conexión a base de datos
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'healthy';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      health.services.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Verificar conexión a Redis (si está configurado)
    if (process.env.REDIS_URL) {
      try {
        const redis = createClient({ url: process.env.REDIS_URL });
        await redis.connect();
        await redis.ping();
        await redis.disconnect();
        health.services.redis = 'healthy';
      } catch (redisError) {
        console.error('Redis health check failed:', redisError);
        health.services.redis = 'unhealthy';
        // Redis es opcional, no marca como degraded
      }
    } else {
      health.services.redis = 'not_configured';
    }

    // Verificar configuración SMTP (básica)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      health.services.smtp = 'configured';
    } else {
      health.services.smtp = 'not_configured';
    }

    // Si la base de datos está unhealthy, marcar como unhealthy
    if (health.services.database === 'unhealthy') {
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 206 : 503;

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: process.uptime()
    }, { status: 503 });
  }
}

// Configuración para health checks
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // 10 segundos máximo