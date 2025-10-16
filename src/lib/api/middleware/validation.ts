import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { ApiResponses } from '../responses';
import { RequestHandler } from './error-handling';

export function withValidation(schema: ZodSchema): (handler: RequestHandler) => RequestHandler {
  return (handler: RequestHandler) => {
    return async (req: NextRequest) => {
      try {
        // Solo validar para métodos que tienen body
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const body = await req.json();
          const validatedData = schema.parse(body);
          
          // Agregar datos validados a la request
          (req as any).validatedData = validatedData;
        }

        return await handler(req);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return ApiResponses.badRequest(
            'Datos de entrada inválidos',
            error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            }))
          );
        }

        // Re-lanzar otros errores para que los maneje el error handler
        throw error;
      }
    };
  };
}