'use client';

import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlexoBranding } from "@/components/plexo-branding";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plexo-light-bg to-plexo-light-bg-secondary dark:from-plexo-dark-bg dark:to-plexo-dark-bg-secondary">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-plexo-primary dark:border-plexo-dark-lavender"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plexo-light-bg to-plexo-light-bg-secondary dark:from-plexo-dark-bg dark:to-plexo-dark-bg-secondary">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Branding principal de Plexo */}
        <PlexoBranding />

        <Card className="bg-white/80 dark:bg-plexo-dark-surface/80 backdrop-blur-sm border-plexo-light-border dark:border-plexo-dark-border">
          <CardHeader className="text-center">
            <CardTitle className="text-plexo-primary dark:text-plexo-dark-lavender">Bienvenido</CardTitle>
            <CardDescription className="text-plexo-secondary dark:text-plexo-dark-text-secondary">
              Inicia sesión para acceder a tu portal personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/login" className="block">
              <Button 
                variant="outline" 
                className="w-full bg-plexo-primary hover:bg-plexo-primary/90 text-white border-plexo-primary dark:bg-plexo-dark-lavender dark:hover:bg-plexo-dark-lavender/90 dark:border-plexo-dark-lavender" 
                size="lg"
              >
                Iniciar Sesión
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-plexo-secondary dark:text-plexo-dark-text-secondary opacity-70">
          <p>© 2024 Plexo - MATS Hexalux. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}