import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Navigation from '../../components/Navigation'
import { Patient, ScheduledVisit } from '../../types'
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns'
import { usePatients } from '../../hooks/usePatients'
import { visitsStorage } from '../../utils/storage'

export default function VisitManager() {
  const { patients, loading: patientsLoading, updatePatient } = usePatients()
  const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([])
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateInputValue, setDateInputValue] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    loadVisits()
    
    // Refresh data when page becomes visible (e.g., returning from add page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadVisits()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadVisits = () => {
    try {
      const visits = visitsStorage.getAll()
      setScheduledVisits(visits)
    } catch (error) {
      console.error('Error loading visits:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh data when component mounts or when returning from add page
  useEffect(() => {
    const handleFocus = () => {
      loadVisits()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

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

      // Update patients in localStorage
      const today = new Date().toISOString()
      selectedPatients.forEach(patientId => {
        updatePatient(patientId, {
          status: 'completed',
          lastVisit: today
        })
      })
      
      setSelectedPatients(new Set())
      loadVisits() // Refresh visits list
    } catch (error) {
      console.error('Error updating visits:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter visits for the selected date
  const visitsForSelectedDate = scheduledVisits.filter(visit => {
    return visit.generatedDates.some(date => {
      const visitDate = parseISO(date)
      return isSameDay(visitDate, selectedDate)
    })
  })

  // Get unique patient IDs with visits on selected date
  const patientIdsWithVisits = new Set(visitsForSelectedDate.map(v => v.patientId))
  
  // Filter patients to show only those with visits on selected date
  const patientsWithVisitsToday = patients.filter(p => patientIdsWithVisits.has(p.id))

  // Get visit details for each patient on selected date
  const patientVisitDetails = patientsWithVisitsToday.map(patient => {
    const patientVisits = visitsForSelectedDate.filter(v => v.patientId === patient.id)
    const visitTimes = patientVisits.flatMap(v => 
      v.generatedDates
        .filter(date => isSameDay(parseISO(date), selectedDate))
        .map(date => parseISO(date))
    ).sort((a, b) => a.getTime() - b.getTime())

    return {
      patient,
      visits: patientVisits,
      visitTimes
    }
  })

  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1)
    setSelectedDate(newDate)
    setDateInputValue(format(newDate, 'yyyy-MM-dd'))
  }

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1)
    setSelectedDate(newDate)
    setDateInputValue(format(newDate, 'yyyy-MM-dd'))
  }

  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setDateInputValue(format(today, 'yyyy-MM-dd'))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseISO(e.target.value)
    setSelectedDate(newDate)
    setDateInputValue(e.target.value)
  }

  const handleSelectAll = () => {
    if (selectedPatients.size === patientsWithVisitsToday.length && patientsWithVisitsToday.length > 0) {
      setSelectedPatients(new Set())
    } else {
      setSelectedPatients(new Set(patientsWithVisitsToday.map(p => p.id)))
    }
  }

  if (loading || patientsLoading) return <div>Loading...</div>

  const isToday = isSameDay(selectedDate, new Date())

  return (
    <>
      <Head>
        <title>Visit Manager - One Rehab</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Visit Manager</h1>
          <Link
            href="/patients"
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm sm:text-base text-center inline-block"
          >
            Manage Patients
          </Link>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviousDay}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Previous day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={dateInputValue}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {!isToday && (
                  <button
                    onClick={handleToday}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Today
                  </button>
                )}
              </div>

              <button
                onClick={handleNextDay}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Next day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              {isToday && <span className="ml-2 text-blue-600">(Today)</span>}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button 
            onClick={handleSelectAll}
            disabled={patientsWithVisitsToday.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {selectedPatients.size === patientsWithVisitsToday.length && patientsWithVisitsToday.length > 0 
              ? 'Deselect All' 
              : 'Select All'}
          </button>
          <button
            onClick={handleMarkCompleted}
            disabled={selectedPatients.size === 0 || submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {submitting ? 'Updating...' : 'Mark Selected as Completed'}
          </button>
        </div>

        {/* Patients with Visits for Selected Date */}
        {patientsWithVisitsToday.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Visits for {format(selectedDate, 'MMMM d, yyyy')} ({patientsWithVisitsToday.length} {patientsWithVisitsToday.length === 1 ? 'patient' : 'patients'})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientVisitDetails.map(({ patient, visitTimes }) => (
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
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Visit Times:</p>
                      <div className="flex flex-wrap gap-2">
                        {visitTimes.map((time, idx) => (
                          <span 
                            key={idx}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                          >
                            {format(time, 'h:mm a')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2 text-sm">
                      Last Visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                      patient.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {patient.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600 text-lg mb-2">No visits scheduled for {format(selectedDate, 'MMMM d, yyyy')}</p>
            <p className="text-gray-500 text-sm">Try selecting a different date or add new visits.</p>
          </div>
        )}
        </div>
      </div>
    </>
  )
}