'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al procesar la solicitud');
        return;
      }

      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      setError('Error al conectar con el servidor. Intenta nuevamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <Card className='w-full max-w-md border border-border/50 bg-card p-8 shadow-lg'>
        <div className='mb-6 text-center'>
          <h1 className='mb-2 text-2xl font-bold text-foreground'>Recuperar Contraseña</h1>
          <p className='text-sm text-muted-foreground'>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {isSubmitted ? (
          <div className='space-y-4'>
            <div className='flex justify-center'>
              <CheckCircle className='h-12 w-12 text-green-500' />
            </div>
            <div className='text-center'>
              <h2 className='mb-2 font-semibold text-foreground'>Revisa tu correo electrónico</h2>
              <p className='mb-4 text-sm text-muted-foreground'>
                Si existe una cuenta asociada a {email}, recibirás un correo con instrucciones para restablecer tu contraseña.
              </p>
              <p className='text-xs text-muted-foreground'>
                El enlace expirará en 24 horas por seguridad.
              </p>
            </div>
            <Button asChild className='w-full' variant='outline'>
              <Link href='/auth/login'>Volver a Iniciar Sesión</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-foreground'>
                Correo Electrónico
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='tu@correo.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className='border-border/50 bg-background text-foreground placeholder:text-muted-foreground'
              />
            </div>

            {error && (
              <div className='rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>
                {error}
              </div>
            )}

            <Button type='submit' disabled={isLoading || !email} className='w-full'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Enviando...
                </>
              ) : (
                'Enviar Enlace de Recuperación'
              )}
            </Button>

            <div className='text-center'>
              <Link href='/auth/login' className='text-sm text-primary hover:underline'>
                Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
