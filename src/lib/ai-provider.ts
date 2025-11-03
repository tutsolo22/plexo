import { prisma } from './prisma';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-32-chars-long!';

// Desencriptar API key
function decryptApiKey(encrypted: string): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error desencriptando API key:', error);
    throw new Error('No se pudo desencriptar la API key');
  }
}

/**
 * Obtener API key activa para un proveedor y tenant
 */
export async function getActiveAiProviderKey(
  tenantId: string,
  provider: string
): Promise<string | null> {
  try {
    const config = await prisma.aiProviderConfig.findFirst({
      where: {
        tenantId,
        provider,
        isActive: true,
      },
    });

    if (!config) {
      return null;
    }

    return decryptApiKey(config.apiKey);
  } catch (error) {
    console.error('Error obteniendo API key:', error);
    return null;
  }
}

/**
 * Obtener todas las API keys activas del tenant
 */
export async function getAllActiveAiProviders(tenantId: string) {
  try {
    const configs = await prisma.aiProviderConfig.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      select: {
        provider: true,
        apiKey: true,
      },
    });

    const providers: Record<string, string> = {};

    for (const config of configs) {
      try {
        providers[config.provider] = decryptApiKey(config.apiKey);
      } catch (error) {
        console.error(`Error desencriptando ${config.provider}:`, error);
      }
    }

    return providers;
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    return {};
  }
}

/**
 * Usar API key de OpenAI del tenant (si no hay en BD, fallback a ENV)
 */
export async function getOpenAiKey(tenantId: string): Promise<string | null> {
  const key = await getActiveAiProviderKey(tenantId, 'openai');
  if (key) return key;

  // Fallback a variable de entorno
  return process.env.OPENAI_API_KEY || null;
}

/**
 * Usar API key de Google del tenant (si no hay en BD, fallback a ENV)
 */
export async function getGoogleAiKey(tenantId: string): Promise<string | null> {
  const key = await getActiveAiProviderKey(tenantId, 'google');
  if (key) return key;

  // Fallback a variable de entorno
  return process.env.GOOGLE_API_KEY || null;
}
