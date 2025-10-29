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
      if (session.user.role === 'CLIENT_EXTERNAL') {
        router.push('/client-portal');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <PlexoBranding />

        <Card className="bg-card/80 backdrop-blur-sm border">
          <CardHeader className="text-center">
            <CardTitle className="text-primary">Bienvenido</CardTitle>
            <CardDescription className="text-muted-foreground">
              Inicia sesión para acceder a tu portal personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/login" className="block">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                size="lg"
              >
                Iniciar Sesión
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground opacity-70">
          <p>© 2024 Plexo - MATS Hexalux. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
