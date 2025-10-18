/**
 * Utilidades para testing
 * Sistema de Gestión de Eventos V3
 * 
 * @author Manuel Antonio Tut Solorzano
 * @version 3.0.0
 * @date 2025-10-17
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'

// Mock de datos comunes para tests
export const mockData = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER' as const,
    tenantId: 'test-tenant-id'
  },
  
  session: {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER' as const,
      tenantId: 'test-tenant-id'
    },
    expires: '2024-12-31'
  },
  
  analytics: {
    period: '6 meses',
    dateRange: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-06-30T23:59:59.999Z'
    },
    summary: {
      totalEvents: 25,
      totalQuotes: 18,
      totalClients: 12,
      totalRevenue: 75000,
      averageQuoteValue: '4166.67'
    },
    charts: {
      eventsByMonth: [
        { month: 'Jan 2024', count: 4, date: '2024-01-01T00:00:00.000Z' },
        { month: 'Feb 2024', count: 6, date: '2024-02-01T00:00:00.000Z' },
        { month: 'Mar 2024', count: 8, date: '2024-03-01T00:00:00.000Z' },
      ],
      revenueByMonth: [
        { month: 'Jan 2024', revenue: 12000, date: '2024-01-01T00:00:00.000Z' },
        { month: 'Feb 2024', revenue: 18000, date: '2024-02-01T00:00:00.000Z' },
        { month: 'Mar 2024', revenue: 25000, date: '2024-03-01T00:00:00.000Z' },
      ],
      quotesByStatus: [
        { status: 'APPROVED', count: 10, label: 'Aprobada' },
        { status: 'SENT', count: 5, label: 'Enviada' },
        { status: 'DRAFT', count: 3, label: 'Borrador' },
      ]
    },
    topClients: [
      {
        id: 'client-1',
        name: 'Cliente Premium',
        email: 'premium@example.com',
        totalRevenue: 25000,
        quotesCount: 5
      },
      {
        id: 'client-2', 
        name: 'Cliente Corporativo',
        email: 'corp@example.com',
        totalRevenue: 18000,
        quotesCount: 3
      }
    ],
    upcomingEvents: [
      {
        id: 'event-1',
        title: 'Evento Corporativo 2024',
        client: 'Cliente Premium',
        startDate: '2024-07-15T10:00:00.000Z',
        status: 'CONFIRMED'
      }
    ],
    emailStats: {
      totalSent: 45,
      totalOpened: 32,
      openRate: '71.11'
    },
    generatedAt: '2024-06-01T12:00:00.000Z',
    user: {
      id: 'test-user-id',
      name: 'Test User'
    },
    fromCache: false
  },
  
  notifications: [
    {
      type: 'new_quote',
      title: 'Nueva Cotización Creada',
      message: 'Cotización Q-2024-001 para Cliente Premium',
      data: {
        quoteId: 'quote-1',
        quoteNumber: 'Q-2024-001',
        clientName: 'Cliente Premium',
        eventTitle: 'Evento Corporativo',
        amount: 15000
      },
      timestamp: '2024-06-01T10:30:00.000Z',
      priority: 'normal' as const
    },
    {
      type: 'upcoming_event',
      title: 'Evento Próximo',
      message: 'Evento Corporativo comienza en 2 horas',
      data: {
        eventId: 'event-1',
        title: 'Evento Corporativo',
        clientName: 'Cliente Premium',
        startDate: '2024-06-01T14:00:00.000Z',
        hoursUntil: 2
      },
      timestamp: '2024-06-01T12:00:00.000Z',
      priority: 'high' as const
    }
  ]
}

// Wrapper personalizado con providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any
}

const AllTheProviders = ({ 
  children, 
  session = mockData.session 
}: { 
  children: ReactNode
  session?: any 
}) => {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}

// Función de render personalizada
export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { session, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders session={session}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Helpers para mocking
export const mockFetch = (data: any, ok = true, status = 200) => {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  })
}

export const mockApiResponse = (data: any, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      })
    }, delay)
  })
}

// Helpers para testing de eventos
export const createMockEvent = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  ...overrides,
})

// Helper para testing de componentes con fetch
export const setupFetchMock = (responses: Record<string, any>) => {
  global.fetch = jest.fn((url: string) => {
    const endpoint = Object.keys(responses).find(key => url.includes(key))
    if (endpoint) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responses[endpoint]),
      })
    }
    return Promise.reject(new Error(`No mock response for ${url}`))
  }) as jest.Mock
}

// Helper para esperar actualizaciones asíncronas
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Matcher personalizado para testing
expect.extend({
  toBeInTheDocument(received) {
    const pass = received && received.ownerDocument && received.ownerDocument.body.contains(received)
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    }
  },
})

// Re-export everything
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export render personalizado como default
export { customRender as render }