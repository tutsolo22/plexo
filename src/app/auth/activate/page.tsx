'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Activando tu cuenta...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de activación no encontrado.');
      return;
    }

    const activateAccount = async () => {
      try {
        const response = await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        console.log('Activation response:', data);

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || '¡Cuenta activada exitosamente!');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Error al activar la cuenta.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error de conexión. Inténtalo de nuevo.');
      }
    };

    activateAccount();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activación de Cuenta</CardTitle>
          <CardDescription>Procesando la activación de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{message}</span>
            </div>
          )}
          {status === 'success' && (
            <Alert variant="default">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}