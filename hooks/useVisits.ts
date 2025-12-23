import { useState, useEffect, useCallback } from 'react'
import { ScheduledVisit } from '../types'
import { visitsStorage } from '../utils/storage'

export function useVisits() {
  const [visits, setVisits] = useState<ScheduledVisit[]>([])
  const [loading, setLoading] = useState(true)

  const loadVisits = useCallback(() => {
    try {
      const data = visitsStorage.getAll()
      setVisits(data)
    } catch (error) {
      console.error('Error loading visits:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVisits()
    
    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'one-rehab-visits') {
        loadVisits()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [loadVisits])

  const addVisit = useCallback((visit: ScheduledVisit) => {
    if (visitsStorage.add(visit)) {
      setVisits(prev => [...prev, visit])
      return true
    }
    return false
  }, [])

  const updateVisit = useCallback((id: string, updates: Partial<ScheduledVisit>) => {
    if (visitsStorage.update(id, updates)) {
      setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v))
      return true
    }
    return false
  }, [])

  const deleteVisit = useCallback((id: string) => {
    if (visitsStorage.delete(id)) {
      setVisits(prev => prev.filter(v => v.id !== id))
      return true
    }
    return false
  }, [])

  return {
    visits,
    loading,
    addVisit,
    updateVisit,
    deleteVisit,
    refresh: loadVisits
  }
}

