/**
 * Utilidades para gráficos y visualización de datos
 * Casona María - Sistema de Gestión de Eventos
 */

// Tipos para datos de gráficos
export interface RevenueDataPoint {
  date: string
  revenue: number
  events: number
}

export interface StatsDataPoint {
  name: string
  value: number
  change?: number
  color?: string
}

// Configuraciones de colores para gráficos
export const CHART_COLORS = {
  primary: '#8B5CF6',    // Violet-500
  secondary: '#06B6D4',  // Cyan-500
  success: '#10B981',    // Emerald-500
  warning: '#F59E0B',    // Amber-500
  danger: '#EF4444',     // Red-500
  info: '#3B82F6',       // Blue-500
  gray: '#6B7280'        // Gray-500
} as const

export const CHART_GRADIENTS = {
  primary: ['#8B5CF6', '#A78BFA'],
  revenue: ['#10B981', '#34D399'],
  events: ['#3B82F6', '#60A5FA'],
  clients: ['#F59E0B', '#FBBF24']
} as const

/**
 * Formatea números como moneda guatemalteca
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Formatea números grandes con sufijos (K, M, B)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Formatea porcentajes
 */
export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`
}

/**
 * Genera colores para gráficos de torta/dona
 */
export function generatePieColors(count: number): string[] {
  const baseColors = Object.values(CHART_COLORS) as string[]
  const colors: string[] = []
  
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length])
  }
  
  return colors
}

/**
 * Calcula el cambio porcentual entre dos valores
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Obtiene el color para un cambio porcentual
 */
export function getChangeColor(change: number): string {
  if (change > 0) return CHART_COLORS.success
  if (change < 0) return CHART_COLORS.danger
  return CHART_COLORS.gray
}

/**
 * Configuración base para gráficos de Recharts
 */
export const CHART_CONFIG = {
  responsive: true,
  margin: { top: 5, right: 30, left: 20, bottom: 5 },
  grid: {
    strokeDasharray: '3 3',
    stroke: '#E5E7EB' // Gray-200
  },
  axis: {
    tick: { fontSize: 12, fill: '#6B7280' }, // Gray-500
    axisLine: { stroke: '#E5E7EB' },
    tickLine: { stroke: '#E5E7EB' }
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      fontSize: '14px'
    },
    cursor: { fill: 'rgba(139, 92, 246, 0.1)' }
  }
} as const

/**
 * Prepara datos para gráfico de revenue
 */
export function prepareRevenueChartData(data: RevenueDataPoint[]): any[] {
  return data.map(point => ({
    date: formatDate(point.date),
    revenue: point.revenue,
    events: point.events,
    formattedRevenue: formatCurrency(point.revenue)
  }))
}

/**
 * Prepara datos para gráfico de estadísticas
 */
export function prepareStatsChartData(data: StatsDataPoint[]): any[] {
  return data.map(point => ({
    ...point,
    formattedValue: typeof point.value === 'number' && point.name.toLowerCase().includes('revenue') 
      ? formatCurrency(point.value)
      : formatNumber(point.value),
    changeColor: point.change ? getChangeColor(point.change) : CHART_COLORS.gray
  }))
}

/**
 * Formatea fechas para mostrar en gráficos
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return dateString
  }
}

/**
 * Formatea fechas completas
 */
export function formatFullDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    })
  } catch {
    return dateString
  }
}

/**
 * Obtiene el rango de fechas para filtros
 */
export function getDateRanges() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const lastQuarter = new Date(today)
  lastQuarter.setMonth(lastQuarter.getMonth() - 3)
  
  const lastYear = new Date(today)
  lastYear.setFullYear(lastYear.getFullYear() - 1)

  return {
    today: today.toISOString().split('T')[0],
    yesterday: yesterday.toISOString().split('T')[0],
    lastWeek: lastWeek.toISOString().split('T')[0],
    lastMonth: lastMonth.toISOString().split('T')[0],
    lastQuarter: lastQuarter.toISOString().split('T')[0],
    lastYear: lastYear.toISOString().split('T')[0]
  }
}

/**
 * Configuración para tooltip de revenue
 */
export const REVENUE_TOOLTIP_CONFIG = {
  formatter: (value: number, name: string) => {
    if (name === 'revenue') {
      return [formatCurrency(value), 'Revenue']
    }
    if (name === 'events') {
      return [value, 'Eventos']
    }
    return [value, name]
  },
  labelStyle: { color: '#374151', fontWeight: 500 },
  contentStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  }
}