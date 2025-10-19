"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlexoBranding } from "@/components/plexo-branding"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Mensajes de error en español más específicos
        if (result.error === 'CredentialsSignin') {
          setError("Credenciales incorrectas. Verifica tu email y contraseña.")
        } else if (result.error === 'CallbackRouteError') {
          setError("Error en la autenticación. Intenta nuevamente.")
        } else if (result.error === 'AccessDenied') {
          setError("Acceso denegado. No tienes permisos para acceder.")
        } else {
          setError("Error al iniciar sesión. Verifica tus credenciales e intenta nuevamente.")
        }
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("Error de conexión. Verifica tu conexión a internet e intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plexo-light-bg to-plexo-light-bg-secondary dark:from-plexo-dark-bg dark:to-plexo-dark-bg-secondary p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding de Plexo */}
        <div className="text-center">
          <PlexoBranding />
        </div>

        {/* Tarjeta de login */}
        <Card className="bg-white/90 dark:bg-plexo-dark-surface/90 backdrop-blur-sm border-plexo-light-border dark:border-plexo-dark-border shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-plexo-primary dark:text-plexo-dark-lavender">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-plexo-secondary dark:text-plexo-dark-text-secondary">
              Ingresa tus credenciales para acceder a Plexo
            </CardDescription>
          </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-plexo-primary dark:text-plexo-dark-lavender font-medium">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-plexo-light-border dark:border-plexo-dark-border focus:border-plexo-primary dark:focus:border-plexo-dark-lavender bg-white dark:bg-plexo-dark-surface"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-plexo-primary dark:text-plexo-dark-lavender font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-plexo-light-border dark:border-plexo-dark-border focus:border-plexo-primary dark:focus:border-plexo-dark-lavender bg-white dark:bg-plexo-dark-surface"
              />
            </div>

            <div className="text-sm text-plexo-secondary dark:text-plexo-dark-text-secondary bg-plexo-accent/10 dark:bg-plexo-dark-highlight/10 p-4 rounded-lg border border-plexo-accent/20 dark:border-plexo-dark-highlight/20">
              <p className="font-semibold mb-2 text-plexo-primary dark:text-plexo-dark-lavender">Credenciales de prueba:</p>
              <div className="space-y-1">
                <p><span className="font-medium">Administrador:</span> admin@gestioneventos.com</p>
                <p><span className="font-medium">Manager:</span> manager@gestioneventos.com</p>
                <p className="text-xs opacity-75 mt-2">Contraseña para ambos: admin123 / manager123</p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-plexo-primary hover:bg-plexo-primary/90 text-white dark:bg-plexo-dark-lavender dark:hover:bg-plexo-dark-lavender/90" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  )
}