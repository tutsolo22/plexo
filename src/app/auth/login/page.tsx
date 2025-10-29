'use client';

import { useState, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');

  const [error, setError] = useState<{ message: string; isUnverified?: boolean } | null>(null);

  const getErrorMessage = (error: string | null) => {
    if (!error) return '';
    const errorMessages: { [key: string]: string } = {
      CredentialsSignin: 'Credenciales incorrectas. Verifica tu correo electrónico y contraseña.',
      // ... add other specific error messages as needed
    };
    return errorMessages[error] || 'Ocurrió un error inesperado. Intenta nuevamente.';
  };

  // Set initial error from URL param
  useState(() => {
    if (errorParam) {
      setError({ message: getErrorMessage(errorParam) });
    }
  }, [errorParam]);

  const handleSubmit = async (email, password) => {
    setError(null);

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password: password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === 'Debes verificar tu correo electronico antes de iniciar sesion') {
        setError({ message: result.error, isUnverified: true });
      } else {
        setError({ message: getErrorMessage(result.error) });
      }
    } else if (result?.ok) {
      const session = await getSession();
      if (session?.user && (session.user as any).mustChangePassword) {
        router.replace('/auth/change-password');
      } else {
        router.replace(callbackUrl);
      }
    }
  };

  return (
    <AuthForm
      title="Iniciar Sesión"
      description="Accede a tu cuenta de Plexo"
      buttonText="Iniciar Sesión"
      onSubmit={handleSubmit}
      error={error}
    >
      <Link href='/auth/forgot-password' className='block text-primary hover:underline'>
        ¿Olvidaste tu contraseña?
      </Link>
      <div className='text-muted-foreground'>
        ¿No tienes cuenta?{' '}
        <Link href='/auth/register' className='text-primary hover:underline'>
          Regístrate aquí
        </Link>
      </div>
    </AuthForm>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-background'>
          <div className='flex items-center space-x-2'>
            <Loader2 className='h-6 w-6 animate-spin text-primary' />
            <span className='text-primary'>Cargando...</span>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
