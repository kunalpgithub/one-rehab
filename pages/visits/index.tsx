import { useState, useEffect } from 'react'
import Head from 'next/head'

interface Patient {
  id: string
  name: string
  lastVisit: string
  service: string
  status: 'pending' | 'completed'
}

export default function VisitManager() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setPatients(data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedPatients.size === patients.length) {
      setSelectedPatients(new Set())
    } else {
      setSelectedPatients(new Set(patients.map(p => p.id)))
    }
  }

  const handleSelectPatient = (patientId: string) => {
    const newSelected = new Set(selectedPatients)
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId)
    } else {
      newSelected.add(patientId)
    }
    setSelectedPatients(newSelected)
  }

  const handleMarkCompleted = async () => {
    if (selectedPatients.size === 0) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/visits/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientIds: Array.from(selectedPatients),
          date: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to update visits')

      // Update local state
      setPatients(patients.map(patient => ({
        ...patient,
        status: selectedPatients.has(patient.id) ? 'completed' : patient.status,
        lastVisit: selectedPatients.has(patient.id) ? new Date().toISOString() : patient.lastVisit
      })))
      
      setSelectedPatients(new Set())
    } catch (error) {
      console.error('Error updating visits:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <>
      <Head>
        <title>Visit Manager - One Rehab</title>
      </Head>
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Visit Manager</h1>
        
        <div className="flex gap-4 mb-8">
          <button 
            onClick={handleSelectAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {selectedPatients.size === patients.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={handleMarkCompleted}
            disabled={selectedPatients.size === 0 || submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Updating...' : 'Mark Selected as Completed'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(patient => (
            <div 
              key={patient.id} 
              className={`border rounded-lg p-4 flex items-start gap-4 ${
                selectedPatients.has(patient.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPatients.has(patient.id)}
                onChange={() => handleSelectPatient(patient.id)}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{patient.name}</h3>
                <p className="text-gray-600 mb-1">Service: {patient.service}</p>
                <p className="text-gray-600 mb-2">Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                  patient.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {patient.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}