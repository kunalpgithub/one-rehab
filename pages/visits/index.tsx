import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navigation from '../../components/Navigation'
import { Patient, ScheduledVisit } from '../../types'
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns'
import { usePatients } from '../../hooks/usePatients'
import { useVisitsQuery } from '../../hooks/useVisitsQuery'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { staggerContainer, staggerItem } from '../../lib/animations'
import { PullToRefresh } from '../../components/PullToRefresh'

export default function VisitManager() {
  const { patients, loading: patientsLoading, updatePatient } = usePatients()
  const { data: scheduledVisits = [], isLoading: visitsLoading } = useVisitsQuery()
  const queryClient = useQueryClient()
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set()) // Individual visit IDs
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateInputValue, setDateInputValue] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  
  const loading = visitsLoading || patientsLoading

  const handleSelectPatient = (patientId: string) => {
    const newSelected = new Set(selectedPatients)
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId)
      // Also deselect all visits for this patient
      const newSelectedVisits = new Set(selectedVisits)
      individualVisits
        .filter(v => v.patientId === patientId)
        .forEach(v => newSelectedVisits.delete(v.id))
      setSelectedVisits(newSelectedVisits)
    } else {
      newSelected.add(patientId)
      // Also select all visits for this patient
      const newSelectedVisits = new Set(selectedVisits)
      individualVisits
        .filter(v => v.patientId === patientId)
        .forEach(v => newSelectedVisits.add(v.id))
      setSelectedVisits(newSelectedVisits)
    }
    setSelectedPatients(newSelected)
  }

  const handleSelectVisit = (visitId: string, patientId: string) => {
    const newSelected = new Set(selectedVisits)
    if (newSelected.has(visitId)) {
      newSelected.delete(visitId)
    } else {
      newSelected.add(visitId)
    }
    setSelectedVisits(newSelected)

    // Update patient selection based on visit selection
    const patientVisits = individualVisits.filter(v => v.patientId === patientId)
    const selectedPatientVisits = patientVisits.filter(v => newSelected.has(v.id))
    const newSelectedPatients = new Set(selectedPatients)
    if (selectedPatientVisits.length === patientVisits.length && patientVisits.length > 0) {
      newSelectedPatients.add(patientId)
    } else {
      newSelectedPatients.delete(patientId)
    }
    setSelectedPatients(newSelectedPatients)
  }

  const handleMarkCompleted = async () => {
    if (selectedVisits.size === 0) return

    setSubmitting(true)
    try {
      // Get unique patient IDs from selected visits
      const selectedPatientIds = new Set(Array.from(selectedVisits).map(visitId => {
        const visit = individualVisits.find(v => v.id === visitId)
        return visit?.patientId
      }).filter(Boolean) as string[])

      const response = await fetch('/api/visits/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientIds: Array.from(selectedPatientIds),
          date: selectedDate.toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to update visits')

      // Update patients in localStorage
      const today = selectedDate.toISOString()
      selectedPatientIds.forEach(patientId => {
        updatePatient(patientId, {
          status: 'completed',
          lastVisit: today
        })
      })
      
      setSelectedVisits(new Set())
      setSelectedPatients(new Set())
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    } catch (error) {
      console.error('Error updating visits:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Get all individual visits for the selected date (not grouped by patient)
  interface IndividualVisit {
    id: string
    visitId: string // The scheduled visit ID
    patientId: string
    patientName: string
    service: string
    time: Date
    visitorId: string
  }

  const individualVisits: IndividualVisit[] = scheduledVisits.flatMap(visit => {
    const patient = patients.find(p => p.id === visit.patientId)
    if (!patient) return []

    return visit.generatedDates
      .filter(date => {
        const visitDate = parseISO(date)
        return isSameDay(visitDate, selectedDate)
      })
      .map(date => ({
        id: `${visit.id}-${date}`, // Unique ID for this specific visit instance
        visitId: visit.id,
        patientId: visit.patientId,
        patientName: patient.name,
        service: patient.service,
        time: parseISO(date),
        visitorId: visit.visitorId
      }))
  }).sort((a, b) => a.time.getTime() - b.time.getTime()) // Sort by time

  // Get unique patient IDs with visits on selected date (for select all functionality)
  const patientIdsWithVisits = new Set(individualVisits.map(v => v.patientId))
  const patientsWithVisitsToday = patients.filter(p => patientIdsWithVisits.has(p.id))

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
    if (selectedVisits.size === individualVisits.length && individualVisits.length > 0) {
      setSelectedVisits(new Set())
      setSelectedPatients(new Set())
    } else {
      setSelectedVisits(new Set(individualVisits.map(v => v.id)))
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
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handlePreviousDay}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Previous day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <input
                type="date"
                value={dateInputValue}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <button
                onClick={handleNextDay}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Next day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Separate Today Button */}
              <button
                onClick={handleToday}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isToday
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                Today
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              {isToday && <span className="ml-2 text-blue-600 font-semibold">(Today)</span>}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button 
            onClick={handleSelectAll}
            disabled={individualVisits.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {selectedVisits.size === individualVisits.length && individualVisits.length > 0 
              ? 'Deselect All' 
              : 'Select All'}
          </button>
          <button
            onClick={handleMarkCompleted}
            disabled={selectedVisits.size === 0 || submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {submitting ? 'Updating...' : `Mark ${selectedVisits.size} Visit${selectedVisits.size !== 1 ? 's' : ''} as Completed`}
          </button>
        </div>

        {/* Timeline of Visits for Selected Date */}
        <PullToRefresh
          onRefresh={async () => {
            queryClient.invalidateQueries({ queryKey: ['visits'] })
            queryClient.invalidateQueries({ queryKey: ['patients'] })
          }}
        >
          {individualVisits.length > 0 ? (
            <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Visits for {format(selectedDate, 'MMMM d, yyyy')} ({individualVisits.length} {individualVisits.length === 1 ? 'visit' : 'visits'})
            </h2>

            {/* Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-4">
                {individualVisits.map((visit, index) => {
                  const isSelected = selectedVisits.has(visit.id)
                  const prevVisit = index > 0 ? individualVisits[index - 1] : null
                  const isNewTimeSlot = !prevVisit || format(visit.time, 'HH:mm') !== format(prevVisit.time, 'HH:mm')
                  
                  return (
                    <div key={visit.id} className="relative flex items-start gap-4">
                      {/* Time label on the left */}
                      <div className="flex-shrink-0 w-20 text-right pt-1">
                        {isNewTimeSlot && (
                          <span className="text-sm font-medium text-gray-700">
                            {format(visit.time, 'h:mm a')}
                          </span>
                        )}
                      </div>
                      
                      {/* Timeline dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected
                            ? 'bg-blue-500 border-blue-600'
                            : 'bg-white border-gray-400'
                        }`}></div>
                      </div>
                      
                      {/* Visit card */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex-1 border-l-4 rounded-lg p-4 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectVisit(visit.id, visit.patientId)}
                            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">{visit.patientName}</h3>
                                <p className="text-sm text-gray-600 mt-1">Service: {visit.service}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                  isSelected
                                    ? 'bg-blue-200 text-blue-900'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {format(visit.time, 'h:mm a')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )
                })}
            </div>
          </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              No visits scheduled for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              {isToday 
                ? "Looks like you have a free day! 🎉" 
                : "This day is clear. Try selecting a different date or add new visits."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
              <Link
                href="/visits/add"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                ➕ Add New Visit
              </Link>
              {!isToday && (
                <button
                  onClick={handleToday}
                  className="px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm sm:text-base"
                >
                  📍 Go to Today
                </button>
              )}
            </div>
          </div>
        )}
        </PullToRefresh>
        </div>
      </div>
    </>
  )
}