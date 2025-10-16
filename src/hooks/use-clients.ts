import { useState, useEffect, useCallback } from 'react';
import { Client } from '@prisma/client';
import type { ClientFilters } from '@/lib/validations/schemas';

type PartialClientFilters = Partial<ClientFilters>;

export interface UseClientsResult {
  clients: Client[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  refetch: () => Promise<void>;
  create: (data: Partial<Client>) => Promise<void>;
  update: (id: string, data: Partial<Client>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

/**
 * Hook personalizado para gestión de clientes
 * Implementa patrón DRY con CRUD completo
 */
export function useClients(filters: PartialClientFilters = {}): UseClientsResult {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(filters.page || 1);

  const buildUrl = (customFilters: PartialClientFilters = {}) => {
    const params = new URLSearchParams();
    const mergedFilters = { ...filters, ...customFilters };

    Object.entries(mergedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    return `/api/clients?${params.toString()}`;
  };

  const fetchClients = useCallback(
    async (customFilters: PartialClientFilters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(buildUrl(customFilters));

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setClients(data.clients || []);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const create = async (clientData: Partial<Client>) => {
    try {
      setError(null);

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear cliente');
      }

      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente');
      throw err;
    }
  };

  const update = async (id: string, clientData: Partial<Client>) => {
    try {
      setError(null);

      const response = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar cliente');
      }

      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cliente');
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar cliente');
      }

      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente');
      throw err;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    totalPages,
    currentPage,
    refetch: () => fetchClients(),
    create,
    update,
    delete: deleteClient,
  };
}
