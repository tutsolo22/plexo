import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import Handlebars from 'handlebars';

// Schema para datos de vista previa
const previewSchema = z.object({
  data: z.record(z.any()).optional(),
  format: z.enum(['html', 'text']).default('html'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { data: previewData, format } = previewSchema.parse(body);

    // Obtener el template
    const template = await prisma.quoteTemplate.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        businessIdentity: true,
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Datos por defecto para vista previa
    const defaultData = {
      // Variables del cliente
      clientName: previewData?.['clientName'] || 'Juan Pérez',
      clientEmail: previewData?.['clientEmail'] || 'juan.perez@email.com',
      clientPhone: previewData?.['clientPhone'] || '+502 1234-5678',
      clientAddress: previewData?.['clientAddress'] || 'Ciudad de Guatemala, Guatemala',
      
      // Variables del evento
      eventTitle: previewData?.['eventTitle'] || 'Celebración de Aniversario',
      eventDate: previewData?.['eventDate'] || new Date().toLocaleDateString('es-ES'),
      eventTime: previewData?.['eventTime'] || '18:00',
      eventDuration: previewData?.['eventDuration'] || '4 horas',
      roomName: previewData?.['roomName'] || 'Salón Principal',
      locationName: previewData?.['locationName'] || template.businessIdentity.name,
      
      // Variables de la cotización
      quoteNumber: previewData?.['quoteNumber'] || 'COT-2024-001',
      quoteDate: new Date().toLocaleDateString('es-ES'),
      subtotal: previewData?.['subtotal'] || 'Q 2,500.00',
      discount: previewData?.['discount'] || 'Q 250.00',
      total: previewData?.['total'] || 'Q 2,250.00',
      validUntil: previewData?.['validUntil'] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES'),
      
      // Variables de la identidad de negocio
      businessName: template.businessIdentity.name,
      businessPhone: template.businessIdentity.phone || 'No especificado',
      businessEmail: template.businessIdentity.email || 'No especificado',
      businessAddress: template.businessIdentity.address || 'No especificado',
      businessLogo: template.businessIdentity.logo || '',
      businessSlogan: template.businessIdentity.slogan || '',
      
      // Variables dinámicas
      currentDate: new Date().toLocaleDateString('es-ES'),
      currentTime: new Date().toLocaleTimeString('es-ES'),
      currentUser: session.user.name || 'Usuario',
      
      // Paquetes de ejemplo
      packages: previewData?.['packages'] || [
        {
          name: 'Paquete Básico',
          description: 'Incluye servicios esenciales',
          items: [
            {
              name: 'Decoración básica',
              quantity: 1,
              unitPrice: 'Q 500.00',
              totalPrice: 'Q 500.00'
            },
            {
              name: 'Servicio de meseros',
              quantity: 2,
              unitPrice: 'Q 300.00',
              totalPrice: 'Q 600.00'
            }
          ],
          subtotal: 'Q 1,100.00'
        },
        {
          name: 'Paquete Premium',
          description: 'Servicios adicionales',
          items: [
            {
              name: 'Sonido profesional',
              quantity: 1,
              unitPrice: 'Q 800.00',
              totalPrice: 'Q 800.00'
            },
            {
              name: 'Iluminación especial',
              quantity: 1,
              unitPrice: 'Q 650.00',
              totalPrice: 'Q 650.00'
            }
          ],
          subtotal: 'Q 1,450.00'
        }
      ],
      
      // Cualquier dato adicional pasado
      ...previewData,
    };

    try {
      // Compilar y renderizar template con Handlebars
      const compiledTemplate = Handlebars.compile(template.htmlContent);
      const renderedContent = compiledTemplate(defaultData);

      return NextResponse.json({
        success: true,
        content: renderedContent,
        format,
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
          version: template.version,
        },
        dataUsed: defaultData,
        variables: template.variables ? JSON.parse(template.variables as string) : [],
      });

    } catch (templateError) {
      console.error('Error rendering template:', templateError);
      return NextResponse.json(
        { 
          error: 'Error al renderizar template',
          details: templateError instanceof Error ? templateError.message : 'Error desconocido',
          content: template.htmlContent, // Devolver contenido sin procesar en caso de error
        },
        { status: 400 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}