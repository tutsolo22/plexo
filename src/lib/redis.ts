/**
 * Configuración y cliente Redis para Cache
 * Sistema de Gestión de Eventos V3
 * 
 * @author Manuel Antonio Tut Solorzano
 * @version 3.0.0
 * @date 2025-10-17
 */

import { createClient, RedisClientType } from 'redis';

// Configuración de Redis
const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6380';
const REDIS_PASSWORD = process.env['REDIS_PASSWORD'];

// Cliente Redis global
let redisClient: RedisClientType | null = null;

/**
 * Crear y configurar cliente Redis
 */
export async function createRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    const client = createClient({
      url: REDIS_URL,
      ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
      socket: {
        connectTimeout: 60000,
      },
    });

    // Event listeners para debugging
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis conectado exitosamente');
    });

    client.on('ready', () => {
      console.log('🚀 Redis listo para usar');
    });

    client.on('end', () => {
      console.log('🔴 Redis desconectado');
    });

    await client.connect();
    redisClient = client as any;
    
    return client as any;
  } catch (error) {
    console.error('Error conectando a Redis:', error);
    throw error;
  }
}

/**
 * Obtener cliente Redis existente o crear uno nuevo
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient || !redisClient.isOpen) {
    return await createRedisClient();
  }
  return redisClient;
}

/**
 * Cerrar conexión Redis
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Clase de utilidades para Cache Redis
 */
export class RedisCache {
  private client: RedisClientType | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.client = await getRedisClient();
    } catch (error) {
      console.error('Error inicializando RedisCache:', error);
    }
  }

  /**
   * Obtener valor del cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) await this.init();
      if (!this.client) return null;

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error obteniendo cache para key ${key}:`, error);
      return null;
    }
  }

  /**
   * Establecer valor en cache con TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<boolean> {
    try {
      if (!this.client) await this.init();
      if (!this.client) return false;

      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error estableciendo cache para key ${key}:`, error);
      return false;
    }
  }

  /**
   * Eliminar clave del cache
   */
  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) await this.init();
      if (!this.client) return false;

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Error eliminando cache para key ${key}:`, error);
      return false;
    }
  }

  /**
   * Eliminar múltiples claves que coincidan con un patrón
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      if (!this.client) await this.init();
      if (!this.client) return 0;

      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      const result = await this.client.del(keys);
      return result;
    } catch (error) {
      console.error(`Error eliminando cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Verificar si existe una clave
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) await this.init();
      if (!this.client) return false;

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error verificando existencia para key ${key}:`, error);
      return false;
    }
  }

  /**
   * Incrementar valor numérico
   */
  async incr(key: string): Promise<number> {
    try {
      if (!this.client) await this.init();
      if (!this.client) return 0;

      return await this.client.incr(key);
    } catch (error) {
      console.error(`Error incrementando key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Establecer TTL para una clave existente
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!this.client) await this.init();
      if (!this.client) return false;

      const result = await this.client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error(`Error estableciendo TTL para key ${key}:`, error);
      return false;
    }
  }
}

// Instancia singleton del cache
export const redisCache = new RedisCache();

/**
 * Utilitades para claves de cache
 */
export const CacheKeys = {
  // Analytics Dashboard
  ANALYTICS_DASHBOARD: (period: string, tenantId: string) => 
    `analytics:dashboard:${period}:${tenantId}`,
  
  // Estadísticas de eventos
  EVENTS_STATS: (tenantId: string) => 
    `events:stats:${tenantId}`,
  
  // Notificaciones de usuario
  USER_NOTIFICATIONS: (userId: string) => 
    `notifications:user:${userId}`,
  
  // Lista de clientes
  CLIENTS_LIST: (tenantId: string, page: number, limit: number) => 
    `clients:list:${tenantId}:${page}:${limit}`,
  
  // Datos de cliente específico
  CLIENT_DATA: (clientId: string) => 
    `client:data:${clientId}`,
  
  // Cotizaciones del dashboard
  QUOTES_DASHBOARD: (tenantId: string) => 
    `quotes:dashboard:${tenantId}`,
  
  // Eventos próximos
  UPCOMING_EVENTS: (tenantId: string) => 
    `events:upcoming:${tenantId}`,
  
  // Métricas de email tracking
  EMAIL_STATS: (tenantId: string) => 
    `email:stats:${tenantId}`,
} as const;

/**
 * TTL por defecto en segundos (5 minutos)
 */
export const DEFAULT_TTL = 300;

/**
 * TTL para analytics (15 minutos)
 */
export const ANALYTICS_TTL = 900;

/**
 * TTL para notificaciones (1 minuto)
 */
export const NOTIFICATIONS_TTL = 60;