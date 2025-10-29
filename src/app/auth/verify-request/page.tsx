'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifica tu correo</CardTitle>
          <CardDescription>
            Te enviamos un enlace de verificación a tu correo cuando te registraste. Revisa tu bandeja y carpeta de spam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Si no lo recibiste, puedes solicitar que te reenviemos el correo de activación.
            </p>
            <div className="flex justify-end">
              <Link href="/auth/resend-activation">
                <Button>Reenviar correo de activación</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
