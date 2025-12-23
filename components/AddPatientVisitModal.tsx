import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Patient, User, ServiceType, VisitFrequency, CreatePatientRequest, CreateVisitRequest } from '../types'

interface AddPatientVisitModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  existingPatients: Patient[]
}

type FormMode = 'existing' | 'new'

const SERVICES: ServiceType[] = ['Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Rehabilitation']
const FREQUENCIES: VisitFrequency[] = ['daily', 'weekly', 'monthly']

export default function AddPatientVisitModal({
  isOpen,
  onClose,
  onSuccess,
  existingPatients
}: AddPatientVisitModalProps) {
  const { user } = useAuth()
  const [mode, setMode] = useState<FormMode>('existing')
  const [loading, setLoading] = useState(false)
  const [firmUsers, setFirmUsers] = useState<User[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Patient form fields
  const [patientName, setPatientName] = useState('')
  const [patientService, setPatientService] = useState<ServiceType>('Physical Therapy')
  const [selectedPatientId, setSelectedPatientId] = useState('')

  // Visit form fields
  const [visitorType, setVisitorType] = useState<'current' | 'other'>('current')
  const [selectedVisitorId, setSelectedVisitorId] = useState('')
  const [frequency, setFrequency] = useState<VisitFrequency>('weekly')
  const [visitsPerPeriod, setVisitsPerPeriod] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDateType, setEndDateType] = useState<'date' | 'occurrences'>('date')
  const [endDate, setEndDate] = useState('')
  const [occurrences, setOccurrences] = useState(4)

  useEffect(() => {
    if (isOpen) {
      // Fetch firm users
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setFirmUsers(data))
        .catch(err => console.error('Error fetching users:', err))

      // Set default start date to today
      const today = new Date().toISOString().split('T')[0]
      setStartDate(today)

      // Set default visitor to current user
      if (user) {
        setSelectedVisitorId(user.id)
      }
    }
  }, [isOpen, user])

  const resetForm = () => {
    setMode('existing')
    setPatientName('')
    setPatientService('Physical Therapy')
    setSelectedPatientId('')
    setVisitorType('current')
    setSelectedVisitorId(user?.id || '')
    setFrequency('weekly')
    setVisitsPerPeriod(1)
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDateType('date')
    setEndDate('')
    setOccurrences(4)
    setErrors({})
  }

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
        const patientRequest: CreatePatientRequest = {
          name: patientName,
          service: patientService
        }

        const patientResponse = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientRequest)
        })

        if (!patientResponse.ok) {
          throw new Error('Failed to create patient')
        }

        const newPatient = await patientResponse.json()
        patientId = newPatient.id
      }

      // Determine visitor ID
      const visitorId = visitorType === 'current' && user ? user.id : selectedVisitorId

      // Create visit
      const visitRequest: CreateVisitRequest = {
        patientId,
        visitorId,
        frequency,
        visitsPerPeriod,
        startDate,
        ...(endDateType === 'date' ? { endDate } : { occurrences })
      }

      const visitResponse = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitRequest)
      })

      if (!visitResponse.ok) {
        const errorData = await visitResponse.json()
        throw new Error(errorData.message || 'Failed to create visit')
      }

      resetForm()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating patient/visit:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create patient and visit' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Add Patient & Visit</h2>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6">
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
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                <div>
                  <label htmlFor="selectedPatient" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Patient *
                  </label>
                  <select
                    id="selectedPatient"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
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
              {endDateType === 'date' ? (
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
              ) : (
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
                onClick={onClose}
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
    </div>
  )
}

