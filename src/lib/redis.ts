/**
 * Configuración y cliente Redis para Cache
 * Sistema de Gestión de Eventos V3
 * 
 * @author Manuel Antonio Tut Solorzano
 * @version 3.0.0
 * @date 2025-10-17
 */

import { createClient, RedisClientType } from 'redis';
import { Redis } from '@upstash/redis';

// Configuración de Redis Local
const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6380';
const REDIS_PASSWORD = process.env['REDIS_PASSWORD'];

// Configuración de Upstash Redis
const UPSTASH_REDIS_REST_URL = process.env['UPSTASH_REDIS_REST_URL'];
const UPSTASH_REDIS_REST_TOKEN = process.env['UPSTASH_REDIS_REST_TOKEN'];

// Clientes Redis globales
let redisClient: RedisClientType | null = null;
let upstashClient: Redis | null = null;

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
 * Crear y configurar cliente Upstash Redis
 */
export function createUpstashClient(): Redis | null {
  if (upstashClient) {
    return upstashClient;
  }

  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    try {
      upstashClient = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('✅ Upstash Redis configurado correctamente');
      return upstashClient;
    } catch (error) {
      console.error('Error configurando Upstash Redis:', error);
      return null;
    }
  } else {
    console.warn('⚠️ Variables de Upstash Redis no configuradas');
    return null;
  }
}

/**
 * Obtener cliente Redis preferido (Upstash primero, luego local)
 */
export function getPreferredRedisClient(): Redis | RedisClientType | null {
  // Priorizar Upstash Redis si está configurado
  const upstash = createUpstashClient();
  if (upstash) {
    console.log('🚀 Usando Upstash Redis');
    return upstash;
  }

  // Fallback a Redis local
  console.log('🔄 Usando Redis local como fallback');
  return null; // Será manejado por getRedisClient() cuando sea necesario
}

/**
 * Función helper para operaciones de cache que soporta ambos tipos de Redis
 */
export async function cacheGet(key: string): Promise<any> {
  try {
    const upstash = createUpstashClient();
    if (upstash) {
      const result = await upstash.get(key);
      return result;
    }

    // Fallback a Redis local
    const localClient = await getRedisClient();
    const result = await localClient.get(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('Error al obtener del cache:', error);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttl?: number): Promise<boolean> {
  try {
    const upstash = createUpstashClient();
    if (upstash) {
      if (ttl) {
        await upstash.setex(key, ttl, JSON.stringify(value));
      } else {
        await upstash.set(key, JSON.stringify(value));
      }
      return true;
    }

    // Fallback a Redis local
    const localClient = await getRedisClient();
    if (ttl) {
      await localClient.setEx(key, ttl, JSON.stringify(value));
    } else {
      await localClient.set(key, JSON.stringify(value));
    }
    return true;
  } catch (error) {
    console.error('Error al guardar en cache:', error);
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  try {
    const upstash = createUpstashClient();
    if (upstash) {
      await upstash.del(key);
      return true;
    }

    // Fallback a Redis local
    const localClient = await getRedisClient();
    await localClient.del(key);
    return true;
  } catch (error) {
    console.error('Error al eliminar del cache:', error);
    return false;
  }
}

/**
 * Función para verificar la conectividad de Upstash Redis
 */
export async function testUpstashConnection() {
  try {
    const client = createUpstashClient();
    if (!client) {
      return { 
        connected: false, 
        error: 'Cliente Upstash Redis no configurado' 
      };
    }
    
    await client.ping();
    return { 
      connected: true, 
      message: 'Conexión a Upstash Redis exitosa',
      service: 'Upstash'
    };
  } catch (error) {
    return { 
      connected: false, 
      error: `Error de conexión Upstash: ${error}`,
      service: 'Upstash'
    };
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