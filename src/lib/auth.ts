/**
 * Funciones de utilidad para autenticación y manejo de contraseñas
 * CRM Casona María
 */

import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Re-export de la configuración de auth para compatibilidad
export { authOptions } from './auth/config'