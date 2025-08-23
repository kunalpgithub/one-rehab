import { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from '../../styles/Visits.module.css'

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
      const data = await response.json()
      setPatients(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching patients:', error)
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
      <div className={styles.container}>
        <h1 className={styles.title}>Visit Manager</h1>
        
        <div className={styles.controls}>
          <button 
            onClick={handleSelectAll}
            className={styles.button}
          >
            {selectedPatients.size === patients.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={handleMarkCompleted}
            disabled={selectedPatients.size === 0 || submitting}
            className={styles.button}
          >
            {submitting ? 'Updating...' : 'Mark Selected as Completed'}
          </button>
        </div>

        <div className={styles.patientList}>
          {patients.map(patient => (
            <div 
              key={patient.id} 
              className={`${styles.patientCard} ${selectedPatients.has(patient.id) ? styles.selected : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedPatients.has(patient.id)}
                onChange={() => handleSelectPatient(patient.id)}
                className={styles.checkbox}
              />
              <div className={styles.patientInfo}>
                <h3>{patient.name}</h3>
                <p>Service: {patient.service}</p>
                <p>Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                <span className={`${styles.status} ${styles[patient.status]}`}>
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