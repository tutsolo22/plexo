// Setup para Jest y React Testing Library
import '@testing-library/jest-dom'

// Mock de next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: jest.fn(),
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
      isPreview: false,
    }
  },
}))

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock de NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        tenantId: 'test-tenant-id'
      },
      expires: '2024-12-31'
    },
    status: 'authenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock de Redis
jest.mock('@/lib/redis', () => ({
  redisCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(true),
    exists: jest.fn().mockResolvedValue(false),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(true),
    delPattern: jest.fn().mockResolvedValue(0),
  },
  CacheKeys: {
    ANALYTICS_DASHBOARD: jest.fn().mockReturnValue('analytics:dashboard:test'),
    USER_NOTIFICATIONS: jest.fn().mockReturnValue('notifications:user:test'),
  },
  ANALYTICS_TTL: 900,
  NOTIFICATIONS_TTL: 60,
}))

// Mock de Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  event: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  quote: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock de recharts para evitar problemas de SSR en tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  LineChart: 'div',
  Line: 'div',
  XAxis: 'div',
  YAxis: 'div',
  CartesianGrid: 'div',
  Tooltip: 'div',
  Legend: 'div',
  BarChart: 'div',
  Bar: 'div',
  PieChart: 'div',
  Pie: 'div',
  Cell: 'div',
}))

// Mock de date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => 'mocked-date'),
  startOfMonth: jest.fn((date) => new Date(2025, 0, 1)),
  endOfMonth: jest.fn((date) => new Date(2025, 0, 31)),
  subMonths: jest.fn((date, months) => new Date(2024, 12 - months, 1)),
}))

// Mock console.error para tests más limpios
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Configuración global para tests
global.testConfig = {
  mockUser: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    tenantId: 'test-tenant-id'
  },
  mockSession: {
    user: {
      id: 'test-user-id',
      name: 'Test User', 
      email: 'test@example.com',
      role: 'USER',
      tenantId: 'test-tenant-id'
    },
    expires: '2024-12-31'
  }
}