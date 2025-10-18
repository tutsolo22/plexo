/**
 * Tests para Middleware
 * Sistema de Gestión de Eventos V3
 */

import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'

// Mock de auth
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: mockAuth
}))

// Mock de NextResponse
const mockRedirect = jest.fn()
const mockNext = jest.fn()

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: mockRedirect,
    next: mockNext
  }
}))

// Helper para crear requests de prueba
function createTestRequest(url: string, headers: Record<string, string> = {}) {
  return {
    nextUrl: new URL(url),
    headers: new Map(Object.entries(headers)),
    cookies: new Map(),
    url,
    method: 'GET'
  } as unknown as NextRequest
}

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNext.mockReturnValue(new Response())
    mockRedirect.mockReturnValue(new Response())
  })

  describe('Authentication Routes', () => {
    it('should allow access to sign-in page when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = createTestRequest('http://localhost:3000/auth/signin')
      const response = await middleware(request)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should redirect to dashboard when authenticated user visits sign-in', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', role: 'TENANT_ADMIN' }
      })
      
      const request = createTestRequest('http://localhost:3000/auth/signin')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/dashboard', request.nextUrl)
      )
    })

    it('should allow access to API auth routes', async () => {
      const request = createTestRequest('http://localhost:3000/api/auth/signin')
      const response = await middleware(request)

      expect(mockNext).toHaveBeenCalled()
      expect(mockAuth).not.toHaveBeenCalled()
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to sign-in when accessing dashboard without authentication', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = createTestRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin?callbackUrl=/dashboard', request.nextUrl)
      )
    })

    it('should allow access to dashboard when authenticated', async () => {
      mockAuth.mockResolvedValue({
        user: { 
          id: '1', 
          email: 'test@example.com', 
          role: 'TENANT_ADMIN',
          tenantId: 'tenant-1'
        }
      })
      
      const request = createTestRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should protect nested dashboard routes', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = createTestRequest('http://localhost:3000/dashboard/events')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin?callbackUrl=/dashboard/events', request.nextUrl)
      )
    })

    it('should protect API routes that require authentication', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = createTestRequest('http://localhost:3000/api/analytics')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin?callbackUrl=/api/analytics', request.nextUrl)
      )
    })
  })

  describe('Role-based Access Control', () => {
    it('should allow ADMIN to access all routes', async () => {
      mockAuth.mockResolvedValue({
        user: { 
          id: '1', 
          email: 'admin@example.com', 
          role: 'ADMIN',
          tenantId: null
        }
      })
      
      const dashboardRequest = createTestRequest('http://localhost:3000/dashboard')
      const adminRequest = createTestRequest('http://localhost:3000/admin')
      
      await middleware(dashboardRequest)
      await middleware(adminRequest)

      expect(mockNext).toHaveBeenCalledTimes(2)
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should allow TENANT_ADMIN to access tenant routes', async () => {
      mockAuth.mockResolvedValue({
        user: { 
          id: '2', 
          email: 'tenant@example.com', 
          role: 'TENANT_ADMIN',
          tenantId: 'tenant-1'
        }
      })
      
      const request = createTestRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should restrict TENANT_ADMIN from admin routes', async () => {
      mockAuth.mockResolvedValue({
        user: { 
          id: '2', 
          email: 'tenant@example.com', 
          role: 'TENANT_ADMIN',
          tenantId: 'tenant-1'
        }
      })
      
      const request = createTestRequest('http://localhost:3000/admin')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/dashboard', request.nextUrl)
      )
    })

    it('should handle USER role restrictions', async () => {
      mockAuth.mockResolvedValue({
        user: { 
          id: '3', 
          email: 'user@example.com', 
          role: 'USER',
          tenantId: 'tenant-1'
        }
      })
      
      const dashboardRequest = createTestRequest('http://localhost:3000/dashboard')
      const adminRequest = createTestRequest('http://localhost:3000/admin')
      
      await middleware(dashboardRequest)
      expect(mockNext).toHaveBeenCalled()
      
      await middleware(adminRequest)
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/dashboard', adminRequest.nextUrl)
      )
    })
  })

  describe('Public Routes', () => {
    it('should allow access to home page without authentication', async () => {
      const request = createTestRequest('http://localhost:3000/')
      const response = await middleware(request)

      expect(mockNext).toHaveBeenCalled()
      expect(mockAuth).not.toHaveBeenCalled()
    })

    it('should allow access to static assets', async () => {
      const requests = [
        createTestRequest('http://localhost:3000/_next/static/css/app.css'),
        createTestRequest('http://localhost:3000/_next/static/js/main.js'),
        createTestRequest('http://localhost:3000/favicon.ico'),
        createTestRequest('http://localhost:3000/images/logo.png')
      ]

      for (const request of requests) {
        const response = await middleware(request)
        expect(mockNext).toHaveBeenCalled()
      }

      expect(mockAuth).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service unavailable'))
      
      const request = createTestRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin?callbackUrl=/dashboard', request.nextUrl)
      )
    })

    it('should handle invalid session data', async () => {
      mockAuth.mockResolvedValue({
        user: null // Invalid session structure
      })
      
      const request = createTestRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin?callbackUrl=/dashboard', request.nextUrl)
      )
    })

    it('should handle missing role information', async () => {
      mockAuth.mockResolvedValue({
        user: { 
          id: '1', 
          email: 'test@example.com'
          // Missing role
        }
      })
      
      const request = createTestRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin?callbackUrl=/dashboard', request.nextUrl)
      )
    })
  })

  describe('Path Matching', () => {
    it('should correctly identify protected paths', async () => {
      const protectedPaths = [
        '/dashboard',
        '/dashboard/events',
        '/dashboard/clients',
        '/dashboard/quotes',
        '/dashboard/analytics',
        '/api/analytics',
        '/api/events',
        '/api/clients'
      ]

      mockAuth.mockResolvedValue(null)

      for (const path of protectedPaths) {
        const request = createTestRequest(`http://localhost:3000${path}`)
        await middleware(request)
        expect(mockRedirect).toHaveBeenCalled()
        mockRedirect.mockClear()
      }
    })

    it('should correctly identify public paths', async () => {
      const publicPaths = [
        '/',
        '/about',
        '/contact',
        '/_next/static/css/app.css',
        '/_next/static/js/main.js',
        '/favicon.ico',
        '/api/auth/signin',
        '/api/auth/signout'
      ]

      for (const path of publicPaths) {
        const request = createTestRequest(`http://localhost:3000${path}`)
        await middleware(request)
        expect(mockNext).toHaveBeenCalled()
        mockNext.mockClear()
      }

      expect(mockAuth).not.toHaveBeenCalled()
    })
  })

  describe('Callback URL Handling', () => {
    it('should preserve callback URL in redirect', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = createTestRequest('http://localhost:3000/dashboard/events/123')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin?callbackUrl=/dashboard/events/123', request.nextUrl)
      )
    })

    it('should handle complex callback URLs with query parameters', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = createTestRequest('http://localhost:3000/dashboard/analytics?period=6&filter=active')
      const response = await middleware(request)

      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/auth/signin?callbackUrl=/dashboard/analytics?period=6&filter=active', request.nextUrl)
      )
    })
  })

  describe('Headers and Cookies', () => {
    it('should pass through custom headers', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', role: 'TENANT_ADMIN' }
      })
      
      const request = createTestRequest('http://localhost:3000/dashboard', {
        'x-custom-header': 'test-value',
        'authorization': 'Bearer token123'
      })
      
      const response = await middleware(request)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle requests with cookies', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', email: 'test@example.com', role: 'TENANT_ADMIN' }
      })
      
      const request = createTestRequest('http://localhost:3000/dashboard')
      request.cookies.set('session-token', 'abc123')
      
      const response = await middleware(request)

      expect(mockNext).toHaveBeenCalled()
    })
  })
})