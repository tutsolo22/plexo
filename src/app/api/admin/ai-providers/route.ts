import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponses } from '@/lib/api/response-builder';
import { validateTenantSession } from '@/lib/utils';
import crypto from 'crypto';

const ENCRYPTION_KEY = (process.env['ENCRYPTION_KEY'] as string) || 'your-encryption-key-32-chars-long!';

// Validar que sea admin
async function validateAdmin(session: any) {
  if (!session?.user) return false;
  return ['SUPER_ADMIN', 'TENANT_ADMIN'].includes(session.user.role);
}

// Encriptar API key
function encryptApiKey(apiKey: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Desencriptar API key
function decryptApiKey(encrypted: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const createConfigSchema = z.object({
  provider: z.enum(['openai', 'google', 'anthropic', 'cohere']),
  apiKey: z.string().min(10, 'API Key debe tener al menos 10 caracteres'),
});

// GET /api/admin/ai-providers - Listar configuraciones de AI
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const tenantValidation = validateTenantSession(session);
    if (tenantValidation) return tenantValidation;

    if (!(await validateAdmin(session))) {
      return ApiResponses.forbidden('No tienes permisos para ver configuraciones de AI');
    }

    const tenantId = session?.user?.tenantId;
    if (!tenantId) {
      return ApiResponses.forbidden('No tenant asignado');
    }

    const configs = await prisma.aiProviderConfig.findMany({
      where: { tenantId },
      select: {
        id: true,
        provider: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ApiResponses.success(configs);
  } catch (error) {
    console.error('Error al obtener configuraciones de AI:', error);
    return ApiResponses.internalError('Error al obtener configuraciones');
  }
}

// POST /api/admin/ai-providers - Crear o actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const tenantValidation = validateTenantSession(session);
    if (tenantValidation) return tenantValidation;

    if (!(await validateAdmin(session))) {
      return ApiResponses.forbidden('No tienes permisos para crear configuraciones de AI');
    }

    const tenantId = session?.user?.tenantId;
    if (!tenantId) {
      return ApiResponses.forbidden('No tenant asignado');
    }

    const body = await request.json();
    const validatedData = createConfigSchema.parse(body);

    // Verificar si ya existe
    const existing = await prisma.aiProviderConfig.findFirst({
      where: {
        tenantId,
        provider: validatedData.provider,
      },
    });

    const encryptedKey = encryptApiKey(validatedData.apiKey);

    let config;
    if (existing) {
      // Actualizar
      config = await prisma.aiProviderConfig.update({
        where: { id: existing.id },
        data: {
          apiKey: encryptedKey,
          isActive: true,
        },
        select: {
          id: true,
          provider: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      // Crear
      config = await prisma.aiProviderConfig.create({
        data: {
          tenantId,
          provider: validatedData.provider,
          apiKey: encryptedKey,
          isActive: true,
        },
        select: {
          id: true,
          provider: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return ApiResponses.created(config, `Configuración de ${validatedData.provider} guardada exitosamente`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Datos inválidos';
      return ApiResponses.badRequest(errorMessage);
    }
    console.error('Error al guardar configuración de AI:', error);
    return ApiResponses.internalError('Error al guardar configuración');
  }
}
