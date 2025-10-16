'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

/**
 * Componente del formulario de login que maneja searchParams
 */
function LoginForm() {
  const { status, data: sessionData } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<{ message: string; isUnverified?: boolean } | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')

  // Mapeo de errores de NextAuth a mensajes legibles
  const getErrorMessage = (error: string | null) => {
    if (!error) return ''
    
    const errorMessages: { [key: string]: string } = {
      'Signin': 'Ocurrió un error durante el inicio de sesión',
      'OAuthSignin': 'Error al iniciar sesión con el proveedor externo',
      'OAuthCallback': 'Error en la respuesta del proveedor externo',
      'OAuthCreateAccount': 'No se pudo crear la cuenta con el proveedor externo',
      'EmailCreateAccount': 'No se pudo crear la cuenta con email',
      'Callback': 'Error en el callback de autenticación',
      'OAuthAccountNotLinked': 'Esta cuenta ya está vinculada a otro método de login',
      'EmailSignin': 'Error al enviar el email de verificación',
      'CredentialsSignin': 'Credenciales inválidas. Verifica tu email y contraseña.',
      'SessionRequired': 'Debes iniciar sesión para acceder a esta página',
      'Configuration': 'Error de configuración del servidor'
    }
    
    return errorMessages[error] || 'Ocurrió un error inesperado'
  }

  /**
   * Maneja el envío del formulario de login
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!email.trim()) {
      setError({ message: 'El email es requerido' })
      return
    }
    
    if (!password.trim()) {
      setError({ message: 'La contraseña es requerida' })
      return
    }
    
    if (password.length < 8) {
      setError({ message: 'La contraseña debe tener al menos 8 caracteres' })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Intentar inicio de sesión con NextAuth
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: password,
        redirect: false // No redirigir automáticamente
      })

      if (result?.error) {
        if (result.error === 'Debes verificar tu email antes de iniciar sesión') {
          setError({ message: result.error, isUnverified: true });
          return;
        }
        // Manejar errores específicos de la autenticación
        setError({ message: result.error })
      } else if (result?.ok) {
        // Redirección inmediata para evitar quedarse en login mientras la sesión se propaga
        router.push(callbackUrl)

        // Login exitoso - refinar redirección cuando la sesión esté disponible
        const session = await getSession()
        if (session?.user) {
          // Forzar cambio de contraseña si aplica
          if ((session.user as any).mustChangePassword) {
            router.replace('/auth/change-password')
            return
          }
          // Verificar email (excepto SUPER_ADMIN)
          if (!session.user.emailVerified && session.user.role !== 'SUPER_ADMIN') {
            router.replace('/auth/verify-email')
            return
          }

          // Redirigir según el rol
          const roleRedirects = {
            SUPER_ADMIN: '/dashboard/users',
            TENANT_ADMIN: '/admin/tenant',
            MANAGER: '/dashboard',
            USER: '/dashboard',
            CLIENT_EXTERNAL: '/client-portal',
          } as const

          const redirectUrl = roleRedirects[(session.user.role as keyof typeof roleRedirects) ?? 'USER'] || '/dashboard'
          router.replace(redirectUrl)
        }
      } else {
        setError({ message: 'Error inesperado durante el inicio de sesión' })
      }
    } catch (error) {
      console.error('Error en login:', error)
      setError({ message: 'Error de conexión. Inténtalo de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">CM</span>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription>
              Accede a tu cuenta de Casona María
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Mostrar errores de URL params o del formulario */}
          {(errorParam || error) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message || getErrorMessage(errorParam)}
                {error?.isUnverified && (
                  <a href="/auth/resend-activation" className="underline ml-2">
                    Reenviar correo de activación
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                className="w-full"
              />
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                  className="w-full pr-10"
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Botón de Iniciar Sesión */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Enlaces adicionales */}
          <div className="mt-6 space-y-2 text-center text-sm">
            <Link 
              href="/auth/forgot-password" 
              className="text-primary hover:underline block"
            >
              ¿Olvidaste tu contraseña?
            </Link>
            
            <div className="text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-primary hover:underline">
                Regístrate aquí
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Página de inicio de sesión para CRM Casona María
 * 
 * Características:
 * - Formulario de login con validación
 * - Manejo de errores de autenticación
 * - Redirección automática después del login
 * - Mostrar/ocultar contraseña
 * - Integración completa con NextAuth.js
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}