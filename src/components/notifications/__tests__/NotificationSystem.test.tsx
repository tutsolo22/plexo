/**
 * Tests para NotificationSystem
 * Sistema de Gestión de Eventos V3
 */

import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '../../../lib/test-utils'
import NotificationSystem from '../NotificationSystem'
import { mockData } from '../../../lib/test-utils'

// Mock de EventSource para SSE
class MockEventSource {
  url: string
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readyState: number = 1

  constructor(url: string) {
    this.url = url
    // Simular conexión exitosa después de un delay
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  close() {
    this.readyState = 2
  }

  // Método para simular mensajes en tests
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data)
      })
      this.onmessage(event)
    }
  }

  // Método para simular errores en tests
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

// Mock global de EventSource
global.EventSource = MockEventSource as any

describe('NotificationSystem', () => {
  let mockEventSource: MockEventSource

  beforeEach(() => {
    // Capturar la instancia de EventSource para poder controlarla en tests
    const originalEventSource = global.EventSource
    global.EventSource = jest.fn((url: string) => {
      mockEventSource = new MockEventSource(url)
      return mockEventSource
    }) as any
  })

  afterEach(() => {
    jest.clearAllMocks()
    if (mockEventSource) {
      mockEventSource.close()
    }
  })

  it('should render notification bell icon', () => {
    render(<NotificationSystem />)
    
    expect(screen.getByRole('button', { name: /notificaciones/i })).toBeInTheDocument()
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument()
  })

  it('should establish SSE connection on mount', async () => {
    render(<NotificationSystem />)
    
    await waitFor(() => {
      expect(global.EventSource).toHaveBeenCalledWith('/api/notifications/stream')
    })
  })

  it('should display notification badge when there are unread notifications', async () => {
    render(<NotificationSystem />)
    
    // Simular recepción de notificación
    act(() => {
      mockEventSource.simulateMessage(mockData.notifications[0])
    })

    await waitFor(() => {
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('should open notification panel when bell is clicked', async () => {
    render(<NotificationSystem />)
    
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByTestId('notification-panel')).toBeInTheDocument()
      expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    })
  })

  it('should display received notifications in the panel', async () => {
    render(<NotificationSystem />)
    
    // Simular notificaciones
    act(() => {
      mockEventSource.simulateMessage(mockData.notifications[0])
      mockEventSource.simulateMessage(mockData.notifications[1])
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('Nueva Cotización Creada')).toBeInTheDocument()
      expect(screen.getByText('Evento Próximo')).toBeInTheDocument()
      expect(screen.getByText('Cotización Q-2024-001 para Cliente Premium')).toBeInTheDocument()
      expect(screen.getByText('Evento Corporativo comienza en 2 horas')).toBeInTheDocument()
    })
  })

  it('should show different icons based on notification type', async () => {
    render(<NotificationSystem />)
    
    // Simular diferentes tipos de notificaciones
    act(() => {
      mockEventSource.simulateMessage({
        type: 'new_quote',
        title: 'Nueva Cotización',
        message: 'Test quote notification'
      })
      mockEventSource.simulateMessage({
        type: 'upcoming_event',
        title: 'Evento Próximo',
        message: 'Test event notification'
      })
      mockEventSource.simulateMessage({
        type: 'email_opened',
        title: 'Email Abierto',
        message: 'Test email notification'
      })
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByTestId('icon-file-text')).toBeInTheDocument() // Quote icon
      expect(screen.getByTestId('icon-calendar')).toBeInTheDocument() // Event icon  
      expect(screen.getByTestId('icon-mail')).toBeInTheDocument() // Email icon
    })
  })

  it('should handle priority notifications differently', async () => {
    render(<NotificationSystem />)
    
    // Simular notificación de alta prioridad
    act(() => {
      mockEventSource.simulateMessage({
        ...mockData.notifications[1],
        priority: 'high'
      })
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      const notification = screen.getByTestId('notification-item-high')
      expect(notification).toHaveClass('border-red-200') // Clase de alta prioridad
    })
  })

  it('should clear all notifications when clear button is clicked', async () => {
    render(<NotificationSystem />)
    
    // Simular notificaciones
    act(() => {
      mockEventSource.simulateMessage(mockData.notifications[0])
      mockEventSource.simulateMessage(mockData.notifications[1])
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('Nueva Cotización Creada')).toBeInTheDocument()
    })

    // Click en limpiar todo
    const clearButton = screen.getByRole('button', { name: /limpiar todo/i })
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText(/No hay notificaciones/i)).toBeInTheDocument()
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
    })
  })

  it('should mark notifications as read when panel is opened', async () => {
    render(<NotificationSystem />)
    
    // Simular notificación
    act(() => {
      mockEventSource.simulateMessage(mockData.notifications[0])
    })

    // Verificar badge presente
    await waitFor(() => {
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument()
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    // Cerrar panel
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
    })
  })

  it('should handle connection errors gracefully', async () => {
    render(<NotificationSystem />)
    
    // Simular error de conexión
    act(() => {
      mockEventSource.simulateError()
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument()
    })
  })

  it('should close connection when component unmounts', () => {
    const { unmount } = render(<NotificationSystem />)
    
    const closeSpy = jest.spyOn(mockEventSource, 'close')
    
    unmount()
    
    expect(closeSpy).toHaveBeenCalled()
  })

  it('should limit the number of displayed notifications', async () => {
    render(<NotificationSystem />)
    
    // Simular más notificaciones que el límite (supongamos límite de 10)
    act(() => {
      for (let i = 0; i < 15; i++) {
        mockEventSource.simulateMessage({
          type: 'new_quote',
          title: `Notificación ${i}`,
          message: `Mensaje ${i}`,
          timestamp: new Date().toISOString()
        })
      }
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      const notifications = screen.getAllByTestId(/notification-item/)
      expect(notifications).toHaveLength(10) // Máximo 10 notificaciones
    })
  })

  it('should show timestamp for notifications', async () => {
    render(<NotificationSystem />)
    
    act(() => {
      mockEventSource.simulateMessage({
        ...mockData.notifications[0],
        timestamp: '2024-06-01T10:30:00.000Z'
      })
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      // Verificar que se muestra algún formato de tiempo
      expect(screen.getByText(/hace|ago/i)).toBeInTheDocument()
    })
  })

  it('should handle heartbeat messages without displaying them', async () => {
    render(<NotificationSystem />)
    
    // Simular heartbeat
    act(() => {
      mockEventSource.simulateMessage({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })
    })

    // Abrir panel
    const bellButton = screen.getByRole('button', { name: /notificaciones/i })
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText(/No hay notificaciones/i)).toBeInTheDocument()
    })
  })
})