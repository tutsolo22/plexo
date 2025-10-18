/**
 * Tests para Analytics Dashboard
 * Sistema de Gestión de Eventos V3
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '../../../lib/test-utils'
import AnalyticsDashboard from '../AnalyticsDashboard'
import { mockData, setupFetchMock } from '../../../lib/test-utils'

// Mock del componente recharts para evitar problemas de SSR
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}))

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    // Setup fetch mock con datos de analytics
    setupFetchMock({
      '/api/analytics/dashboard': mockData.analytics
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByText('Cargando estadísticas...')).toBeInTheDocument()
  })

  it('should display analytics data after loading', async () => {
    render(<AnalyticsDashboard />)
    
    // Esperar a que carguen los datos
    await waitFor(() => {
      expect(screen.queryByText('Cargando estadísticas...')).not.toBeInTheDocument()
    })

    // Verificar métricas principales
    expect(screen.getByText('25')).toBeInTheDocument() // Total Events
    expect(screen.getByText('18')).toBeInTheDocument() // Total Quotes
    expect(screen.getByText('12')).toBeInTheDocument() // Total Clients
    expect(screen.getByText('$75,000')).toBeInTheDocument() // Total Revenue
  })

  it('should display the correct period in the header', async () => {
    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard - 6 meses')).toBeInTheDocument()
    })
  })

  it('should render charts with correct data', async () => {
    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      // Verificar que los contenedores de gráficos están presentes
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(3) // 3 gráficos
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })

  it('should display top clients data', async () => {
    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Top Clientes')).toBeInTheDocument()
      expect(screen.getByText('Cliente Premium')).toBeInTheDocument()
      expect(screen.getByText('Cliente Corporativo')).toBeInTheDocument()
      expect(screen.getByText('$25,000')).toBeInTheDocument()
      expect(screen.getByText('$18,000')).toBeInTheDocument()
    })
  })

  it('should display upcoming events', async () => {
    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Próximos Eventos')).toBeInTheDocument()
      expect(screen.getByText('Evento Corporativo 2024')).toBeInTheDocument()
      expect(screen.getByText('Cliente Premium')).toBeInTheDocument()
    })
  })

  it('should show email statistics when available', async () => {
    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Estadísticas de Email')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument() // Emails enviados
      expect(screen.getByText('32')).toBeInTheDocument() // Emails abiertos
      expect(screen.getByText('71.11%')).toBeInTheDocument() // Open rate
    })
  })

  it('should handle period change', async () => {
    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando estadísticas...')).not.toBeInTheDocument()
    })

    // Setup nuevo mock para período diferente
    setupFetchMock({
      '/api/analytics/dashboard?period=12': {
        ...mockData.analytics,
        period: '12 meses',
        summary: {
          ...mockData.analytics.summary,
          totalEvents: 50
        }
      }
    })

    // Buscar y hacer click en selector de período
    const periodSelector = screen.getByRole('combobox', { name: /período/i })
    fireEvent.change(periodSelector, { target: { value: '12' } })

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard - 12 meses')).toBeInTheDocument()
    })
  })

  it('should handle API error gracefully', async () => {
    // Mock fetch para devolver error
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))

    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar/i)).toBeInTheDocument()
    })
  })

  it('should display cache indicator when data comes from cache', async () => {
    // Setup mock con data desde cache
    setupFetchMock({
      '/api/analytics/dashboard': {
        ...mockData.analytics,
        fromCache: true
      }
    })

    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Datos desde caché/i)).toBeInTheDocument()
    })
  })

  it('should handle empty data gracefully', async () => {
    // Setup mock con datos vacíos
    setupFetchMock({
      '/api/analytics/dashboard': {
        ...mockData.analytics,
        summary: {
          totalEvents: 0,
          totalQuotes: 0,
          totalClients: 0,
          totalRevenue: 0,
          averageQuoteValue: '0'
        },
        topClients: [],
        upcomingEvents: []
      }
    })

    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument() // Debería mostrar 0s
      expect(screen.getByText(/No hay eventos próximos/i)).toBeInTheDocument()
      expect(screen.getByText(/No hay clientes para mostrar/i)).toBeInTheDocument()
    })
  })

  it('should be accessible', async () => {
    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando estadísticas...')).not.toBeInTheDocument()
    })

    // Verificar elementos de accesibilidad
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getAllByRole('heading')).toHaveLength(5) // Headers de secciones
    
    // Verificar ARIA labels
    const charts = screen.getAllByRole('img', { hidden: true })
    expect(charts.length).toBeGreaterThan(0)
  })

  it('should refresh data when refresh button is clicked', async () => {
    render(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando estadísticas...')).not.toBeInTheDocument()
    })

    // Setup nuevo mock con datos actualizados
    setupFetchMock({
      '/api/analytics/dashboard': {
        ...mockData.analytics,
        summary: {
          ...mockData.analytics.summary,
          totalEvents: 30 // Valor actualizado
        }
      }
    })

    // Click en botón de refresh
    const refreshButton = screen.getByRole('button', { name: /actualizar/i })
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(screen.getByText('30')).toBeInTheDocument() // Nuevo valor
    })
  })
})