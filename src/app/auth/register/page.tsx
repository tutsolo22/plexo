'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Mail } from 'lucide-react'

/**
 * Página de registro de usuarios para CRM Casona María
 * 
 * Características:
 * - Registro con validación en tiempo real
 * - Indicador de fortaleza de contraseña
 * - Envío de email de verificación
 * - Prevención de registro duplicado
 * - Validaciones de seguridad
 */

interface PasswordStrength {
  isValid: boolean
  score: number
  feedback: {
    length: boolean
    upperCase: boolean
    lowerCase: boolean
    numbers: boolean
    specialChars: boolean
  }
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)
  
  // const router = useRouter() // Será usado en funciones futuras

  /**
   * Evalúa la fortaleza de la contraseña
   */
  const evaluatePasswordStrength = (password: string): PasswordStrength => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChars
    ].filter(Boolean).length

    return {
      isValid: score >= 3 && password.length >= minLength,
      score,
      feedback: {
        length: password.length >= minLength,
        upperCase: hasUpperCase,
        lowerCase: hasLowerCase,
        numbers: hasNumbers,
        specialChars: hasSpecialChars
      },
      strength: score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'strong' : 'very-strong'
    }
  }

  /**
   * Maneja los cambios en los campos del formulario
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Evaluar fortaleza de contraseña en tiempo real
    if (field === 'password') {
      if (value.length > 0) {
        setPasswordStrength(evaluatePasswordStrength(value))
      } else {
        setPasswordStrength(null)
      }
    }
    
    // Limpiar errores al escribir
    if (error) setError('')
  }

  /**
   * Valida el formulario antes del envío
   */
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return false
    }
    
    if (formData.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return false
    }
    
    if (!formData.email.trim()) {
      setError('El email es requerido')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('El formato del email no es válido')
      return false
    }
    
    if (formData.phone && formData.phone.length < 10) {
      setError('El teléfono debe tener al menos 10 dígitos')
      return false
    }
    
    if (!passwordStrength?.isValid) {
      setError('La contraseña debe cumplir con los requisitos mínimos de seguridad')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    
    return true
  }

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Llamada a la API de registro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          password: formData.password
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta')
      }
      
      // Registro exitoso
      setSuccess(true)
      
    } catch (error) {
      console.error('Error en registro:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta. Inténtalo de nuevo.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Componente de indicador de fortaleza de contraseña
   */
  const PasswordStrengthIndicator = () => {
    if (!passwordStrength) return null
    
    const strengthColors = {
      'weak': 'bg-red-500',
      'medium': 'bg-yellow-500',
      'strong': 'bg-blue-500',
      'very-strong': 'bg-green-500'
    }
    
    const strengthLabels = {
      'weak': 'Débil',
      'medium': 'Media',
      'strong': 'Fuerte',
      'very-strong': 'Muy Fuerte'
    }
    
    return (
      <div className="mt-2 space-y-2">
        {/* Barra de fortaleza */}
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-2 flex-1 rounded ${
                level <= passwordStrength.score
                  ? strengthColors[passwordStrength.strength]
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* Etiqueta de fortaleza */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={passwordStrength.isValid ? 'default' : 'destructive'}
            className="text-xs"
          >
            {strengthLabels[passwordStrength.strength]}
          </Badge>
        </div>
        
        {/* Lista de requisitos */}
        <div className="text-xs space-y-1 text-muted-foreground">
          <div className={`flex items-center ${passwordStrength.feedback.length ? 'text-green-600' : 'text-red-600'}`}>
            {passwordStrength.feedback.length ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            Al menos 8 caracteres
          </div>
          <div className={`flex items-center ${passwordStrength.feedback.upperCase ? 'text-green-600' : 'text-red-600'}`}>
            {passwordStrength.feedback.upperCase ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            Al menos una mayúscula
          </div>
          <div className={`flex items-center ${passwordStrength.feedback.lowerCase ? 'text-green-600' : 'text-red-600'}`}>
            {passwordStrength.feedback.lowerCase ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            Al menos una minúscula
          </div>
          <div className={`flex items-center ${passwordStrength.feedback.numbers ? 'text-green-600' : 'text-red-600'}`}>
            {passwordStrength.feedback.numbers ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            Al menos un número
          </div>
          <div className={`flex items-center ${passwordStrength.feedback.specialChars ? 'text-green-600' : 'text-red-600'}`}>
            {passwordStrength.feedback.specialChars ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            Al menos un carácter especial
          </div>
        </div>
      </div>
    )
  }

  // Página de confirmación después del registro exitoso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">¡Cuenta Creada!</CardTitle>
            <CardDescription>
              Tu cuenta ha sido creada exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Hemos enviado un email de verificación a <strong>{formData.email}</strong>.
                Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Ir a Iniciar Sesión
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/verify-email">
                  Reenviar Email de Verificación
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
            <CardDescription>
              Únete al equipo de Casona María
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Mostrar errores */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre completo */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>

            {/* Teléfono (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(opcional)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={isLoading}
                autoComplete="tel"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Crea una contraseña segura"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10"
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
              <PasswordStrengthIndicator />
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Botón de registro */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading || !passwordStrength?.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          {/* Enlaces adicionales */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}