'use client';

import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      // Redirigir según el rol del usuario
      if (session.user.role === 'CLIENT_EXTERNAL') {
        router.push('/client-portal');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary-foreground">CM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Casona María</h1>
          <p className="mt-2 text-gray-600">Sistema de Gestión de Eventos</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión para acceder a tu portal personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Iniciar Sesión
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Casona María. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}