'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Activando tu cuenta...');
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de activación no encontrado.');
      return;
    }
    // Verificar si el token es válido
    const checkToken = async () => {
      try {
        const resp = await fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`)
        const json = await resp.json()
        if (!resp.ok) {
          setStatus('error')
          setMessage(json.error || 'Token inválido')
          return
        }

        // Siempre mostrar formulario de contraseña
        setStatus('needs_password')
        setMessage('Por favor, crea tu contraseña para activar tu cuenta')
        setUserInfo({ email: json.data?.email, name: json.data?.name })
      } catch (e) {
        setStatus('error')
        setMessage('Error de conexión. Inténtalo de nuevo.')
      }
    }

    checkToken()
  }, [token, router]);

  const [newPassword, setNewPassword] = useState('')
  const submitPassword = async () => {
    if (!token || newPassword.length < 6) return
    setStatus('loading')
    try {
      const resp = await fetch('/api/auth/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: newPassword }) })
      const json = await resp.json()
      if (resp.ok) {
        setStatus('success')
        setMessage(json.message || 'Contraseña establecida. Redirigiendo al login...')
        setTimeout(() => router.push('/auth/login'), 2500)
      } else {
        setStatus('error')
        setMessage(json.error || 'Error estableciendo contraseña')
      }
    } catch (e) {
      setStatus('error')
      setMessage('Error de red')
    }
  }

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
          {status === 'needs_password' && (
            <div className="space-y-4">
              {userInfo && (
                <div className="mb-4 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>Nombre:</strong> {userInfo.name || 'Usuario'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {userInfo.email}
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="password">Crear contraseña</Label>
                <Input 
                  id="password"
                  type="password" 
                  value={newPassword} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setNewPassword(e.target.value)} 
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={submitPassword} disabled={newPassword.length < 6}>
                  Activar cuenta y establecer contraseña
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Activación de Cuenta</CardTitle>
            <CardDescription>Cargando...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Cargando...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}