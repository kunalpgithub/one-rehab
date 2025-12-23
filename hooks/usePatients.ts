import { useState, useEffect, useCallback } from 'react'
import { Patient } from '../types'
import { patientsStorage } from '../utils/storage'

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  const loadPatients = useCallback(() => {
    try {
      const data = patientsStorage.getAll()
      setPatients(data)
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPatients()
    
    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'one-rehab-patients') {
        loadPatients()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [loadPatients])

  const addPatient = useCallback((patient: Patient) => {
    if (patientsStorage.add(patient)) {
      setPatients(prev => [...prev, patient])
      return true
    }
    return false
  }, [])

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    if (patientsStorage.update(id, updates)) {
      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      return true
    }
    return false
  }, [])

  const deletePatient = useCallback((id: string) => {
    if (patientsStorage.delete(id)) {
      setPatients(prev => prev.filter(p => p.id !== id))
      return true
    }
    return false
  }, [])

  return {
    patients,
    loading,
    addPatient,
    updatePatient,
    deletePatient,
    refresh: loadPatients
  }
}

