require('@testing-library/jest-dom')

// Mock básico de Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))

// Mock de NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'TENANT_ADMIN',
        tenantId: 'tenant-1'
      }
    },
    status: 'authenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock de fetch global
global.fetch = jest.fn()

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock de EventSource para SSE
global.EventSource = class EventSource {
  constructor(url) {
    this.url = url
    this.readyState = 1
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    setTimeout(() => {
      if (this.onopen) this.onopen()
    }, 100)
  }
  
  close() {
    this.readyState = 2
  }
  
  addEventListener(event, handler) {
    if (event === 'message') this.onmessage = handler
    if (event === 'error') this.onerror = handler
    if (event === 'open') this.onopen = handler
  }
  
  removeEventListener() {}
}