import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navigation from '../../components/Navigation'
import { useAuth } from '../../contexts/AuthContext'
import { Patient, User, ServiceType, VisitFrequency, CreatePatientRequest, CreateVisitRequest, TimeSlot } from '../../types'
import { patientsStorage, visitsStorage } from '../../utils/storage'
import { usePatients } from '../../hooks/usePatients'
import { generateVisitDates } from '../../utils/visitScheduler'

type FormMode = 'existing' | 'new'
type EndDateType = 'date' | 'occurrences' | 'infinite'

const SERVICES: ServiceType[] = ['Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Rehabilitation']
const FREQUENCIES: VisitFrequency[] = ['daily', 'weekly', 'monthly']
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AddVisitPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { patients: existingPatients, addPatient, updatePatient } = usePatients()
  const [mode, setMode] = useState<FormMode>('existing')
  const [loading, setLoading] = useState(false)
  const [firmUsers, setFirmUsers] = useState<User[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Patient form fields
  const [patientName, setPatientName] = useState('')
  const [patientService, setPatientService] = useState<ServiceType>('Physical Therapy')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedService, setSelectedService] = useState<ServiceType>('Physical Therapy')

  // Visit form fields
  const [visitorType, setVisitorType] = useState<'current' | 'other'>('current')
  const [selectedVisitorId, setSelectedVisitorId] = useState('')
  const [frequency, setFrequency] = useState<VisitFrequency>('weekly')
  const [visitsPerPeriod, setVisitsPerPeriod] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDateType, setEndDateType] = useState<EndDateType>('infinite')
  const [endDate, setEndDate] = useState('')
  const [occurrences, setOccurrences] = useState(4)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    // Fetch firm users
    fetch('/api/users')
      .then(res => res.json())
      .then(users => setFirmUsers(users))
      .catch(err => console.error('Error fetching users:', err))

    // Check if patientId is in query params (coming from patients page)
    const patientId = router.query.patientId as string
    if (patientId && existingPatients.find(p => p.id === patientId)) {
      setSelectedPatientId(patientId)
      setMode('existing')
    }

    // Set default start date to today
    const today = new Date().toISOString().split('T')[0]
    setStartDate(today)

    // Set default visitor to current user
    if (user) {
      setSelectedVisitorId(user.id)
    }

    // Initialize default time slot
    setTimeSlots([{ time: '09:00' }])
  }, [user, router.query, existingPatients])

  // Update time slots when visitsPerPeriod or frequency changes
  useEffect(() => {
    if (frequency === 'daily') {
      // For daily, just need time slots (no day selection)
      const newSlots: TimeSlot[] = []
      for (let i = 0; i < visitsPerPeriod; i++) {
        const hour = 9 + (i * 3) // Default: 9 AM, 12 PM, 3 PM, etc.
        newSlots.push({ time: `${hour.toString().padStart(2, '0')}:00` })
      }
      setTimeSlots(newSlots)
    } else if (frequency === 'weekly') {
      // For weekly, need day of week + time
      const newSlots: TimeSlot[] = []
      for (let i = 0; i < visitsPerPeriod; i++) {
        const dayOfWeek = (i + 1) % 7 // Default: Monday, Tuesday, etc.
        newSlots.push({ dayOfWeek, time: '09:00' })
      }
      setTimeSlots(newSlots)
    } else if (frequency === 'monthly') {
      // For monthly, need day of month + time
      const newSlots: TimeSlot[] = []
      for (let i = 0; i < visitsPerPeriod; i++) {
        const dayOfMonth = (i + 1) * 7 // Default: 7th, 14th, 21st, 28th
        newSlots.push({ dayOfMonth, time: '09:00' })
      }
      setTimeSlots(newSlots)
    }
  }, [frequency, visitsPerPeriod])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Patient validation
    if (mode === 'new') {
      if (!patientName.trim()) {
        newErrors.patientName = 'Patient name is required'
      }
      if (!patientService) {
        newErrors.patientService = 'Service is required'
      }
    } else {
      if (!selectedPatientId) {
        newErrors.selectedPatientId = 'Please select a patient'
      }
    }

    // Visit validation
    if (visitorType === 'other' && !selectedVisitorId) {
      newErrors.selectedVisitorId = 'Please select a visitor'
    }

    if (!frequency) {
      newErrors.frequency = 'Frequency is required'
    }

    if (!visitsPerPeriod || visitsPerPeriod < 1) {
      newErrors.visitsPerPeriod = 'Visits per period must be at least 1'
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (endDateType === 'date' && !endDate) {
      newErrors.endDate = 'End date is required'
    } else if (endDateType === 'occurrences' && (!occurrences || occurrences < 1)) {
      newErrors.occurrences = 'Number of occurrences must be at least 1'
    }

    // Date range validation
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    // Time slots validation
    if (timeSlots.length !== visitsPerPeriod) {
      newErrors.timeSlots = `Please configure ${visitsPerPeriod} time slot${visitsPerPeriod > 1 ? 's' : ''}`
    }
    
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i]
      if (!slot.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.time)) {
        newErrors[`timeSlot_${i}`] = 'Please enter a valid time (HH:mm)'
      }
      if (frequency === 'weekly' && (slot.dayOfWeek === undefined || slot.dayOfWeek < 0 || slot.dayOfWeek > 6)) {
        newErrors[`dayOfWeek_${i}`] = 'Please select a day of week'
      }
      if (frequency === 'monthly' && (slot.dayOfMonth === undefined || slot.dayOfMonth < 1 || slot.dayOfMonth > 31)) {
        newErrors[`dayOfMonth_${i}`] = 'Please enter a valid day of month (1-31)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      let patientId = selectedPatientId

      // Create patient if new
      if (mode === 'new') {
        // Generate patient ID (using simple UUID-like approach)
        const newPatient: Patient = {
          id: `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: patientName,
          service: patientService,
          status: 'pending'
        }

        // Save to localStorage
        if (!addPatient(newPatient)) {
          throw new Error('Failed to save patient')
        }
        patientId = newPatient.id
      } else {
        // Update patient service if changed
        if (selectedPatientId) {
          const patient = existingPatients.find(p => p.id === selectedPatientId)
          if (patient && patient.service !== selectedService) {
            updatePatient(selectedPatientId, { service: selectedService })
          }
        }
      }

      // Determine visitor ID
      const visitorId = visitorType === 'current' && user ? user.id : selectedVisitorId

      // Generate visit dates using the scheduler
      const generatedDates = generateVisitDates(
        frequency,
        visitsPerPeriod,
        startDate,
        timeSlots,
        endDateType === 'date' ? endDate : undefined,
        endDateType === 'occurrences' ? occurrences : undefined
      )

      if (generatedDates.length === 0) {
        throw new Error('No visits could be generated with the provided parameters')
      }

      // Create visit object
      const newVisit = {
        id: `visit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        visitorId,
        frequency,
        visitsPerPeriod,
        startDate,
        ...(endDateType === 'date' ? { endDate } : endDateType === 'occurrences' ? { occurrences } : {}),
        timeSlots,
        generatedDates,
        createdAt: new Date().toISOString()
      }

      // Save to localStorage
      if (!visitsStorage.add(newVisit)) {
        throw new Error('Failed to save visit')
      }

      // Update patient's lastVisit when visit is created
      // Use the first generated visit date as the lastVisit
      if (patientId && generatedDates.length > 0) {
        const firstVisitDate = generatedDates[0]
        updatePatient(patientId, { lastVisit: firstVisitDate })
      }

      // Redirect to visits page
      router.push('/visits')
    } catch (error) {
      console.error('Error creating patient/visit:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create patient and visit' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Add Patient & Visit - One Rehab</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          <div className="mb-6">
            <button
              onClick={() => router.push('/visits')}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Visits
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Add Patient & Visit</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Option
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                    mode === 'existing'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Add Visit to Existing Patient</div>
                  <div className="text-sm text-gray-500 mt-1">Select from existing patients</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                    mode === 'new'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Add New Patient with Visit</div>
                  <div className="text-sm text-gray-500 mt-1">Create new patient and schedule visit</div>
                </button>
              </div>
            </div>

            {/* Patient Section */}
            {mode === 'new' ? (
              <div className="mb-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
                <div>
                  <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.patientName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter patient name"
                  />
                  {errors.patientName && (
                    <p className="mt-1 text-sm text-red-600">{errors.patientName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="patientService" className="block text-sm font-medium text-gray-700 mb-1">
                    Service *
                  </label>
                  <select
                    id="patientService"
                    value={patientService}
                    onChange={(e) => setPatientService(e.target.value as ServiceType)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.patientService ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {SERVICES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  {errors.patientService && (
                    <p className="mt-1 text-sm text-red-600">{errors.patientService}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
                <div>
                  <label htmlFor="selectedPatient" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Patient *
                  </label>
                  <select
                    id="selectedPatient"
                    value={selectedPatientId}
                    onChange={(e) => {
                      setSelectedPatientId(e.target.value)
                      // Set service from selected patient
                      const patient = existingPatients.find(p => p.id === e.target.value)
                      if (patient) {
                        setSelectedService(patient.service)
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.selectedPatientId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Select a patient --</option>
                    {existingPatients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.service}
                      </option>
                    ))}
                  </select>
                  {errors.selectedPatientId && (
                    <p className="mt-1 text-sm text-red-600">{errors.selectedPatientId}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="selectedService" className="block text-sm font-medium text-gray-700 mb-1">
                    Service *
                  </label>
                  <select
                    id="selectedService"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.selectedService ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {SERVICES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  {errors.selectedService && (
                    <p className="mt-1 text-sm text-red-600">{errors.selectedService}</p>
                  )}
                </div>
              </div>
            )}

            {/* Visit Section */}
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Visit Information</h3>

              {/* Visitor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visitor *</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visitorType"
                      value="current"
                      checked={visitorType === 'current'}
                      onChange={() => {
                        setVisitorType('current')
                        if (user) setSelectedVisitorId(user.id)
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Me ({user?.name || 'Current User'})
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visitorType"
                      value="other"
                      checked={visitorType === 'other'}
                      onChange={() => setVisitorType('other')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Select from Firm</span>
                  </label>
                </div>
                {visitorType === 'other' && (
                  <select
                    value={selectedVisitorId}
                    onChange={(e) => setSelectedVisitorId(e.target.value)}
                    className={`mt-2 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.selectedVisitorId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Select a visitor --</option>
                    {firmUsers.map((firmUser) => (
                      <option key={firmUser.id} value={firmUser.id}>
                        {firmUser.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.selectedVisitorId && (
                  <p className="mt-1 text-sm text-red-600">{errors.selectedVisitorId}</p>
                )}
              </div>

              {/* Frequency */}
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as VisitFrequency)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.frequency ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.frequency && (
                  <p className="mt-1 text-sm text-red-600">{errors.frequency}</p>
                )}
              </div>

              {/* Visits Per Period */}
              <div>
                <label htmlFor="visitsPerPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                  Visits per {frequency === 'daily' ? 'day' : frequency === 'weekly' ? 'week' : 'month'} *
                </label>
                <input
                  type="number"
                  id="visitsPerPeriod"
                  min="1"
                  value={visitsPerPeriod}
                  onChange={(e) => setVisitsPerPeriod(parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.visitsPerPeriod ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.visitsPerPeriod && (
                  <p className="mt-1 text-sm text-red-600">{errors.visitsPerPeriod}</p>
                )}
              </div>

              {/* Time Slots Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {frequency === 'daily' 
                    ? 'Time Slots (for each day)' 
                    : frequency === 'weekly' 
                    ? 'Day of Week & Time (for each week)'
                    : 'Day of Month & Time (for each month)'} *
                </label>
                <div className="space-y-3">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                      {frequency === 'weekly' && (
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Day of Week</label>
                          <select
                            value={slot.dayOfWeek ?? 1}
                            onChange={(e) => {
                              const newSlots = [...timeSlots]
                              newSlots[index].dayOfWeek = parseInt(e.target.value)
                              setTimeSlots(newSlots)
                            }}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm ${
                              errors[`dayOfWeek_${index}`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            {DAYS_OF_WEEK.map((day, dayIndex) => (
                              <option key={dayIndex} value={dayIndex}>
                                {day}
                              </option>
                            ))}
                          </select>
                          {errors[`dayOfWeek_${index}`] && (
                            <p className="mt-1 text-xs text-red-600">{errors[`dayOfWeek_${index}`]}</p>
                          )}
                        </div>
                      )}
                      {frequency === 'monthly' && (
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Day of Month (1-31)</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={slot.dayOfMonth ?? 1}
                            onChange={(e) => {
                              const newSlots = [...timeSlots]
                              newSlots[index].dayOfMonth = parseInt(e.target.value) || 1
                              setTimeSlots(newSlots)
                            }}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm ${
                              errors[`dayOfMonth_${index}`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors[`dayOfMonth_${index}`] && (
                            <p className="mt-1 text-xs text-red-600">{errors[`dayOfMonth_${index}`]}</p>
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Time (HH:mm)</label>
                        <input
                          type="time"
                          value={slot.time}
                          onChange={(e) => {
                            const newSlots = [...timeSlots]
                            newSlots[index].time = e.target.value
                            setTimeSlots(newSlots)
                          }}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm ${
                            errors[`timeSlot_${index}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`timeSlot_${index}`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`timeSlot_${index}`]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.timeSlots && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeSlots}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              {/* End Date Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date Option</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="endDateType"
                      value="infinite"
                      checked={endDateType === 'infinite'}
                      onChange={() => setEndDateType('infinite')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Infinite (No end date)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="endDateType"
                      value="date"
                      checked={endDateType === 'date'}
                      onChange={() => setEndDateType('date')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">End Date</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="endDateType"
                      value="occurrences"
                      checked={endDateType === 'occurrences'}
                      onChange={() => setEndDateType('occurrences')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Number of Occurrences</span>
                  </label>
                </div>
              </div>

              {/* End Date or Occurrences */}
              {endDateType === 'date' && (
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.endDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                  )}
                </div>
              )}
              {endDateType === 'occurrences' && (
                <div>
                  <label htmlFor="occurrences" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Occurrences *
                  </label>
                  <input
                    type="number"
                    id="occurrences"
                    min="1"
                    value={occurrences}
                    onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.occurrences ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.occurrences && (
                    <p className="mt-1 text-sm text-red-600">{errors.occurrences}</p>
                  )}
                </div>
              )}

              {errors.submit && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-200 pt-4 mt-6">
              <button
                type="button"
                onClick={() => router.push('/visits')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Patient & Visit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

