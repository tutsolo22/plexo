import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// GET /api/clients/[id]/documents/[documentId] - Obtener documento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id: clientId, documentId } = params;

    const document = await prisma.clientDocument.findFirst({
      where: {
        id: documentId,
        clientId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error al obtener documento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id]/documents/[documentId] - Actualizar documento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id: clientId, documentId } = params;
    const body = await request.json();

    const updateSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      isPublic: z.boolean().optional(),
    });

    const validatedData = updateSchema.parse(body);

    // Extraer campos opcionales con destructuring
    const { name, description, category, isPublic } = validatedData;

    // Filtrar solo los campos definidos para evitar enviar undefined
    const updateData: Record<string, string | boolean> = {};
    if (name !== undefined) updateData['name'] = name;
    if (description !== undefined) updateData['description'] = description;
    if (category !== undefined) updateData['category'] = category;
    if (isPublic !== undefined) updateData['isPublic'] = isPublic;

    // Verificar que el documento existe y pertenece al cliente
    const existingDocument = await prisma.clientDocument.findFirst({
      where: {
        id: documentId,
        clientId,
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    const updatedDocument = await prisma.clientDocument.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedDocument,
      message: 'Documento actualizado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar documento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/documents/[documentId] - Eliminar documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id: clientId, documentId } = params;

    // Verificar que el documento existe y pertenece al cliente
    const document = await prisma.clientDocument.findFirst({
      where: {
        id: documentId,
        clientId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    await prisma.clientDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}