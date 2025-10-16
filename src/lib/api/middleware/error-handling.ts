import { NextRequest, NextResponse } from 'next/server';
import { ApiResponses } from '../responses';

export type RequestHandler = (req: NextRequest) => Promise<NextResponse>;

export function withErrorHandling(handler: RequestHandler): RequestHandler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);
      
      // Manejar errores específicos
      if (error instanceof Error) {
        if (error.message.includes('UNAUTHORIZED')) {
          return ApiResponses.unauthorized();
        }
        
        if (error.message.includes('FORBIDDEN')) {
          return ApiResponses.forbidden();
        }
        
        if (error.message.includes('NOT_FOUND')) {
          return ApiResponses.notFound();
        }
        
        if (error.message.includes('BAD_REQUEST')) {
          return ApiResponses.badRequest(error.message);
        }
      }
      
      return ApiResponses.internalError(
        'Error interno del servidor',
        process.env.NODE_ENV === 'development' ? error : undefined
      );
    }
  };
}