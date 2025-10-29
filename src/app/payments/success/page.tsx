'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { PaymentStatus } from '@/components/payments';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const externalReference = searchParams.get('ref');
  const mercadoPagoPaymentId = searchParams.get('payment_id');

  useEffect(() => {
    const findPayment = async () => {
      if (!externalReference && !mercadoPagoPaymentId) {
        setIsLoading(false);
        return;
      }

      try {
        // Buscar el pago por referencia externa
        const response = await fetch(`/api/payments?limit=1&reference=${externalReference}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          setPaymentId(data.data[0].id);
        }
      } catch (error) {
        console.error('Error buscando pago:', error);
      } finally {
        setIsLoading(false);
      }
    };

    findPayment();
  }, [externalReference, mercadoPagoPaymentId]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToQuotes = () => {
    router.push('/dashboard/quotes');
  };

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='flex flex-col items-center justify-center p-6'>
            <Loader2 className='mb-4 h-8 w-8 animate-spin text-blue-600' />
            <p className='text-center text-gray-600'>Verificando tu pago...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
      <div className='w-full max-w-2xl space-y-6'>
        {/* Mensaje de éxito */}
        <Card>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
              <CheckCircle className='h-8 w-8 text-green-600' />
            </div>
            <CardTitle className='text-2xl text-green-800'>¡Pago Exitoso!</CardTitle>
            <p className='mt-2 text-gray-600'>Tu pago ha sido procesado correctamente</p>
          </CardHeader>
          <CardContent className='space-y-4 text-center'>
            {externalReference && (
              <div className='rounded-lg bg-gray-50 p-4'>
                <p className='text-sm text-gray-500'>Referencia de pago</p>
                <p className='font-mono text-sm font-medium'>{externalReference}</p>
              </div>
            )}

            <div className='flex flex-col justify-center gap-3 sm:flex-row'>
              <Button onClick={handleGoToDashboard} variant='default'>
                <ArrowRight className='mr-2 h-4 w-4' />
                Ir al Dashboard
              </Button>
              <Button onClick={handleGoToQuotes} variant='outline'>
                Ver mis Cotizaciones
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado del pago */}
        {paymentId && (
          <PaymentStatus
            paymentId={paymentId}
            showDetails={true}
            refreshInterval={10000} // Refrescar cada 10 segundos
          />
        )}

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>¿Qué sigue?</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-start space-x-3'>
              <div className='mt-2 h-2 w-2 rounded-full bg-blue-600'></div>
              <div>
                <h4 className='font-medium'>Confirmación por email</h4>
                <p className='text-sm text-gray-600'>
                  Recibirás un email de confirmación con los detalles de tu pago
                </p>
              </div>
            </div>
            <div className='flex items-start space-x-3'>
              <div className='mt-2 h-2 w-2 rounded-full bg-green-600'></div>
              <div>
                <h4 className='font-medium'>Evento confirmado</h4>
                <p className='text-sm text-gray-600'>
                  Tu evento ha sido confirmado automáticamente
                </p>
              </div>
            </div>
            <div className='flex items-start space-x-3'>
              <div className='mt-2 h-2 w-2 rounded-full bg-purple-600'></div>
              <div>
                <h4 className='font-medium'>Próximos pasos</h4>
                <p className='text-sm text-gray-600'>
                  Nuestro equipo se pondrá en contacto contigo para coordinar los detalles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
