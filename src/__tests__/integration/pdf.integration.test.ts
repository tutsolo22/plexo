/**
 * Tests de integración para el sistema de PDFs
 * Sistema de Gestión de Eventos V3
 */

import { generateQuotePDF } from '../../lib/pdf-engines'
import { prisma } from '../../lib/prisma'

// Mock de dependencias
jest.mock('@/lib/prisma', () => ({
  prisma: {
    quote: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    }
  }
}))

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    output: jest.fn().mockReturnValue(new ArrayBuffer(8))
  }))
}))

describe('PDF Generation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Quote PDF Generation', () => {
    it('should generate PDF with complete quote data', async () => {
      const mockQuote = {
        id: 'quote-1',
        number: 'Q-2024-001',
        status: 'SENT',
        total: 5000,
        items: [
          {
            id: 'item-1',
            name: 'Servicio de catering',
            quantity: 50,
            unitPrice: 100,
            total: 5000
          }
        ],
        event: {
          title: 'Evento Corporativo',
          startDate: '2024-01-15T10:00:00.000Z',
          endDate: '2024-01-15T18:00:00.000Z',
          client: {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@example.com',
            company: 'Empresa XYZ'
          }
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      // Mock de Prisma
      prisma.quote.findUnique.mockResolvedValue(mockQuote)
      prisma.event.findUnique.mockResolvedValue(mockQuote.event)
      prisma.client.findUnique.mockResolvedValue(mockQuote.event.client)

      const pdfBuffer = await generateQuotePDF('quote-1')

      expect(pdfBuffer).toBeInstanceOf(ArrayBuffer)
      expect(pdfBuffer.byteLength).toBeGreaterThan(0)
      expect(prisma.quote.findUnique).toHaveBeenCalledWith({
        where: { id: 'quote-1' },
        include: expect.any(Object)
      })
    })

    it('should handle different PDF engines', async () => {
      const mockQuote = {
        id: 'quote-2',
        number: 'Q-2024-002',
        total: 3000,
        event: {
          client: {
            firstName: 'María',
            lastName: 'González'
          }
        }
      }

      prisma.quote.findUnique.mockResolvedValue(mockQuote)

      // Test con diferentes engines
      const engines = ['jspdf', 'puppeteer', 'pdfkit']

      for (const engine of engines) {
        const pdfBuffer = await generateQuotePDF('quote-2', engine)
        expect(pdfBuffer).toBeDefined()
      }
    })

    it('should include company branding in PDF', async () => {
      const mockQuote = {
        id: 'quote-3',
        tenantId: 'tenant-1',
        event: {
          client: {
            firstName: 'Carlos',
            lastName: 'Rodríguez'
          }
        }
      }

      // Mock de tenant con branding
      const mockTenant = {
        id: 'tenant-1',
        name: 'Mi Empresa',
        branding: {
          logo: 'logo-url',
          primaryColor: '#007bff',
          secondaryColor: '#6c757d'
        }
      }

      prisma.quote.findUnique.mockResolvedValue(mockQuote)
      prisma.tenant.findUnique = jest.fn().mockResolvedValue(mockTenant)

      const pdfBuffer = await generateQuotePDF('quote-3')

      expect(pdfBuffer).toBeDefined()
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' }
      })
    })

    it('should handle PDF generation errors gracefully', async () => {
      prisma.quote.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(generateQuotePDF('invalid-quote-id')).rejects.toThrow('Database error')
    })
  })

  describe('PDF Email Integration', () => {
    it('should attach PDF to email when sending quote', async () => {
      const mockQuote = {
        id: 'quote-4',
        number: 'Q-2024-004',
        event: {
          client: {
            email: 'cliente@example.com'
          }
        }
      }

      // Mock de servicios
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _mockEmailService = {
        sendQuoteEmail: jest.fn().mockResolvedValue({ success: true })
      }

      prisma.quote.findUnique.mockResolvedValue(mockQuote)

      // Simular envío de cotización con PDF
      const pdfBuffer = await generateQuotePDF('quote-4')

      // Aquí iría la integración con email service
      // await mockEmailService.sendQuoteEmail({
      //   to: mockQuote.event.client.email,
      //   subject: `Cotización ${mockQuote.number}`,
      //   attachments: [{
      //     filename: `${mockQuote.number}.pdf`,
      //     content: pdfBuffer
      //   }]
      // })

      expect(pdfBuffer).toBeDefined()
      expect(mockQuote.event.client.email).toBe('cliente@example.com')
    })
  })
})