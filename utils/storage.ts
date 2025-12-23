import { Patient, ScheduledVisit } from '../types'

// Storage keys
const PATIENTS_KEY = 'one-rehab-patients'
const VISITS_KEY = 'one-rehab-visits'

// Helper functions for localStorage with error handling
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue
    }
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Please clear some data.')
    }
    return false
  }
}

// Patients storage
export const patientsStorage = {
  getAll: (): Patient[] => {
    return getItem<Patient[]>(PATIENTS_KEY, [])
  },

  getById: (id: string): Patient | undefined => {
    const patients = patientsStorage.getAll()
    return patients.find(p => p.id === id)
  },

  add: (patient: Patient): boolean => {
    const patients = patientsStorage.getAll()
    patients.push(patient)
    return setItem(PATIENTS_KEY, patients)
  },

  update: (id: string, updates: Partial<Patient>): boolean => {
    const patients = patientsStorage.getAll()
    const index = patients.findIndex(p => p.id === id)
    if (index === -1) {
      return false
    }
    patients[index] = { ...patients[index], ...updates }
    return setItem(PATIENTS_KEY, patients)
  },

  delete: (id: string): boolean => {
    const patients = patientsStorage.getAll()
    const filtered = patients.filter(p => p.id !== id)
    return setItem(PATIENTS_KEY, filtered)
  },

  clear: (): boolean => {
    return setItem(PATIENTS_KEY, [])
  }
}

// Visits storage
export const visitsStorage = {
  getAll: (): ScheduledVisit[] => {
    return getItem<ScheduledVisit[]>(VISITS_KEY, [])
  },

  getById: (id: string): ScheduledVisit | undefined => {
    const visits = visitsStorage.getAll()
    return visits.find(v => v.id === id)
  },

  getByPatientId: (patientId: string): ScheduledVisit[] => {
    const visits = visitsStorage.getAll()
    return visits.filter(v => v.patientId === patientId)
  },

  add: (visit: ScheduledVisit): boolean => {
    const visits = visitsStorage.getAll()
    visits.push(visit)
    return setItem(VISITS_KEY, visits)
  },

  update: (id: string, updates: Partial<ScheduledVisit>): boolean => {
    const visits = visitsStorage.getAll()
    const index = visits.findIndex(v => v.id === id)
    if (index === -1) {
      return false
    }
    visits[index] = { ...visits[index], ...updates }
    return setItem(VISITS_KEY, visits)
  },

  delete: (id: string): boolean => {
    const visits = visitsStorage.getAll()
    const filtered = visits.filter(v => v.id !== id)
    return setItem(VISITS_KEY, filtered)
  },

  deleteByPatientId: (patientId: string): boolean => {
    const visits = visitsStorage.getAll()
    const filtered = visits.filter(v => v.patientId !== patientId)
    return setItem(VISITS_KEY, filtered)
  },

  clear: (): boolean => {
    return setItem(VISITS_KEY, [])
  }
}

// Utility to clear all app data
export const clearAllData = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.removeItem(PATIENTS_KEY)
    localStorage.removeItem(VISITS_KEY)
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}

// Utility to export data (for backup)
export const exportData = () => {
  return {
    patients: patientsStorage.getAll(),
    visits: visitsStorage.getAll(),
    exportedAt: new Date().toISOString()
  }
}

// Utility to import data (for restore)
export const importData = (data: { patients?: Patient[]; visits?: ScheduledVisit[] }): boolean => {
  try {
    if (data.patients) {
      setItem(PATIENTS_KEY, data.patients)
    }
    if (data.visits) {
      setItem(VISITS_KEY, data.visits)
    }
    return true
  } catch (error) {
    console.error('Error importing data:', error)
    return false
  }
}

