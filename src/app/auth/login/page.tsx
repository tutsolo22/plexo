'use client';

import { useState, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { PlexoBranding } from '@/components/plexo-branding';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ message: string; isUnverified?: boolean } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    if (!error) return '';

    const errorMessages: { [key: string]: string } = {
      Signin: 'Ocurrio un error durante el inicio de sesion',
      OAuthSignin: 'Error al iniciar sesion con el proveedor externo',
      OAuthCallback: 'Error en la respuesta del proveedor externo',
      OAuthCreateAccount: 'No se pudo crear la cuenta con el proveedor externo',
      EmailCreateAccount: 'No se pudo crear la cuenta con email',
      Callback: 'Error en el callback de autenticacion',
      OAuthAccountNotLinked: 'Esta cuenta ya esta vinculada a otro metodo de inicio de sesion',
      EmailSignin: 'Error al enviar el correo de verificacion',
      CredentialsSignin: 'Credenciales incorrectas. Verifica tu correo electronico y contraseña.',
      SessionRequired: 'Debes iniciar sesion para acceder a esta pagina',
      Configuration: 'Error de configuracion del servidor',
      AccessDenied: 'Acceso denegado. No tienes permisos para acceder.',
      Verification: 'Error en la verificacion. El enlace puede haber expirado.',
    };

    return errorMessages[error] || 'Ocurrio un error inesperado. Intenta nuevamente.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError({ message: 'El correo electronico es requerido' });
      return;
    }

    if (!password.trim()) {
      setError({ message: 'La contraseña es requerida' });
      return;
    }

    if (password.length < 6) {
      setError({ message: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'Debes verificar tu correo electronico antes de iniciar sesion') {
          setError({ message: result.error, isUnverified: true });
          return;
        }
        setError({ message: getErrorMessage(result.error) });
      } else if (result?.ok) {
        router.push(callbackUrl);

        const session = await getSession();
        if (session?.user) {
          if ((session.user as any).mustChangePassword) {
            router.replace('/auth/change-password');
            return;
          }

          router.replace('/dashboard');
        }
      } else {
        setError({ message: 'Error inesperado durante el inicio de sesion. Intenta nuevamente.' });
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError({ message: 'Error de conexion. Verifica tu conexion a internet e intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-plexo-light-bg to-plexo-light-bg-secondary dark:from-plexo-dark-bg dark:to-plexo-dark-bg-secondary p-4'>
      <div className='w-full max-w-md space-y-6'>
        <div className='text-center'>
          <PlexoBranding />
        </div>

        <Card className='w-full bg-white/90 dark:bg-plexo-dark-surface/90 backdrop-blur-sm border-plexo-light-border dark:border-plexo-dark-border shadow-2xl'>
          <CardHeader className='space-y-4 text-center'>
            <div>
              <CardTitle className='text-2xl font-bold text-plexo-primary dark:text-plexo-dark-lavender'>
                Iniciar Sesion
              </CardTitle>
              <CardDescription className='text-plexo-secondary dark:text-plexo-dark-text-secondary'>
                Accede a tu cuenta de Plexo
              </CardDescription>
            </div>
          </CardHeader>

        <CardContent>
          {(errorParam || error) && (
            <Alert variant='destructive' className='mb-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                {error?.message || getErrorMessage(errorParam)}
                {error?.isUnverified && (
                  <a href='/auth/resend-activation' className='ml-2 underline'>
                    Reenviar correo de activacion
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-plexo-primary dark:text-plexo-dark-lavender font-medium'>
                Correo Electronico
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='tu@email.com'
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete='email'
                className='w-full border-plexo-light-border dark:border-plexo-dark-border focus:border-plexo-primary dark:focus:border-plexo-dark-lavender bg-white dark:bg-plexo-dark-surface'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='text-plexo-primary dark:text-plexo-dark-lavender font-medium'>
                Contraseña
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Tu contraseña'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete='current-password'
                  className='w-full pr-10 border-plexo-light-border dark:border-plexo-dark-border focus:border-plexo-primary dark:focus:border-plexo-dark-lavender bg-white dark:bg-plexo-dark-surface'
                  minLength={6}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 text-plexo-secondary dark:text-plexo-dark-text-secondary' />
                  ) : (
                    <Eye className='h-4 w-4 text-plexo-secondary dark:text-plexo-dark-text-secondary' />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type='submit' 
              className='w-full bg-plexo-primary hover:bg-plexo-primary/90 text-white dark:bg-plexo-dark-lavender dark:hover:bg-plexo-dark-lavender/90' 
              size='lg' 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Iniciando sesion...
                </>
              ) : (
                'Iniciar Sesion'
              )}
            </Button>
          </form>

          <div className='mt-6 space-y-2 text-center text-sm'>
            <Link href='/auth/forgot-password' className='block text-plexo-primary dark:text-plexo-dark-lavender hover:underline'>
              ¿Olvidaste tu contraseña?
            </Link>

            <div className='text-plexo-secondary dark:text-plexo-dark-text-secondary'>
              ¿No tienes cuenta?{' '}
              <Link href='/auth/register' className='text-plexo-primary dark:text-plexo-dark-lavender hover:underline'>
                Registrate aqui
              </Link>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-plexo-light-bg to-plexo-light-bg-secondary dark:from-plexo-dark-bg dark:to-plexo-dark-bg-secondary'>
          <div className='flex items-center space-x-2'>
            <Loader2 className='h-6 w-6 animate-spin text-plexo-primary dark:text-plexo-dark-lavender' />
            <span className='text-plexo-primary dark:text-plexo-dark-lavender'>Cargando...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
