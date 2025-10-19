import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/quotes/[id]/public - Obtener datos públicos de cotización para página de agradecimiento
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
        { status: 400 }
      )
    }

    // Obtener cotización con datos necesarios para la página de agradecimiento
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            venue: {
              select: {
                name: true,
                address: true
              }
            },
            room: {
              select: {
                name: true,
                venue: {
                  select: {
                    name: true,
                    address: true
                  }
                }
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        tenant: {
          include: {
            businessIdentities: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true
              },
              take: 1 // Tomar la primera identidad de negocio
            }
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la cotización esté aceptada
    if (quote.status !== 'ACCEPTED') {
      return NextResponse.json(
        { success: false, error: 'Cotización no aceptada' },
        { status: 400 }
      )
    }

    // Preparar datos para la respuesta
    const businessIdentity = quote.tenant.businessIdentities[0] || {
      name: 'Gestión de Eventos',
      email: 'contacto@gestioneventos.com',
      phone: '+52 55 0000-0000',
      address: 'Ciudad de México, México'
    }

    // Determinar ubicación del evento
    let eventLocation = ''
    if (quote.event?.venue) {
      eventLocation = quote.event.venue.name
      if (quote.event.venue.address) {
        eventLocation += ` - ${quote.event.venue.address}`
      }
    } else if (quote.event?.room?.venue) {
      eventLocation = `${quote.event.room.venue.name} - ${quote.event.room.name}`
      if (quote.event.room.venue.address) {
        eventLocation += ` - ${quote.event.room.venue.address}`
      }
    }

    const responseData = {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      total: Number(quote.total),
      event: quote.event ? {
        title: quote.event.title,
        startDate: quote.event.startDate.toISOString(),
        endDate: quote.event.endDate.toISOString(),
        location: eventLocation
      } : null,
      client: quote.client || quote.event?.client || {
        name: 'Cliente',
        email: 'cliente@email.com'
      },
      businessIdentity
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Error al obtener datos públicos de cotización:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}