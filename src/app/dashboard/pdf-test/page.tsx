'use client';

import React, { useState } from 'react';
import PDFGenerator from '@/components/pdf/PDFGenerator';
import PDFPreview from '@/components/pdf/PDFPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Settings, Eye, Sparkles, CheckCircle, Clock, Target } from 'lucide-react';
import { PDFGenerationResult } from '@/types/pdf';

export default function PDFTestPage() {
  const [generationResult, setGenerationResult] = useState<PDFGenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState('generator');

  const handlePDFGenerated = (result: PDFGenerationResult) => {
    setGenerationResult(result);
    setActiveTab('preview');
  };

  const resetGeneration = () => {
    setGenerationResult(null);
    setActiveTab('generator');
  };

  const sampleData = {
    client: {
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+502 5555-1234',
      address: 'Zona 10, Ciudad de Guatemala',
    },
    event: {
      title: 'Boda de Ensueño',
      date: '2024-12-15',
      time: '18:00',
      location: 'Casona María - Salón Principal',
    },
    total: 15000,
    subtotal: 13500,
    discount: 500,
    quoteNumber: 'Q-2024-001',
    notes: 'Incluye decoración especial para temporada navideña',
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='rounded-lg bg-blue-600 p-3'>
              <FileText className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Sistema de Generación de PDF</h1>
              <p className='text-gray-600'>
                Generador avanzado de PDFs profesionales para cotizaciones
              </p>
            </div>
          </div>

          {/* Estados y Métricas */}
          <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-4'>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-green-100 p-2'>
                    <Sparkles className='h-5 w-5 text-green-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Engines Disponibles</p>
                    <p className='text-xl font-bold text-gray-900'>3</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-blue-100 p-2'>
                    <Settings className='h-5 w-5 text-blue-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Formatos</p>
                    <p className='text-xl font-bold text-gray-900'>A4, Letter</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-purple-100 p-2'>
                    <Target className='h-5 w-5 text-purple-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Calidades</p>
                    <p className='text-xl font-bold text-gray-900'>Low - High</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`rounded-lg p-2 ${generationResult ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    {generationResult ? (
                      <CheckCircle className='h-5 w-5 text-green-600' />
                    ) : (
                      <Clock className='h-5 w-5 text-gray-400' />
                    )}
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Estado</p>
                    <p className='text-xl font-bold text-gray-900'>
                      {generationResult ? 'Listo' : 'Esperando'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engines Disponibles */}
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                Engines de Generación Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-lg border border-gray-200 p-4'>
                  <div className='mb-2 flex items-center gap-3'>
                    <span className='text-2xl'>⚛️</span>
                    <h3 className='font-semibold'>React-PDF</h3>
                    <Badge variant='secondary'>Recomendado</Badge>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Generación nativa de PDF con React components. Ideal para layouts complejos y
                    diseños profesionales.
                  </p>
                  <div className='mt-2 flex flex-wrap gap-1'>
                    <Badge variant='outline' className='text-xs'>
                      Nativo
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Rápido
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Escalable
                    </Badge>
                  </div>
                </div>

                <div className='rounded-lg border border-gray-200 p-4'>
                  <div className='mb-2 flex items-center gap-3'>
                    <span className='text-2xl'>🎭</span>
                    <h3 className='font-semibold'>Puppeteer</h3>
                    <Badge variant='secondary'>Potente</Badge>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Renderizado HTML a PDF usando Chrome headless. Perfecto para templates complejos
                    con CSS avanzado.
                  </p>
                  <div className='mt-2 flex flex-wrap gap-1'>
                    <Badge variant='outline' className='text-xs'>
                      HTML/CSS
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Preciso
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Flexible
                    </Badge>
                  </div>
                </div>

                <div className='rounded-lg border border-gray-200 p-4'>
                  <div className='mb-2 flex items-center gap-3'>
                    <span className='text-2xl'>📄</span>
                    <h3 className='font-semibold'>jsPDF</h3>
                    <Badge variant='secondary'>Ligero</Badge>
                  </div>
                  <p className='text-sm text-gray-600'>
                    Generación de PDF en el cliente usando canvas. Ideal para casos simples y rápida
                    implementación.
                  </p>
                  <div className='mt-2 flex flex-wrap gap-1'>
                    <Badge variant='outline' className='text-xs'>
                      Cliente
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Simple
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Básico
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido Principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='generator' className='flex items-center gap-2'>
              <Settings className='h-4 w-4' />
              Generador
            </TabsTrigger>
            <TabsTrigger value='preview' className='flex items-center gap-2'>
              <Eye className='h-4 w-4' />
              Vista Previa
              {generationResult && (
                <Badge variant='secondary' className='ml-2'>
                  Listo
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='generator' className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
              {/* Generador Principal */}
              <div className='lg:col-span-2'>
                <PDFGenerator initialData={sampleData} onPDFGenerated={handlePDFGenerated} />
              </div>

              {/* Panel de Ayuda */}
              <div className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Datos de Prueba</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <Button
                      onClick={() => {
                        // Trigger para cargar datos de prueba
                        window.location.reload();
                      }}
                      variant='outline'
                      className='w-full'
                    >
                      Cargar Datos de Prueba
                    </Button>

                    <div className='space-y-2 text-sm'>
                      <p>
                        <strong>Cliente:</strong> {sampleData.client.name}
                      </p>
                      <p>
                        <strong>Evento:</strong> {sampleData.event.title}
                      </p>
                      <p>
                        <strong>Fecha:</strong> {sampleData.event.date}
                      </p>
                      <p>
                        <strong>Total:</strong> Q{sampleData.total.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Guía de Uso</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                    <div className='flex items-start gap-2'>
                      <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600'>
                        1
                      </span>
                      <span>Selecciona un template disponible</span>
                    </div>
                    <div className='flex items-start gap-2'>
                      <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600'>
                        2
                      </span>
                      <span>Configura el engine de generación</span>
                    </div>
                    <div className='flex items-start gap-2'>
                      <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600'>
                        3
                      </span>
                      <span>Completa los datos del cliente</span>
                    </div>
                    <div className='flex items-start gap-2'>
                      <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600'>
                        4
                      </span>
                      <span>Haz clic en &quot;Generar PDF&quot;</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='preview' className='space-y-6'>
            {generationResult && generationResult.pdfUrl && generationResult.metadata ? (
              <div className='space-y-6'>
                <PDFPreview
                  pdfUrl={generationResult.pdfUrl}
                  fileName={generationResult.fileName || 'documento.pdf'}
                  metadata={generationResult.metadata}
                  onRegenerate={resetGeneration}
                />

                <div className='flex justify-center'>
                  <Button onClick={resetGeneration} variant='outline'>
                    Generar Nuevo PDF
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <FileText className='mb-4 h-16 w-16 text-gray-400' />
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>No hay PDF generado</h3>
                  <p className='mb-4 text-center text-gray-500'>
                    Ve a la pestaña Generador para crear tu primer PDF
                  </p>
                  <Button onClick={() => setActiveTab('generator')} variant='outline'>
                    Ir al Generador
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
