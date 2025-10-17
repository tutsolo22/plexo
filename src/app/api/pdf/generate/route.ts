// app/api/pdf/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFEngineFactory } from '@/lib/pdf-engines';
import { PDFGenerationOptions, PDFEngineConfig } from '@/types/pdf';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const GeneratePDFSchema = z.object({
  templateId: z.string(),
  quoteId: z.string().optional(),
  data: z.object({
    client: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }),
    event: z.object({
      title: z.string(),
      date: z.string(),
      time: z.string().optional(),
      duration: z.number().optional(),
      location: z.string().optional(),
    }).optional(),
    packages: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
      })),
      subtotal: z.number(),
    })).optional(),
    business: z.object({
      name: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      logo: z.string().optional(),
    }).optional(),
    quoteNumber: z.string().optional(),
    subtotal: z.number().optional(),
    discount: z.number().optional(),
    total: z.number(),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
  }),
  options: z.object({
    engine: z.enum(['react-pdf', 'puppeteer', 'jspdf']).default('react-pdf'),
    quality: z.enum(['low', 'medium', 'high']).default('medium'),
    format: z.enum(['A4', 'Letter']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    fileName: z.string().optional(),
    watermark: z.string().optional(),
    showPageNumbers: z.boolean().default(true),
    compression: z.boolean().default(true),
    metadata: z.object({
      title: z.string().optional(),
      author: z.string().optional(),
      subject: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      creator: z.string().default('CRM Casona María'),
    }).optional(),
  }).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GeneratePDFSchema.parse(body);

    // Obtener template de la base de datos
    const template = await prisma.quoteTemplate.findUnique({
      where: { id: validatedData.templateId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el template está activo
    if (!template.isActive) {
      return NextResponse.json(
        { success: false, error: 'Template no está activo' },
        { status: 400 }
      );
    }

    // Preparar información del negocio (esto debería venir de configuración)
    const businessInfo = validatedData.data.business || {
      name: 'Casona María',
      phone: '+502 1234-5678',
      email: 'info@casonamaria.com',
      address: 'Ciudad de Guatemala, Guatemala',
    };

    // Configurar opciones de generación
    const generationOptions: PDFGenerationOptions = {
      template,
      data: {
        ...validatedData.data,
        business: businessInfo,
        // Campos adicionales requeridos por el tipo
        id: validatedData.quoteId || `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'DRAFT' as any,
        userId: 'system', // En producción, obtener del token
        templateId: validatedData.templateId,
        generatedContent: null,
        pdfUrl: null,
        version: 1,
        previousVersionId: null,
        sentAt: null,
        viewedAt: null,
        respondedAt: null,
      },
      metadata: {
        fileName: validatedData.options.fileName || `cotizacion-${Date.now()}.pdf`,
        watermark: validatedData.options.watermark,
        showPageNumbers: validatedData.options.showPageNumbers,
        orientation: validatedData.options.orientation,
        format: validatedData.options.format,
      },
    };

    const engineConfig: PDFEngineConfig = {
      engine: validatedData.options.engine,
      quality: validatedData.options.quality,
      compression: validatedData.options.compression,
      metadata: {
        title: validatedData.options.metadata?.title || `Cotización - ${validatedData.data.client.name}`,
        author: validatedData.options.metadata?.author || businessInfo.name,
        subject: validatedData.options.metadata?.subject || 'Cotización de servicios',
        keywords: validatedData.options.metadata?.keywords || ['cotización', 'servicios', 'eventos'],
        creator: validatedData.options.metadata?.creator,
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

    // Si se proporcionó un quoteId, actualizar la cotización con la URL del PDF
    if (validatedData.quoteId && result.pdfUrl) {
      try {
        await prisma.quote.update({
          where: { id: validatedData.quoteId },
          data: {
            pdfUrl: result.pdfUrl,
            generatedContent: JSON.stringify({
              template: template.name,
              generatedAt: new Date(),
              options: validatedData.options,
            }),
          },
        });
      } catch (updateError) {
        console.error('Error updating quote with PDF URL:', updateError);
        // No fallar la respuesta por esto, el PDF se generó correctamente
      }
    }

    // Registrar estadísticas de uso del template
    try {
      await prisma.quoteTemplate.update({
        where: { id: validatedData.templateId },
        data: {
          metadata: {
            ...((template.metadata as any) || {}),
            stats: {
              ...((template.metadata as any)?.stats || {}),
              totalUsage: ((template.metadata as any)?.stats?.totalUsage || 0) + 1,
              lastUsed: new Date(),
            },
          },
        },
      });
    } catch (statsError) {
      console.error('Error updating template stats:', statsError);
      // No fallar por esto
    }

    return NextResponse.json({
      success: true,
      pdfUrl: result.pdfUrl,
      fileName: result.fileName,
      metadata: result.metadata,
      engine: validatedData.options.engine,
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor generando PDF',
      },
      { status: 500 }
    );
  }
}

// Endpoint para obtener configuraciones disponibles
export async function GET() {
  try {
    const availableEngines = ['react-pdf', 'puppeteer', 'jspdf'];
    const availableFormats = ['A4', 'Letter'];
    const availableOrientations = ['portrait', 'landscape'];
    const availableQualities = ['low', 'medium', 'high'];

    // Obtener templates disponibles
    const templates = await prisma.quoteTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      configuration: {
        engines: availableEngines,
        formats: availableFormats,
        orientations: availableOrientations,
        qualities: availableQualities,
        defaultEngine: 'react-pdf',
        defaultFormat: 'A4',
        defaultOrientation: 'portrait',
        defaultQuality: 'medium',
      },
      templates,
    });

  } catch (error) {
    console.error('Error fetching PDF configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo configuración de PDF',
      },
      { status: 500 }
    );
  }
}