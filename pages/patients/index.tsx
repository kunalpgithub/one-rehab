import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navigation from '../../components/Navigation'
import { Patient, ScheduledVisit } from '../../types'
import { format, parseISO, isAfter, isBefore, isSameDay } from 'date-fns'
import { usePatients } from '../../hooks/usePatients'
import { visitsStorage } from '../../utils/storage'

export default function PatientsManager() {
  const router = useRouter()
  const { patients, loading: patientsLoading } = usePatients()
  const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVisits()
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

  // Refresh visits when page becomes visible
  useEffect(() => {
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

  // Get visit schedules for each patient
  const patientsWithSchedules = patients.map(patient => {
    const patientVisits = scheduledVisits.filter(v => v.patientId === patient.id)
    
    // Get upcoming visits (future dates)
    const upcomingVisits = patientVisits.flatMap(visit => 
      visit.generatedDates
        .filter(date => {
          const visitDate = parseISO(date)
          return isAfter(visitDate, new Date()) || isSameDay(visitDate, new Date())
        })
        .map(date => parseISO(date))
    ).sort((a, b) => a.getTime() - b.getTime())

    // Get past visits
    const pastVisits = patientVisits.flatMap(visit => 
      visit.generatedDates
        .filter(date => {
          const visitDate = parseISO(date)
          return isBefore(visitDate, new Date())
        })
        .map(date => parseISO(date))
    ).sort((a, b) => b.getTime() - a.getTime())

    // Get next visit
    const nextVisit = upcomingVisits[0]

    // Get visit schedule summary
    const scheduleSummary = patientVisits.map(visit => ({
      frequency: visit.frequency,
      visitsPerPeriod: visit.visitsPerPeriod,
      startDate: visit.startDate,
      endDate: visit.endDate,
      totalScheduled: visit.generatedDates.length,
      remaining: visit.generatedDates.filter(date => {
        const visitDate = parseISO(date)
        return isAfter(visitDate, new Date()) || isSameDay(visitDate, new Date())
      }).length
    }))

    return {
      patient,
      patientVisits,
      upcomingVisits,
      pastVisits,
      nextVisit,
      scheduleSummary,
      totalUpcoming: upcomingVisits.length,
      totalPast: pastVisits.length
    }
  })

  if (loading || patientsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Patients - One Rehab</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Patients</h1>
            <Link
              href="/visits/add"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base text-center inline-block"
            >
              + Add Patient & Visit
            </Link>
          </div>

          {patientsWithSchedules.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600 text-lg mb-2">No patients found</p>
              <p className="text-gray-500 text-sm mb-4">Get started by adding your first patient and visit schedule.</p>
              <Link
                href="/visits/add"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add Patient & Visit
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {patientsWithSchedules.map(({ patient, nextVisit, scheduleSummary, totalUpcoming, totalPast }) => (
                <div
                  key={patient.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{patient.name}</h3>
                          <p className="text-gray-600 mb-2">Service: {patient.service}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              Last Visit: {patient.lastVisit ? format(parseISO(patient.lastVisit), 'MMM d, yyyy') : 'N/A'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              patient.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {patient.status || 'pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Visit Schedule Summary */}
                      {scheduleSummary.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700">Visit Schedules:</h4>
                          {scheduleSummary.map((schedule, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-md p-3 text-sm">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">
                                  {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}
                                </span>
                                <span className="text-gray-600">
                                  ({schedule.visitsPerPeriod} per {schedule.frequency === 'daily' ? 'day' : schedule.frequency === 'weekly' ? 'week' : 'month'})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-gray-600">
                                <span>Start: {format(parseISO(schedule.startDate), 'MMM d, yyyy')}</span>
                                {schedule.endDate && (
                                  <span>End: {format(parseISO(schedule.endDate), 'MMM d, yyyy')}</span>
                                )}
                                <span>Total: {schedule.totalScheduled} visits</span>
                                <span className="text-blue-600 font-medium">
                                  Remaining: {schedule.remaining} visits
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Next Visit */}
                      {nextVisit && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Next Visit:</span>{' '}
                            <span className="text-blue-600 font-semibold">
                              {format(nextVisit, 'EEEE, MMMM d, yyyy')} at {format(nextVisit, 'h:mm a')}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Visit Statistics */}
                      <div className="mt-4 flex gap-4 text-sm">
                        {totalUpcoming > 0 && (
                          <span className="text-gray-600">
                            <span className="font-medium text-blue-600">{totalUpcoming}</span> upcoming visits
                          </span>
                        )}
                        {totalPast > 0 && (
                          <span className="text-gray-600">
                            <span className="font-medium text-gray-600">{totalPast}</span> past visits
                          </span>
                        )}
                        {totalUpcoming === 0 && totalPast === 0 && scheduleSummary.length === 0 && (
                          <span className="text-gray-500 italic">No visits scheduled</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:flex-shrink-0">
                      <Link
                        href={`/visits/add?patientId=${patient.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm text-center"
                      >
                        Add Visit
                      </Link>
                      <button
                        onClick={() => router.push(`/visits?date=${format(new Date(), 'yyyy-MM-dd')}`)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                      >
                        View Visits
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


