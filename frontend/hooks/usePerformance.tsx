import { useState, useEffect, useCallback, useMemo } from 'react'
import { Invoice, Customer, Company } from '@/types'

interface UseInfiniteScrollOptions {
  fetchFunction: (page: number, pageSize: number) => Promise<{
    data: Invoice[]
    total: number
    totalPages: number
  }>
  pageSize?: number
  initialPage?: number
}

interface UseInfiniteScrollResult {
  data: Invoice[]
  loading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  total: number
  totalPages: number
  loadMore: () => void
  refresh: () => void
  reset: () => void
}

export function useInfiniteScroll({
  fetchFunction,
  pageSize = 20,
  initialPage = 1
}: UseInfiniteScrollOptions): UseInfiniteScrollResult {
  const [data, setData] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const loadData = useCallback(async (page: number, isRefresh = false) => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFunction(page, pageSize)
      
      if (isRefresh) {
        setData(result.data)
      } else {
        setData(prev => page === 1 ? result.data : [...prev, ...result.data])
      }
      
      setTotal(result.total)
      setTotalPages(result.totalPages)
      setHasMore(page < result.totalPages)
      setCurrentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, pageSize, loading])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadData(currentPage + 1)
    }
  }, [currentPage, hasMore, loading, loadData])

  const refresh = useCallback(() => {
    setData([])
    setCurrentPage(initialPage)
    setHasMore(true)
    loadData(initialPage, true)
  }, [initialPage, loadData])

  const reset = useCallback(() => {
    setData([])
    setCurrentPage(initialPage)
    setTotal(0)
    setTotalPages(0)
    setHasMore(true)
    setError(null)
    setLoading(false)
  }, [initialPage])

  // Load initial data
  useEffect(() => {
    loadData(initialPage)
  }, [loadData, initialPage])

  return {
    data,
    loading,
    error,
    hasMore,
    currentPage,
    total,
    totalPages,
    loadMore,
    refresh,
    reset
  }
}

// Optimized search hook with debouncing
export function useDebounceSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (query: string) => {
      clearTimeout(timeoutId)
      setLoading(true)
      setError(null)

      if (query.trim() === '') {
        setResults([])
        setLoading(false)
        return
      }

      timeoutId = setTimeout(async () => {
        try {
          const searchResults = await searchFunction(query)
          setResults(searchResults)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Search failed')
        } finally {
          setLoading(false)
        }
      }, delay)
    }
  }, [searchFunction, delay])

  return { results, loading, error, debouncedSearch }
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: Date.now(),
    slowRenders: 0
  })

  const trackRender = useCallback(() => {
    const now = Date.now()
    const renderTime = now - metrics.lastRenderTime
    
    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      lastRenderTime: now,
      slowRenders: renderTime > 16 ? prev.slowRenders + 1 : prev.slowRenders
    }))
  }, [metrics.lastRenderTime, metrics.renderCount, metrics.slowRenders])

  return { metrics, trackRender }
}

// Optimized list component hook
export function useVirtualList<T>({
  items,
  itemHeight = 60,
  containerHeight = 400
}: {
  items: T[]
  itemHeight?: number
  containerHeight?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex)
  }, [items, visibleRange])

  return {
    visibleItems,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    totalHeight: items.length * itemHeight,
    setScrollTop
  }
}

// Cache hook for API responses
export function useApiCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState(0)

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now()
    
    // Return cached data if still valid
    if (!force && data && (now - lastFetch) < ttl) {
      return data
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFunction()
      setData(result)
      setLastFetch(now)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, ttl, data, lastFetch])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: () => fetchData(true) }
}

// Optimized filter hook
export function useAdvancedFilters<T>(
  initialFilters: T
) {
  const [filters, setFilters] = useState<T>(initialFilters)
  const [activeFilters, setActiveFilters] = useState<T>(initialFilters)

  const updateFilter = useCallback((key: keyof T, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Track active filters (non-empty values)
    const active = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => 
        v !== '' && v !== null && v !== undefined
      )
    ) as T
    setActiveFilters(active)
  }, [filters])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
    setActiveFilters(initialFilters)
  }, [initialFilters])

  const hasActiveFilters = useMemo(() => {
    return Object.keys(activeFilters as Record<string, any>).length > 0
  }, [activeFilters])

  return {
    filters,
    activeFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  }
}
