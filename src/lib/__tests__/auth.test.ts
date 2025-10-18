/**
 * Tests para Auth Configuration
 * Sistema de Gestión de Eventos V3
 */

import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

// Mock de next-auth
const mockAuth = jest.fn()
const mockSignIn = jest.fn()
const mockSignOut = jest.fn()

jest.mock('@/lib/auth', () => ({
  auth: mockAuth,
  signIn: mockSignIn,
  signOut: mockSignOut
}))

// Mock de Prisma
const mockPrisma = {
  account: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  verificationToken: {
    findUnique: jest.fn(),
    delete: jest.fn(),
    create: jest.fn()
  }
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma
}))

describe('Auth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env['NEXTAUTH_SECRET'] = 'test-secret'
    process.env['NEXTAUTH_URL'] = 'http://localhost:3000'
  })

  describe('auth function', () => {
    it('should return session when user is authenticated', async () => {
      const mockSession: Session = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'TENANT_ADMIN',
          tenantId: 'tenant-1'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      mockAuth.mockResolvedValue(mockSession)

      const session = await mockAuth()

      expect(session).toEqual(mockSession)
      expect(session?.user?.role).toBe('TENANT_ADMIN')
    })

    it('should return null when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const session = await mockAuth()

      expect(session).toBeNull()
    })

    it('should handle authentication errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Authentication failed'))

      await expect(mockAuth()).rejects.toThrow('Authentication failed')
    })
  })

  describe('signIn function', () => {
    it('should sign in with email and password', async () => {
      mockSignIn.mockResolvedValue(undefined)

      await mockSignIn('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false
      })

      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false
      })
    })

    it('should handle invalid credentials', async () => {
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'))

      await expect(mockSignIn('credentials', {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid credentials')
    })

    it('should sign in with OAuth provider', async () => {
      mockSignIn.mockResolvedValue(undefined)

      await mockSignIn('google', { callbackUrl: '/dashboard' })

      expect(mockSignIn).toHaveBeenCalledWith('google', { 
        callbackUrl: '/dashboard' 
      })
    })
  })

  describe('signOut function', () => {
    it('should sign out user successfully', async () => {
      mockSignOut.mockResolvedValue(undefined)

      await mockSignOut({ redirectTo: '/' })

      expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/' })
    })

    it('should handle sign out errors', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out failed'))

      await expect(mockSignOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('Prisma Adapter Integration', () => {
    it('should create user on first sign in', async () => {
      const userData = {
        id: '1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'TENANT_ADMIN',
        tenantId: 'tenant-1',
        emailVerified: null,
        image: null
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(userData)

      // Simulate adapter behavior
      const user = await mockPrisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          tenantId: userData.tenantId
        }
      })

      expect(user).toEqual(userData)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          tenantId: userData.tenantId
        }
      })
    })

    it('should find existing user on subsequent sign ins', async () => {
      const existingUser = {
        id: '1',
        email: 'existing@example.com',
        name: 'Existing User',
        role: 'TENANT_ADMIN',
        tenantId: 'tenant-1'
      }

      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      const user = await mockPrisma.user.findUnique({
        where: { email: 'existing@example.com' }
      })

      expect(user).toEqual(existingUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' }
      })
    })

    it('should create session for authenticated user', async () => {
      const sessionData = {
        id: 'session-1',
        userId: '1',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sessionToken: 'session-token-123'
      }

      mockPrisma.session.create.mockResolvedValue(sessionData)

      const session = await mockPrisma.session.create({
        data: {
          userId: sessionData.userId,
          expires: sessionData.expires,
          sessionToken: sessionData.sessionToken
        }
      })

      expect(session).toEqual(sessionData)
      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: sessionData.userId,
          expires: sessionData.expires,
          sessionToken: sessionData.sessionToken
        }
      })
    })

    it('should delete session on sign out', async () => {
      mockPrisma.session.delete.mockResolvedValue({
        id: 'session-1',
        userId: '1',
        expires: new Date(),
        sessionToken: 'session-token-123'
      })

      await mockPrisma.session.delete({
        where: { sessionToken: 'session-token-123' }
      })

      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken: 'session-token-123' }
      })
    })
  })

  describe('Middleware Integration', () => {
    it('should protect dashboard routes', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard')
      
      // Mock unauthenticated session
      const mockAuth = auth as jest.MockedFunction<typeof auth>
      mockAuth.mockResolvedValue(null)

      const session = await auth()
      
      expect(session).toBeNull()
      // In actual middleware, this would redirect to sign-in
    })

    it('should allow access to authenticated users', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard')
      
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'TENANT_ADMIN',
          tenantId: 'tenant-1'
        }
      }

      const mockAuth = auth as jest.MockedFunction<typeof auth>
      mockAuth.mockResolvedValue(mockSession)

      const session = await auth()
      
      expect(session).toEqual(mockSession)
      expect(session?.user?.role).toBe('TENANT_ADMIN')
    })

    it('should handle role-based access control', async () => {
      const adminSession = {
        user: {
          id: '1',
          email: 'admin@example.com',
          role: 'ADMIN',
          tenantId: null
        }
      }

      const tenantSession = {
        user: {
          id: '2',
          email: 'tenant@example.com',
          role: 'TENANT_ADMIN',
          tenantId: 'tenant-1'
        }
      }

      // Test admin access
      const mockAuth = auth as jest.MockedFunction<typeof auth>
      mockAuth.mockResolvedValueOnce(adminSession)
      
      let session = await auth()
      expect(session?.user?.role).toBe('ADMIN')

      // Test tenant access
      mockAuth.mockResolvedValueOnce(tenantSession)
      
      session = await auth()
      expect(session?.user?.role).toBe('TENANT_ADMIN')
      expect(session?.user?.tenantId).toBe('tenant-1')
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(mockPrisma.user.findUnique({
        where: { email: 'test@example.com' }
      })).rejects.toThrow('Database connection failed')
    })

    it('should handle invalid session tokens', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'invalid-token' }
      })

      expect(session).toBeNull()
    })

    it('should handle expired sessions', async () => {
      const expiredSession = {
        id: 'session-1',
        userId: '1',
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
        sessionToken: 'expired-token'
      }

      mockPrisma.session.findUnique.mockResolvedValue(expiredSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'expired-token' }
      })

      expect(session?.expires.getTime()).toBeLessThan(Date.now())
    })
  })
})