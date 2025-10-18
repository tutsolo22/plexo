/**
 * Tests para Database Utilities
 * Sistema de Gestión de Eventos V3
 */

import { 
  DatabaseOptimizer, 
  withDatabaseRetry, 
  validatePaginationParams,
  buildWhereClause 
} from '@/lib/database-optimizer'

// Mock de Prisma
const mockPrisma = {
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
  event: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn()
  },
  client: {
    findMany: jest.fn(),
    count: jest.fn()
  }
}

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma
}))

describe('Database Optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('DatabaseOptimizer class', () => {
    let optimizer: DatabaseOptimizer

    beforeEach(() => {
      optimizer = new DatabaseOptimizer()
    })

    it('should create indexes successfully', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(undefined)

      await optimizer.createIndexes()

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(8)
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS')
      )
    })

    it('should handle index creation errors gracefully', async () => {
      mockPrisma.$executeRaw.mockRejectedValue(new Error('Index already exists'))

      // Should not throw error
      await expect(optimizer.createIndexes()).resolves.toBeUndefined()
    })

    it('should analyze table statistics', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(undefined)

      await optimizer.analyzeTableStats()

      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('ANALYZE TABLE')
      )
    })

    it('should optimize specific table queries', async () => {
      const mockStats = [
        { table_name: 'Event', rows: 1000, avg_row_length: 256 },
        { table_name: 'Client', rows: 500, avg_row_length: 128 }
      ]
      
      mockPrisma.$queryRaw.mockResolvedValue(mockStats)

      const stats = await optimizer.getTableStats()

      expect(stats).toEqual(mockStats)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('SELECT table_name')
      )
    })

    it('should optimize slow queries', async () => {
      const mockSlowQueries = [
        { 
          sql_text: 'SELECT * FROM Event WHERE date > ?',
          execution_count: 100,
          total_timer_wait: 5000000000
        }
      ]

      mockPrisma.$queryRaw.mockResolvedValue(mockSlowQueries)

      const slowQueries = await optimizer.getSlowQueries()

      expect(slowQueries).toEqual(mockSlowQueries)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('performance_schema')
      )
    })
  })

  describe('withDatabaseRetry', () => {
    it('should execute function successfully on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true })

      const result = await withDatabaseRetry(mockFn)

      expect(result).toEqual({ success: true })
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on database connection error', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce({ success: true })

      const result = await withDatabaseRetry(mockFn, 3, 100)

      expect(result).toEqual({ success: true })
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'))

      await expect(withDatabaseRetry(mockFn, 2, 50)).rejects.toThrow('Persistent error')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should not retry on non-retryable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Syntax error'))

      await expect(withDatabaseRetry(mockFn, 3, 100)).rejects.toThrow('Syntax error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should respect custom retry delay', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce({ success: true })

      const startTime = Date.now()
      await withDatabaseRetry(mockFn, 2, 200)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('validatePaginationParams', () => {
    it('should validate correct pagination parameters', () => {
      const result = validatePaginationParams(2, 20)

      expect(result).toEqual({ page: 2, limit: 20 })
    })

    it('should default invalid page to 1', () => {
      expect(validatePaginationParams(0, 20)).toEqual({ page: 1, limit: 20 })
      expect(validatePaginationParams(-1, 20)).toEqual({ page: 1, limit: 20 })
      expect(validatePaginationParams(null as any, 20)).toEqual({ page: 1, limit: 20 })
    })

    it('should default invalid limit to 10', () => {
      expect(validatePaginationParams(1, 0)).toEqual({ page: 1, limit: 10 })
      expect(validatePaginationParams(1, -5)).toEqual({ page: 1, limit: 10 })
      expect(validatePaginationParams(1, null as any)).toEqual({ page: 1, limit: 10 })
    })

    it('should cap limit at maximum value', () => {
      expect(validatePaginationParams(1, 1000)).toEqual({ page: 1, limit: 100 })
      expect(validatePaginationParams(1, 150)).toEqual({ page: 1, limit: 100 })
    })

    it('should handle string parameters', () => {
      expect(validatePaginationParams('2' as any, '25' as any)).toEqual({ page: 2, limit: 25 })
      expect(validatePaginationParams('invalid' as any, '30' as any)).toEqual({ page: 1, limit: 30 })
    })
  })

  describe('buildWhereClause', () => {
    it('should build simple where clause', () => {
      const filters = { name: 'John', age: 25 }
      const result = buildWhereClause(filters)

      expect(result).toEqual({
        name: { contains: 'John', mode: 'insensitive' },
        age: { equals: 25 }
      })
    })

    it('should handle empty filters', () => {
      const result = buildWhereClause({})
      expect(result).toEqual({})
    })

    it('should handle null and undefined values', () => {
      const filters = { name: null, age: undefined, email: 'test@example.com' }
      const result = buildWhereClause(filters)

      expect(result).toEqual({
        email: { contains: 'test@example.com', mode: 'insensitive' }
      })
    })

    it('should handle array values', () => {
      const filters = { status: ['active', 'pending'], category: 'event' }
      const result = buildWhereClause(filters)

      expect(result).toEqual({
        status: { in: ['active', 'pending'] },
        category: { contains: 'event', mode: 'insensitive' }
      })
    })

    it('should handle boolean values', () => {
      const filters = { isActive: true, isPaid: false }
      const result = buildWhereClause(filters)

      expect(result).toEqual({
        isActive: { equals: true },
        isPaid: { equals: false }
      })
    })

    it('should handle date range filters', () => {
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const filters = { 
        createdAt_gte: startDate,
        createdAt_lte: endDate,
        name: 'test'
      }
      
      const result = buildWhereClause(filters)

      expect(result).toEqual({
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        name: { contains: 'test', mode: 'insensitive' }
      })
    })

    it('should handle nested object filters', () => {
      const filters = {
        'user.email': 'test@example.com',
        'event.status': 'active'
      }
      
      const result = buildWhereClause(filters)

      expect(result).toEqual({
        user: {
          email: { contains: 'test@example.com', mode: 'insensitive' }
        },
        event: {
          status: { contains: 'active', mode: 'insensitive' }
        }
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should handle optimized event queries', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', date: new Date() },
        { id: '2', title: 'Event 2', date: new Date() }
      ]

      mockPrisma.event.findMany.mockResolvedValue(mockEvents)
      mockPrisma.event.count.mockResolvedValue(2)

      const pagination = validatePaginationParams(1, 10)
      const filters = buildWhereClause({ status: 'active' })

      const events = await mockPrisma.event.findMany({
        where: filters,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' }
      })

      const total = await mockPrisma.event.count({ where: filters })

      expect(events).toEqual(mockEvents)
      expect(total).toBe(2)
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: {
          status: { contains: 'active', mode: 'insensitive' }
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should handle database retry in query execution', async () => {
      const mockQuery = async () => {
        return await mockPrisma.event.findMany()
      }

      mockPrisma.event.findMany
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce([{ id: '1', title: 'Event 1' }])

      const result = await withDatabaseRetry(mockQuery, 2, 100)

      expect(result).toEqual([{ id: '1', title: 'Event 1' }])
      expect(mockPrisma.event.findMany).toHaveBeenCalledTimes(2)
    })

    it('should optimize complex aggregation queries', async () => {
      const mockAggregation = {
        _count: { id: 50 },
        _sum: { totalCost: 15000 },
        _avg: { attendees: 75 }
      }

      mockPrisma.event.aggregate.mockResolvedValue(mockAggregation)

      const filters = buildWhereClause({ 
        status: 'completed',
        date_gte: new Date('2023-01-01')
      })

      const aggregation = await mockPrisma.event.aggregate({
        where: filters,
        _count: { id: true },
        _sum: { totalCost: true },
        _avg: { attendees: true }
      })

      expect(aggregation).toEqual(mockAggregation)
      expect(mockPrisma.event.aggregate).toHaveBeenCalledWith({
        where: {
          status: { contains: 'completed', mode: 'insensitive' },
          date: { gte: new Date('2023-01-01') }
        },
        _count: { id: true },
        _sum: { totalCost: true },
        _avg: { attendees: true }
      })
    })
  })
})