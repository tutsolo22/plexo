'use client';

import { useState, useEffect, useCallback } from 'react';

interface EventQuote {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  total: number;
  validUntil: string;
  createdAt: string;
}

interface EventQuoteStats {
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  averageValue: number;
}

interface SyncStatus {
  eventStatus: string;
  quotesCount: number;
  quotesByStatus: Record<string, number>;
  recommendations: string[];
  needsSync: boolean;
}

interface UseEventQuotesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useEventQuotes(eventId: string, options: UseEventQuotesOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [quotes, setQuotes] = useState<EventQuote[]>([]);
  const [stats, setStats] = useState<EventQuoteStats | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quotes for the event
  const fetchQuotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/quotes`);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data.quotes);
        setStats(data.data.stats);
        setError(null);
      } else {
        throw new Error('Failed to fetch quotes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading quotes');
    }
  }, [eventId]);

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/sync-quotes`);
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data.syncStatus);
      }
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  }, [eventId]);

  // Create quote from event
  const createQuote = useCallback(async (quoteData: {
    title: string;
    description?: string;
    templateId?: string;
    validUntil?: string;
    packages: Array<{
      name: string;
      description?: string;
      price: number;
      quantity: number;
      items?: Array<{
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
      }>;
    }>;
    adjustments?: Array<{
      type: 'discount' | 'surcharge';
      description: string;
      amount: number;
      percentage?: number;
    }>;
    autoSend?: boolean;
    emailTemplate?: 'basic' | 'professional' | 'custom';
  }) => {
    try {
      const response = await fetch(`/api/events/${eventId}/create-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      if (response.ok) {
        const data = await response.json();
        await fetchQuotes(); // Refresh quotes list
        await fetchSyncStatus(); // Refresh sync status
        return data.data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quote');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating quote');
    }
  }, [eventId, fetchQuotes, fetchSyncStatus]);

  // Sync event and quotes statuses
  const syncStatuses = useCallback(async (syncData: {
    eventStatus?: 'RESERVED' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED';
    quoteStatus?: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
    syncDirection?: 'event-to-quotes' | 'quote-to-event' | 'both';
  }) => {
    try {
      const response = await fetch(`/api/events/${eventId}/sync-quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
      });

      if (response.ok) {
        const data = await response.json();
        await fetchQuotes(); // Refresh quotes list
        await fetchSyncStatus(); // Refresh sync status
        return data.data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync statuses');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error syncing statuses');
    }
  }, [eventId, fetchQuotes, fetchSyncStatus]);

  // Create quick quote with minimal data
  const createQuickQuote = useCallback(async (data: {
    title: string;
    price: number;
    description?: string;
    autoSend?: boolean;
  }) => {
    return createQuote({
      title: data.title,
      ...(data.description && { description: data.description }),
      packages: [{
        name: 'Paquete Principal',
        description: data.description || `Servicios para evento`,
        price: data.price,
        quantity: 1
      }],
      ...(data.autoSend !== undefined && { autoSend: data.autoSend }),
      emailTemplate: 'professional'
    });
  }, [createQuote]);

  // Get quote by ID
  const getQuote = useCallback((quoteId: string) => {
    return quotes.find(quote => quote.id === quoteId);
  }, [quotes]);

  // Get quotes by status
  const getQuotesByStatus = useCallback((status: string) => {
    return quotes.filter(quote => quote.status === status);
  }, [quotes]);

  // Check if event needs sync
  const needsSync = useCallback(() => {
    return syncStatus?.needsSync || false;
  }, [syncStatus]);

  // Get sync recommendations
  const getSyncRecommendations = useCallback(() => {
    return syncStatus?.recommendations || [];
  }, [syncStatus]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchQuotes(), fetchSyncStatus()]);
    } finally {
      setLoading(false);
    }
  }, [fetchQuotes, fetchSyncStatus]);

  // Initial load
  useEffect(() => {
    if (eventId) {
      refresh();
    }
  }, [eventId, refresh]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    // Data
    quotes,
    stats,
    syncStatus,
    loading,
    error,

    // Actions
    createQuote,
    createQuickQuote,
    syncStatuses,
    refresh,

    // Helpers
    getQuote,
    getQuotesByStatus,
    needsSync,
    getSyncRecommendations,

    // Stats helpers
    getTotalQuotes: () => stats?.total || 0,
    getTotalValue: () => stats?.totalValue || 0,
    getAverageValue: () => stats?.averageValue || 0,
    getQuoteCountByStatus: (status: string) => stats?.byStatus[status] || 0,

    // Status helpers
    hasAcceptedQuotes: () => getQuotesByStatus('ACCEPTED').length > 0,
    hasPendingQuotes: () => getQuotesByStatus('SENT').length > 0 || getQuotesByStatus('VIEWED').length > 0,
    hasRejectedQuotes: () => getQuotesByStatus('REJECTED').length > 0,
    allQuotesRejected: () => quotes.length > 0 && quotes.every(q => q.status === 'REJECTED')
  };
}

export default useEventQuotes;