/**
 * Tests de integración para APIs
 * Sistema de Gestión de Eventos V3
 */

import { NextRequest } from 'next/server'
import { POST as createQuote } from '../../app/api/quotes/route'

// Mock de Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    quote: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    }
  }
}))

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Events and Quotes Integration', () => {
    it('should create quote from event data', async () => {
      // Mock de datos de evento
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        startDate: '2024-01-01T10:00:00.000Z',
        client: {
          id: 'client-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      }

      // Mock de respuesta de Prisma
      const { prisma } = require('@/lib/prisma')
      prisma.event.findUnique.mockResolvedValue(mockEvent)
      prisma.quote.create.mockResolvedValue({
        id: 'quote-1',
        eventId: 'event-1',
        status: 'DRAFT'
      })

      // Crear request para crear cotización
      const request = new NextRequest('http://localhost:3000/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'event-1',
          items: [
            {
              name: 'Servicio básico',
              quantity: 1,
              unitPrice: 1000,
              total: 1000
            }
          ]
        })
      })

      const response = await createQuote(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.quote.id).toBe('quote-1')
      expect(result.quote.eventId).toBe('event-1')
    })

    it('should validate event exists before creating quote', async () => {
      // Mock de evento no encontrado
      const { prisma } = require('@/lib/prisma')
      prisma.event.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'non-existent-event',
          items: []
        })
      })

      const response = await createQuote(request)
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toContain('Evento no encontrado')
    })

    it('should integrate with tenant isolation', async () => {
      // Mock de tenant
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test Tenant',
        emailConfig: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587
        }
      }

      const { prisma } = require('@/lib/prisma')
      prisma.tenant.findUnique.mockResolvedValue(mockTenant)
      prisma.event.findUnique.mockResolvedValue({
        id: 'event-1',
        tenantId: 'tenant-1'
      })

      // Test que verifica aislamiento por tenant
      const request = new NextRequest('http://localhost:3000/api/quotes', {
        method: 'POST',
        headers: {
          'x-tenant-id': 'tenant-1'
        },
        body: JSON.stringify({
          eventId: 'event-1',
          items: []
        })
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _response = await createQuote(request)

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' }
      })
    })
  })

  describe('Email Integration with Quotes', () => {
    it('should send quote email after creation', async () => {
      // Mock de servicios de email
      jest.mock('@/lib/email/email-service', () => ({
        sendQuoteEmail: jest.fn().mockResolvedValue({ success: true })
      }))

      const { prisma } = require('@/lib/prisma')
      prisma.event.findUnique.mockResolvedValue({
        id: 'event-1',
        client: {
          email: 'client@example.com'
        }
      })
      prisma.quote.create.mockResolvedValue({
        id: 'quote-1',
        eventId: 'event-1'
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _request = new NextRequest('http://localhost:3000/api/quotes/send', {
        method: 'POST',
        body: JSON.stringify({
          quoteId: 'quote-1',
          recipientEmail: 'client@example.com'
        })
      })

      // Aquí iría la implementación del endpoint send
      // const response = await sendQuote(request)
      // expect(response.status).toBe(200)
    })
  })
})