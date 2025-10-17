'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import QuoteForm from '@/components/quotes/QuoteForm';

export default function NewQuotePage() {
  const router = useRouter();

  const handleSuccess = (quote: any) => {
    // Redirigir a la página de detalle de la cotización
    router.push(`/dashboard/quotes/${quote.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <QuoteForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}