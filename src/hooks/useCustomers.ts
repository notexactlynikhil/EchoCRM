import { useState, useEffect, useCallback } from 'react'
import { Customer } from '../types'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customerService'
import { useRealtimeSync } from '../contexts/RealtimeSyncContext'

// Helper to check if a customer matches the active search term
const matchesSearch = (customer: Customer, searchTerm: string) => {
  if (!searchTerm.trim()) return true
  const term = searchTerm.toLowerCase().trim()
  return (
    customer.name.toLowerCase().includes(term) ||
    (customer.email && customer.email.toLowerCase().includes(term)) ||
    (customer.company && customer.company.toLowerCase().includes(term))
  );
};

// Helper to get sorting function
const getSortFn = (order: 'asc' | 'desc') => {
  return (a: Customer, b: Customer) => {
    const comparison = a.name.localeCompare(b.name)
    return order === 'asc' ? comparison : -comparison
  };
};

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const { subscribe } = useRealtimeSync()

  const limit = 20

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getCustomers(page, limit, search, sortOrder)
      setCustomers(result.customers)
      setTotalCount(result.totalCount)
      setHasNextPage(result.hasNextPage)
    } catch (err: any) {
      setError(err?.message || 'Unable to load customers.')
    } finally {
      setLoading(false)
    }
  }, [page, search, sortOrder])

  // Initial load and auto re-fetch on dependency changes
  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // Realtime subscription listener
  useEffect(() => {
    const sortFn = getSortFn(sortOrder);
    
    const unsubscribe = subscribe((event) => {
      if (event.table !== 'customers') return;

      if (event.eventType === 'DELETE') {
        setCustomers((prev) => {
          const updated = prev.filter((c) => c.id !== event.oldRecord.id);
          // If we deleted the only item on a page > 1, the page adjustment will handle re-fetching
          return updated;
        });
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else if (event.eventType === 'UPDATE') {
        const matches = matchesSearch(event.newRecord, search);
        if (matches) {
          setCustomers((prev) => {
            const exists = prev.some((c) => c.id === event.newRecord.id);
            if (exists) {
              return prev.map((c) => (c.id === event.newRecord.id ? event.newRecord : c)).sort(sortFn);
            }
            // If it matches search but wasn't in the list, we could append it, but we respect pagination limit
            if (prev.length < limit) {
              return [...prev, event.newRecord].sort(sortFn);
            }
            return prev;
          });
        } else {
          // No longer matches active search filter, remove from list
          setCustomers((prev) => prev.filter((c) => c.id !== event.newRecord.id));
          setTotalCount((prev) => Math.max(0, prev - 1));
        }
      } else if (event.eventType === 'INSERT') {
        const matches = matchesSearch(event.newRecord, search);
        if (matches) {
          setCustomers((prev) => {
            const exists = prev.some((c) => c.id === event.newRecord.id);
            if (exists) return prev;
            
            const updated = [...prev, event.newRecord].sort(sortFn);
            // Cap at page limit
            return updated.slice(0, limit);
          });
          setTotalCount((prev) => prev + 1);
        }
      }
    });

    return () => {
      unsubscribe()
    };
  }, [subscribe, search, sortOrder])

  // Reset to page 1 when search or sort order changes
  useEffect(() => {
    setPage(1)
  }, [search, sortOrder])

  const addCustomer = async (cust: Omit<Customer, 'id' | 'created_at' | 'owner_id'>) => {
    try {
      setError(null)
      await createCustomer(cust)
      await loadCustomers()
    } catch (err: any) {
      setError(err?.message || 'Customer could not be created.')
      throw err
    }
  }

  const editCustomer = async (id: string, cust: Partial<Omit<Customer, 'id' | 'created_at' | 'owner_id'>>) => {
    try {
      setError(null)
      await updateCustomer(id, cust)
      await loadCustomers()
    } catch (err: any) {
      setError(err?.message || 'Customer details could not be updated.')
      throw err
    }
  }

  const removeCustomer = async (id: string) => {
    try {
      setError(null)
      await deleteCustomer(id)
      
      // If we deleted the last item on page > 1, slide back to previous page
      if (page > 1 && customers.length === 1) {
        setPage(prev => Math.max(1, prev - 1))
      } else {
        await loadCustomers()
      }
    } catch (err: any) {
      setError(err?.message || 'Customer could not be deleted.')
      throw err
    }
  }

  return {
    customers,
    loading,
    error,
    page,
    setPage,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    totalCount,
    hasNextPage,
    addCustomer,
    editCustomer,
    removeCustomer,
    refresh: loadCustomers,
  }
}
export type UseCustomersType = ReturnType<typeof useCustomers>;
