// app/api/quotes/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFEngineFactory } from '@/lib/pdf-engines';
import { PDFGenerationOptions, PDFEngineConfig } from '@/types/pdf';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { engine = 'react-pdf', quality = 'medium', ...options } = body;

    // Obtener cotización con todos los datos relacionados
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        template: true,
        event: {
          include: {
            client: true
          }
        },
        // Aquí incluirías otros campos relacionados como client, packages, etc.
        // Esto depende de cómo hayas estructurado tus relaciones en Prisma
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    if (!quote.template) {
      return NextResponse.json(
        { success: false, error: 'Template no encontrado para esta cotización' },
        { status: 400 }
      );
    }

    // Preparar datos para la generación del PDF
    // Nota: Ajustar según tu estructura real de datos
    const generationData = {
      ...quote,
      client: {
        name: quote.event?.client?.name || 'Cliente',
        email: quote.event?.client?.email || 'cliente@email.com',
        phone: quote.event?.client?.phone || '',
        address: quote.event?.client?.address || '',
      },
      event: quote.event ? {
        title: quote.event.title,
        date: quote.event.startDate,
        time: quote.event.startDate?.toLocaleTimeString() || '',
        duration: 0, // Calculate from startDate/endDate if needed
        location: '',
      } : undefined,
      // Agregar packages, business info, etc. según tu estructura
      business: {
        name: 'Plexo',
        phone: '+502 1234-5678',
        email: 'info@plexo.app',
        address: 'Ciudad de Guatemala, Guatemala',
      },
      validUntil: quote.validUntil || new Date(),
    };

    const generationOptions: PDFGenerationOptions = {
      template: quote.template,
      data: generationData as any,
      metadata: {
        fileName: `cotizacion-${quote.quoteNumber || quote.id.slice(-6)}.pdf`,
        showPageNumbers: options.showPageNumbers ?? true,
        orientation: options.orientation || 'portrait',
        format: options.format || 'A4',
        watermark: options.watermark,
      },
    };

    const engineConfig: PDFEngineConfig = {
      engine,
      quality,
      compression: options.compression ?? true,
      metadata: {
        title: `Cotización ${quote.quoteNumber || quote.id.slice(-6)}`,
        author: 'Casona María',
        subject: 'Cotización de servicios',
        keywords: ['cotización', 'servicios', 'eventos'],
        creator: 'CRM Casona María',
      },
    };

    // Generar PDF
    const result = await PDFEngineFactory.generate(generationOptions, engineConfig);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Actualizar cotización con URL del PDF generado
    await prisma.quote.update({
      where: { id },
      data: {
        pdfUrl: result.pdfUrl || null,
        generatedContent: JSON.stringify({
          template: quote.template.name,
          generatedAt: new Date(),
          engine,
          options,
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      pdfUrl: result.pdfUrl,
      fileName: result.fileName,
      metadata: result.metadata,
      engine,
      quoteId: quote.id,
    });

  } catch (error) {
    console.error('Error generating PDF for quote:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error generando PDF para la cotización',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Obtener información del PDF existente
    const quote = await prisma.quote.findUnique({
      where: { id },
      select: {
        id: true,
        pdfUrl: true,
        generatedContent: true,
        updatedAt: true,
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hasPDF: !!quote.pdfUrl,
      pdfUrl: quote.pdfUrl,
      generatedContent: quote.generatedContent,
      lastGenerated: quote.updatedAt,
      template: quote.template,
    });

  } catch (error) {
    console.error('Error fetching PDF info for quote:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo información del PDF',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Eliminar PDF de la cotización
    await prisma.quote.update({
      where: { id },
      data: {
        pdfUrl: null,
        generatedContent: JSON.stringify({}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'PDF eliminado de la cotización',
    });

  } catch (error) {
    console.error('Error deleting PDF for quote:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error eliminando PDF de la cotización',
      },
      { status: 500 }
    );
  }
}