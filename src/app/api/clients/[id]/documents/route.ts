import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { clientDocumentSchema } from '@/lib/validations/client';

// GET /api/clients/[id]/documents - Listar documentos de un cliente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    // Verificar que el cliente existe
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        deletedAt: null,
      }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const documents = await prisma.clientDocument.findMany({
      where: {
        clientId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/documents - Crear documento para un cliente
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const body = await request.json();
    const validatedData = clientDocumentSchema.parse(body);

    // Verificar que el cliente existe
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        deletedAt: null,
      }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos para Prisma (convertir undefined a null)
    const documentData = {
      name: validatedData.name,
      fileName: validatedData.fileName,
      fileUrl: validatedData.fileUrl,
      fileSize: validatedData.fileSize,
      mimeType: validatedData.mimeType,
      description: validatedData.description || null,
      category: validatedData.category || null,
      isPublic: validatedData.isPublic,
      clientId,
      uploadedBy: 'test-user', // TODO: Obtener del contexto de autenticación
    };

    const document = await prisma.clientDocument.create({
      data: documentData,
    });

    return NextResponse.json(
      {
        success: true,
        data: document,
        message: 'Documento creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear documento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}