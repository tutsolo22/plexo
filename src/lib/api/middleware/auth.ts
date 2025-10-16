import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiResponses } from '../responses';
import { RequestHandler } from './error-handling';

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export function withAuth(allowedRoles?: UserRole[]): (handler: RequestHandler) => RequestHandler {
  return (handler: RequestHandler) => {
    return async (req: NextRequest) => {
      try {
        const session = await auth();
        
        if (!session || !session.user) {
          return ApiResponses.unauthorized('Se requiere autenticación');
        }

        // Verificar roles si se especifican
        if (allowedRoles && allowedRoles.length > 0) {
          const userRole = (session.user as any).role as UserRole;
          
          if (!allowedRoles.includes(userRole)) {
            return ApiResponses.forbidden('No tienes permisos suficientes');
          }
        }

        // Agregar información del usuario a la request
        (req as AuthenticatedRequest).user = {
          id: session.user.id!,
          email: session.user.email!,
          name: session.user.name!,
          role: (session.user as any).role as UserRole,
        };

        return await handler(req);
      } catch (error) {
        console.error('Auth middleware error:', error);
        return ApiResponses.unauthorized('Error de autenticación');
      }
    };
  };
}