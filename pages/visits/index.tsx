import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navigation from '../../components/Navigation'
import { VisitAttendance } from '../../types'
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns'
import { useAttendanceByDateQuery, useMarkAttendance } from '../../hooks/useAttendanceQuery'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { staggerContainer, staggerItem } from '../../lib/animations'
import { PullToRefresh } from '../../components/PullToRefresh'
import { toast } from '../../hooks/use-toast'

export default function VisitManager() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateInputValue, setDateInputValue] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set()) // Attendance record IDs
  
  // Use attendance query for the selected date
  const { data: attendanceRecords = [], isLoading } = useAttendanceByDateQuery(selectedDate)
  const markAttendanceMutation = useMarkAttendance()

  const handleSelectVisit = (attendanceId: string) => {
    const newSelected = new Set(selectedVisits)
    if (newSelected.has(attendanceId)) {
      newSelected.delete(attendanceId)
    } else {
      newSelected.add(attendanceId)
    }
    setSelectedVisits(newSelected)
  }

  const handleMarkCompleted = async () => {
    if (selectedVisits.size === 0 || !user) return

    try {
      await markAttendanceMutation.mutateAsync({
        attendanceIds: Array.from(selectedVisits),
        status: 'completed',
        markedBy: user.id
      })
      
      setSelectedVisits(new Set())
      toast({
        title: 'Success',
        description: `${selectedVisits.size} visit(s) marked as completed`,
      })
    } catch (error) {
      console.error('Error updating visits:', error)
      toast({
        title: 'Error',
        description: 'Failed to update visits',
        variant: 'destructive',
      })
    }
  }

  // Transform attendance records to individual visits for display
  interface IndividualVisit {
    id: string
    attendanceId: string
    patientId: string
    patientName: string
    service: string
    time: Date
    status: 'pending' | 'completed' | 'missed'
  }

  // First, deduplicate attendance records (same patient, date, and time)
  const uniqueRecords = attendanceRecords.filter((record, index, self) => 
    index === self.findIndex(r => 
      r.patient_id === record.patient_id &&
      r.scheduled_date === record.scheduled_date &&
      r.scheduled_time === record.scheduled_time
    )
  )

  const individualVisits: IndividualVisit[] = uniqueRecords
    .filter(record => {
      // Only show pending or completed visits (not missed unless we want to show them)
      return record.status === 'pending' || record.status === 'completed'
    })
    .map(record => {
      const patient = record.patient || { name: 'Unknown', service: 'Unknown' }
      const scheduledDateTime = record.scheduled_time
        ? parseISO(`${record.scheduled_date}T${record.scheduled_time}`)
        : parseISO(record.scheduled_date)
      
      return {
        id: record.id,
        attendanceId: record.id,
        patientId: record.patient_id,
        patientName: patient.name || 'Unknown',
        service: patient.service || 'Unknown',
        time: scheduledDateTime,
        status: record.status
      }
    })
    .sort((a, b) => a.time.getTime() - b.time.getTime()) // Sort by time

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
    } else {
      setSelectedVisits(new Set(individualVisits.map(v => v.id)))
    }
  }

  if (isLoading) return <div>Loading...</div>

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
            disabled={selectedVisits.size === 0 || markAttendanceMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {markAttendanceMutation.isPending ? 'Updating...' : `Mark ${selectedVisits.size} Visit${selectedVisits.size !== 1 ? 's' : ''} as Completed`}
          </button>
        </div>

        {/* Timeline of Visits for Selected Date */}
        <PullToRefresh
          onRefresh={async () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
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
                            onChange={() => handleSelectVisit(visit.attendanceId)}
                            disabled={visit.status === 'completed'}
                            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">{visit.patientName}</h3>
                                <p className="text-sm text-gray-600 mt-1">Service: {visit.service}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                  visit.status === 'completed'
                                    ? 'bg-green-200 text-green-900'
                                    : isSelected
                                    ? 'bg-blue-200 text-blue-900'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {format(visit.time, 'h:mm a')}
                                </span>
                                {visit.status === 'completed' && (
                                  <span className="text-xs text-green-700 font-medium">✓ Completed</span>
                                )}
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