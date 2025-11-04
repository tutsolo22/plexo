'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Validar que el token y email existan
  useEffect(() => {
    if (!token || !email) {
      setError('Enlace inválido o expirado');
      setIsLoading(true);
    }
  }, [token, email]);

  // Calcular fuerza de contraseña
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.match(/[a-z]/)) strength++;
    if (pwd.match(/[A-Z]/)) strength++;
    if (pwd.match(/[0-9]/)) strength++;
    if (pwd.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    calculatePasswordStrength(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordStrength < 2) {
      setError('La contraseña es muy débil. Usa mayúsculas, minúsculas, números y símbolos');
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: email?.toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al restablecer la contraseña');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading && error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background px-4'>
        <Card className='w-full max-w-md border border-border/50 bg-card p-8 text-center'>
          <h1 className='mb-4 text-2xl font-bold text-foreground'>Enlace Inválido</h1>
          <p className='mb-6 text-muted-foreground'>{error}</p>
          <Button asChild className='w-full'>
            <Link href='/auth/forgot-password'>Solicitar Nuevo Enlace</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background px-4'>
        <Card className='w-full max-w-md border border-border/50 bg-card p-8 text-center'>
          <CheckCircle className='mx-auto mb-4 h-12 w-12 text-green-500' />
          <h1 className='mb-2 text-2xl font-bold text-foreground'>Contraseña Restablecida</h1>
          <p className='mb-6 text-muted-foreground'>
            Tu contraseña ha sido restablecida exitosamente. Serás redirigido a iniciar sesión en unos momentos...
          </p>
        </Card>
      </div>
    );
  }

  const passwordStrengthText = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'];
  const passwordStrengthColor =
    passwordStrength === 0
      ? 'bg-gray-300'
      : passwordStrength === 1
        ? 'bg-red-500'
        : passwordStrength === 2
          ? 'bg-orange-500'
          : passwordStrength === 3
            ? 'bg-yellow-500'
            : 'bg-green-500';

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <Card className='w-full max-w-md border border-border/50 bg-card p-8 shadow-lg'>
        <div className='mb-6 text-center'>
          <h1 className='mb-2 text-2xl font-bold text-foreground'>Restablecer Contraseña</h1>
          <p className='text-sm text-muted-foreground'>Ingresa una nueva contraseña segura para tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Contraseña */}
          <div className='space-y-2'>
            <Label htmlFor='password' className='text-foreground'>
              Nueva Contraseña
            </Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                value={password}
                onChange={handlePasswordChange}
                disabled={isResetting}
                required
                className='border-border/50 bg-background pr-10 text-foreground placeholder:text-muted-foreground'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Indicador de fortaleza */}
            {password && (
              <div className='space-y-2'>
                <div className='flex h-2 gap-1 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700'>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 ${i < passwordStrength ? passwordStrengthColor : 'bg-gray-300 dark:bg-gray-600'}`}
                    />
                  ))}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Fortaleza: <span className='font-semibold'>{passwordStrengthText[passwordStrength]}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className='space-y-2'>
            <Label htmlFor='confirm-password' className='text-foreground'>
              Confirmar Contraseña
            </Label>
            <div className='relative'>
              <Input
                id='confirm-password'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='••••••••'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isResetting}
                required
                className='border-border/50 bg-background pr-10 text-foreground placeholder:text-muted-foreground'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Requisitos de contraseña */}
          <div className='rounded-md bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-200'>
            <p className='font-semibold mb-2'>Requisitos de contraseña:</p>
            <ul className='list-inside list-disc space-y-1'>
              <li className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
                Mínimo 8 caracteres
              </li>
              <li className={password.match(/[a-z]/) ? 'text-green-600 dark:text-green-400' : ''}>
                Letras minúsculas
              </li>
              <li className={password.match(/[A-Z]/) ? 'text-green-600 dark:text-green-400' : ''}>
                Letras mayúsculas
              </li>
              <li className={password.match(/[0-9]/) ? 'text-green-600 dark:text-green-400' : ''}>
                Números
              </li>
            </ul>
          </div>

          {/* Errores */}
          {error && (
            <div className='rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>
              {error}
            </div>
          )}

          {/* Botón Submit */}
          <Button type='submit' disabled={isResetting || !password || !confirmPassword} className='w-full'>
            {isResetting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Restableciendo...
              </>
            ) : (
              'Restablecer Contraseña'
            )}
          </Button>

          {/* Link Volver */}
          <div className='text-center'>
            <Link href='/auth/login' className='text-sm text-primary hover:underline'>
              Volver a Iniciar Sesión
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <Card className='w-full max-w-md border border-border/50 bg-card p-8 text-center'>
        <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-primary' />
        <p className='text-muted-foreground'>Cargando...</p>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
