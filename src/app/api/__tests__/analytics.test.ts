/**
 * Tests para API Analytics
 * Sistema de Gestión de Eventos V3
 */

import { NextRequest } from 'next/server'
import { GET } from '../analytics/route'

// Mock de auth
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: mockAuth
}))

// Mock de Redis
const mockRedisCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}
jest.mock('@/lib/redis', () => ({
  redisCache: mockRedisCache,
  CacheKeys: {
    ANALYTICS_DASHBOARD: (period: string, tenantId: string) => 
      `analytics:dashboard:${period}:${tenantId}`
  }
}))

// Mock de Prisma
const mockPrisma = {
  event: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn()
  },
  client: {
    count: jest.fn()
  },
  quote: {
    count: jest.fn(),
    aggregate: jest.fn()
  },
  email: {
    count: jest.fn()
  }
}
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma
}))

describe('/api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/analytics', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'TENANT_ADMIN',
        tenantId: 'tenant-1'
      }
    }

    it('should return analytics data for authenticated user', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockRedisCache.get.mockResolvedValue(null) // Cache miss

      // Mock database responses
      mockPrisma.event.count.mockResolvedValue(25)
      mockPrisma.client.count.mockResolvedValue(50)
      mockPrisma.quote.count.mockResolvedValue(15)
      mockPrisma.email.count.mockResolvedValue(100)
      
      mockPrisma.event.aggregate.mockResolvedValue({
        _sum: { totalCost: 75000, attendees: 1200 }
      })
      
      mockPrisma.quote.aggregate.mockResolvedValue({
        _sum: { amount: 125000 }
      })

      mockPrisma.event.findMany.mockResolvedValue([
        { date: new Date('2023-01-15'), totalCost: 5000, attendees: 50 },
        { date: new Date('2023-02-20'), totalCost: 7500, attendees: 75 },
        { date: new Date('2023-03-10'), totalCost: 6000, attendees: 60 }
      ])

      const request = new NextRequest('http://localhost:3000/api/analytics?period=6')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('summary')
      expect(data.data).toHaveProperty('monthlyData')
      expect(data.data.summary).toEqual({
        totalEvents: 25,
        totalClients: 50,
        totalQuotes: 15,
        totalRevenue: 125000,
        totalCost: 75000,
        totalAttendees: 1200,
        totalEmails: 100
      })
    })

    it('should return cached data when available', async () => {
      mockAuth.mockResolvedValue(mockSession)
      
      const cachedData = {
        summary: { totalEvents: 25, totalClients: 50 },
        monthlyData: [],
        generatedAt: new Date().toISOString(),
        fromCache: true
      }
      
      mockRedisCache.get.mockResolvedValue(cachedData)

      const request = new NextRequest('http://localhost:3000/api/analytics?period=6')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.fromCache).toBe(true)
      expect(mockPrisma.event.count).not.toHaveBeenCalled()
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No autorizado')
    })

    it('should filter data by tenant for TENANT_ADMIN', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockRedisCache.get.mockResolvedValue(null)

      mockPrisma.event.count.mockResolvedValue(10)
      mockPrisma.client.count.mockResolvedValue(20)
      mockPrisma.quote.count.mockResolvedValue(5)
      mockPrisma.email.count.mockResolvedValue(50)
      
      mockPrisma.event.aggregate.mockResolvedValue({
        _sum: { totalCost: 25000, attendees: 400 }
      })
      
      mockPrisma.quote.aggregate.mockResolvedValue({
        _sum: { amount: 45000 }
      })

      mockPrisma.event.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/analytics?period=12')
      await GET(request)

      // Verify tenant filtering is applied
      expect(mockPrisma.event.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', date: expect.any(Object) }
      })
      expect(mockPrisma.client.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' }
      })
    })

    it('should handle different time periods', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockRedisCache.get.mockResolvedValue(null)

      // Mock minimal responses
      mockPrisma.event.count.mockResolvedValue(0)
      mockPrisma.client.count.mockResolvedValue(0)
      mockPrisma.quote.count.mockResolvedValue(0)
      mockPrisma.email.count.mockResolvedValue(0)
      mockPrisma.event.aggregate.mockResolvedValue({ _sum: { totalCost: null, attendees: null } })
      mockPrisma.quote.aggregate.mockResolvedValue({ _sum: { amount: null } })
      mockPrisma.event.findMany.mockResolvedValue([])

      // Test 1 month period
      const request1 = new NextRequest('http://localhost:3000/api/analytics?period=1')
      const response1 = await GET(request1)
      expect(response1.status).toBe(200)

      // Test 3 months period
      const request3 = new NextRequest('http://localhost:3000/api/analytics?period=3')
      const response3 = await GET(request3)
      expect(response3.status).toBe(200)

      // Test 12 months period
      const request12 = new NextRequest('http://localhost:3000/api/analytics?period=12')
      const response12 = await GET(request12)
      expect(response12.status).toBe(200)
    })

    it('should cache generated analytics data', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockRedisCache.get.mockResolvedValue(null)
      mockRedisCache.set.mockResolvedValue(true)

      // Mock database responses
      mockPrisma.event.count.mockResolvedValue(5)
      mockPrisma.client.count.mockResolvedValue(10)
      mockPrisma.quote.count.mockResolvedValue(3)
      mockPrisma.email.count.mockResolvedValue(20)
      mockPrisma.event.aggregate.mockResolvedValue({ _sum: { totalCost: 15000, attendees: 200 } })
      mockPrisma.quote.aggregate.mockResolvedValue({ _sum: { amount: 25000 } })
      mockPrisma.event.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/analytics?period=6')
      await GET(request)

      expect(mockRedisCache.set).toHaveBeenCalledWith(
        'analytics:dashboard:6:tenant-1',
        expect.objectContaining({
          summary: expect.any(Object),
          monthlyData: expect.any(Array)
        }),
        900 // 15 minutes TTL
      )
    })

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockRedisCache.get.mockResolvedValue(null)
      
      mockPrisma.event.count.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/analytics?period=6')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Error interno del servidor')
    })

    it('should validate period parameter', async () => {
      mockAuth.mockResolvedValue(mockSession)

      // Test invalid period
      const request = new NextRequest('http://localhost:3000/api/analytics?period=invalid')
      const response = await GET(request)

      expect(response.status).toBe(200) // Should default to 6 months
      
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should handle ADMIN role without tenant filtering', async () => {
      const adminSession = {
        user: {
          id: '1',
          email: 'admin@example.com',
          role: 'ADMIN',
          tenantId: null
        }
      }

      mockAuth.mockResolvedValue(adminSession)
      mockRedisCache.get.mockResolvedValue(null)

      mockPrisma.event.count.mockResolvedValue(100)
      mockPrisma.client.count.mockResolvedValue(200)
      mockPrisma.quote.count.mockResolvedValue(50)
      mockPrisma.email.count.mockResolvedValue(500)
      mockPrisma.event.aggregate.mockResolvedValue({ _sum: { totalCost: 500000, attendees: 5000 } })
      mockPrisma.quote.aggregate.mockResolvedValue({ _sum: { amount: 750000 } })
      mockPrisma.event.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/analytics?period=6')
      await GET(request)

      // Verify no tenant filtering for ADMIN
      expect(mockPrisma.event.count).toHaveBeenCalledWith({
        where: { date: expect.any(Object) }
      })
      expect(mockPrisma.client.count).toHaveBeenCalledWith({
        where: {}
      })
    })

    it('should generate monthly data correctly', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockRedisCache.get.mockResolvedValue(null)

      const mockEvents = [
        { 
          date: new Date('2023-01-15'), 
          totalCost: 5000, 
          attendees: 50,
          client: { name: 'Client A' }
        },
        { 
          date: new Date('2023-01-25'), 
          totalCost: 7500, 
          attendees: 75,
          client: { name: 'Client B' }
        },
        { 
          date: new Date('2023-02-10'), 
          totalCost: 6000, 
          attendees: 60,
          client: { name: 'Client C' }
        }
      ]

      mockPrisma.event.count.mockResolvedValue(3)
      mockPrisma.client.count.mockResolvedValue(3)
      mockPrisma.quote.count.mockResolvedValue(2)
      mockPrisma.email.count.mockResolvedValue(15)
      mockPrisma.event.aggregate.mockResolvedValue({ _sum: { totalCost: 18500, attendees: 185 } })
      mockPrisma.quote.aggregate.mockResolvedValue({ _sum: { amount: 25000 } })
      mockPrisma.event.findMany.mockResolvedValue(mockEvents)

      const request = new NextRequest('http://localhost:3000/api/analytics?period=6')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.monthlyData).toBeInstanceOf(Array)
      expect(data.data.monthlyData.length).toBeGreaterThan(0)
      expect(data.data.monthlyData[0]).toHaveProperty('month')
      expect(data.data.monthlyData[0]).toHaveProperty('events')
      expect(data.data.monthlyData[0]).toHaveProperty('revenue')
    })
  })
})
