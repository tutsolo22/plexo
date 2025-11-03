import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Session } from "next-auth"
import { ApiResponses } from "./api/responses"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Obtiene el tenantId de la sesión, validando que no sea null
 * SUPER_ADMIN puede tener tenantId null, pero debería ser manejado en controladores específicos
 */
export function getTenantIdFromSession(session: Session | null) {
  if (!session?.user?.tenantId) {
    return null;
  }
  return session.user.tenantId;
}

/**
 * Valida que la sesión sea válida y tenga tenantId
 * Útil para endpoints que requieren tenant específico
 */
export function validateTenantSession(session: Session | null) {
  if (!session?.user) {
    return ApiResponses.unauthorized('No autenticado');
  }
  
  if (!session.user.tenantId) {
    return ApiResponses.forbidden('No tienes un tenant asignado');
  }
  
  return null;
}
