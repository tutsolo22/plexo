'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<{ message: string } | null>(null);

  const handleSubmit = async (email: string, password: string) => {
    setError(null);

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password: password,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        setError({ message: "Credenciales incorrectas. Verifica tu email y contraseña." });
      } else {
        setError({ message: "Error al iniciar sesión. Intenta nuevamente." });
      }
    } else if (result?.ok) {
      // Redirigir al dashboard tras autenticación exitosa
      router.push('/dashboard');
    }
  };

  return (
    <AuthForm
      title="Iniciar Sesión"
      description="Ingresa tus credenciales para acceder a Plexo"
      buttonText="Iniciar Sesión"
      onSubmit={handleSubmit}
      error={error}
    />
  );
}