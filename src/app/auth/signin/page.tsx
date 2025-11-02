'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<{ message: string } | null>(null);

  const handleSubmit = async (email, password) => {
    setError(null);

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password: password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        setError({ message: "Credenciales incorrectas. Verifica tu email y contraseña." });
      } else {
        setError({ message: "Error al iniciar sesión. Intenta nuevamente." });
      }
    } else if (result?.ok || result?.url) {
      // NextAuth v5 (beta) puede devolver `url` en lugar de `ok`.
      const target = result?.url || '/dashboard';
      // Redirigir al callbackUrl si existe, sino al dashboard
      router.push(target);
      router.refresh();
    }
  };

  const testCredentials = (
    <div className="text-sm text-muted-foreground bg-secondary p-4 rounded-lg border">
      <p className="font-semibold mb-2 text-primary">Credenciales de prueba:</p>
      <div className="space-y-1">
        <p><span className="font-medium">Administrador:</span> admin@gestioneventos.com</p>
        <p><span className="font-medium">Manager:</span> manager@gestioneventos.com</p>
        <p className="text-xs opacity-75 mt-2">Contraseña para ambos: admin123 / manager123</p>
      </div>
    </div>
  );

  return (
    <AuthForm
      title="Iniciar Sesión"
      description="Ingresa tus credenciales para acceder a Plexo"
      buttonText="Iniciar Sesión"
      onSubmit={handleSubmit}
      error={error}
      formContent={testCredentials}
    />
  );
}