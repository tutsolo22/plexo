/**
 * Tests para Redis Cache
 * Sistema de Gestión de Eventos V3
 */

import { redisCache, CacheKeys } from '@/lib/redis'

// Mock de Redis client
const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  isOpen: true,
  connect: jest.fn(),
  quit: jest.fn(),
}

// Mock del módulo redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}))

describe('Redis Cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('RedisCache class', () => {
    it('should get value from cache', async () => {
      const testData = { test: 'data' }
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData))

      const result = await redisCache.get('test-key')

      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key')
      expect(result).toEqual(testData)
    })

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null)

      const result = await redisCache.get('non-existent-key')

      expect(result).toBeNull()
    })

    it('should set value in cache with TTL', async () => {
      const testData = { test: 'data' }
      mockRedisClient.setEx.mockResolvedValue('OK')

      const result = await redisCache.set('test-key', testData, 300)

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(testData)
      )
      expect(result).toBe(true)
    })

    it('should delete key from cache', async () => {
      mockRedisClient.del.mockResolvedValue(1)

      const result = await redisCache.del('test-key')

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key')
      expect(result).toBe(true)
    })

    it('should delete multiple keys by pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3'])
      mockRedisClient.del.mockResolvedValue(3)

      const result = await redisCache.delPattern('test:*')

      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*')
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2', 'key3'])
      expect(result).toBe(3)
    })

    it('should check if key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1)

      const result = await redisCache.exists('test-key')

      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key')
      expect(result).toBe(true)
    })

    it('should increment numeric value', async () => {
      mockRedisClient.incr.mockResolvedValue(5)

      const result = await redisCache.incr('counter-key')

      expect(mockRedisClient.incr).toHaveBeenCalledWith('counter-key')
      expect(result).toBe(5)
    })

    it('should set TTL for existing key', async () => {
      mockRedisClient.expire.mockResolvedValue(true)

      const result = await redisCache.expire('test-key', 600)

      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 600)
      expect(result).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'))

      const result = await redisCache.get('error-key')

      expect(result).toBeNull()
    })
  })

  describe('CacheKeys', () => {
    it('should generate analytics dashboard key', () => {
      const key = CacheKeys.ANALYTICS_DASHBOARD('6', 'tenant-123')
      expect(key).toBe('analytics:dashboard:6:tenant-123')
    })

    it('should generate user notifications key', () => {
      const key = CacheKeys.USER_NOTIFICATIONS('user-456')
      expect(key).toBe('notifications:user:user-456')
    })

    it('should generate events stats key', () => {
      const key = CacheKeys.EVENTS_STATS('tenant-789')
      expect(key).toBe('events:stats:tenant-789')
    })

    it('should generate clients list key', () => {
      const key = CacheKeys.CLIENTS_LIST('tenant-123', 1, 10)
      expect(key).toBe('clients:list:tenant-123:1:10')
    })

    it('should generate client data key', () => {
      const key = CacheKeys.CLIENT_DATA('client-456')
      expect(key).toBe('client:data:client-456')
    })

    it('should generate quotes dashboard key', () => {
      const key = CacheKeys.QUOTES_DASHBOARD('tenant-789')
      expect(key).toBe('quotes:dashboard:tenant-789')
    })

    it('should generate upcoming events key', () => {
      const key = CacheKeys.UPCOMING_EVENTS('tenant-123')
      expect(key).toBe('events:upcoming:tenant-123')
    })

    it('should generate email stats key', () => {
      const key = CacheKeys.EMAIL_STATS('tenant-456')
      expect(key).toBe('email:stats:tenant-456')
    })
  })

  describe('Integration scenarios', () => {
    it('should handle cache miss and set scenario', async () => {
      // First call - cache miss
      mockRedisClient.get.mockResolvedValueOnce(null)
      
      let result = await redisCache.get('new-key')
      expect(result).toBeNull()

      // Set value
      mockRedisClient.setEx.mockResolvedValue('OK')
      await redisCache.set('new-key', { data: 'test' }, 300)

      // Second call - cache hit
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }))
      result = await redisCache.get('new-key')
      expect(result).toEqual({ data: 'test' })
    })

    it('should handle analytics caching workflow', async () => {
      const analyticsData = {
        summary: { totalEvents: 10 },
        generatedAt: new Date().toISOString()
      }

      // Cache analytics data
      mockRedisClient.setEx.mockResolvedValue('OK')
      const cacheKey = CacheKeys.ANALYTICS_DASHBOARD('6', 'tenant-1')
      
      await redisCache.set(cacheKey, analyticsData, 900) // 15 min TTL

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        cacheKey,
        900,
        JSON.stringify(analyticsData)
      )
    })

    it('should handle bulk cache operations', async () => {
      // Delete pattern for tenant cleanup
      mockRedisClient.keys.mockResolvedValue([
        'analytics:dashboard:6:tenant-1',
        'events:stats:tenant-1',
        'notifications:user:user-1'
      ])
      mockRedisClient.del.mockResolvedValue(3)

      const deleted = await redisCache.delPattern('*:tenant-1')
      expect(deleted).toBe(3)

      // Verify all related keys were deleted
      expect(mockRedisClient.keys).toHaveBeenCalledWith('*:tenant-1')
    })
  })
})