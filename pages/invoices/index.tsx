import { useState, useEffect } from 'react'
import Head from 'next/head'
import { format, parseISO, isAfter, isBefore, isSameDay } from 'date-fns'
import Navigation from '../../components/Navigation'
import { usePatients } from '../../hooks/usePatients'
import { visitsStorage, invoicesStorage } from '../../utils/storage'
import { Patient, ScheduledVisit, Invoice } from '../../types'

export default function Invoices() {
  const { patients, loading: patientsLoading } = usePatients()
  const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [ratePerVisit, setRatePerVisit] = useState<number>(75)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      const visits = visitsStorage.getAll()
      const invoiceData = invoicesStorage.getAll()
      setScheduledVisits(visits)
      setInvoices(invoiceData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedPatientId) {
      newErrors.selectedPatientId = 'Please select a patient'
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (!ratePerVisit || ratePerVisit <= 0) {
      newErrors.ratePerVisit = 'Rate per visit must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateInvoice = () => {
    if (!validateForm()) {
      return
    }

    const patient = patients.find(p => p.id === selectedPatientId)
    if (!patient) {
      setErrors({ submit: 'Patient not found' })
      return
    }

    // Get all visits for this patient within the date range
    const patientVisits = scheduledVisits.filter(v => v.patientId === selectedPatientId)
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    // Collect all visit dates within the range
    const visitsInRange: Array<{ date: string; attended: boolean; rate: number }> = []
    
    patientVisits.forEach(visit => {
      visit.generatedDates.forEach(dateStr => {
        const visitDate = parseISO(dateStr)
        // Check if visit is within range (inclusive)
        if (
          (isAfter(visitDate, start) || isSameDay(visitDate, start)) &&
          (isBefore(visitDate, end) || isSameDay(visitDate, end))
        ) {
          visitsInRange.push({
            date: dateStr,
            attended: true, // Default to attended, can be changed later
            rate: ratePerVisit
          })
        }
      })
    })

    // Sort by date
    visitsInRange.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (visitsInRange.length === 0) {
      setErrors({ submit: 'No visits found for this patient in the selected date range' })
      return
    }

    // Calculate totals
    const attendedVisits = visitsInRange.filter(v => v.attended).length
    const missedVisits = visitsInRange.length - attendedVisits
    const totalAmount = visitsInRange.reduce((sum, visit) => sum + (visit.attended ? visit.rate : 0), 0)

    // Create invoice
    const newInvoice: Invoice = {
      id: `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId: selectedPatientId,
      patientName: patient.name,
      service: patient.service,
      startDate,
      endDate,
      ratePerVisit,
      visits: visitsInRange,
      totalVisits: visitsInRange.length,
      attendedVisits,
      missedVisits,
      totalAmount,
      createdAt: new Date().toISOString()
    }

    // Save to localStorage
    if (invoicesStorage.add(newInvoice)) {
      setInvoices(prev => [...prev, newInvoice])
      
      // Reset form
      setSelectedPatientId('')
      setStartDate('')
      setEndDate('')
      setRatePerVisit(75)
      setShowAddForm(false)
      setErrors({})
    } else {
      setErrors({ submit: 'Failed to save invoice' })
    }
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      if (invoicesStorage.delete(invoiceId)) {
        setInvoices(prev => prev.filter(i => i.id !== invoiceId))
      }
    }
  }

  const handleToggleVisitAttendance = (invoiceId: string, visitIndex: number) => {
    const invoice = invoices.find(i => i.id === invoiceId)
    if (!invoice) return

    const updatedVisits = [...invoice.visits]
    updatedVisits[visitIndex].attended = !updatedVisits[visitIndex].attended

    // Recalculate totals
    const attendedVisits = updatedVisits.filter(v => v.attended).length
    const missedVisits = updatedVisits.length - attendedVisits
    const totalAmount = updatedVisits.reduce((sum, visit) => sum + (visit.attended ? visit.rate : 0), 0)

    const updatedInvoice: Invoice = {
      ...invoice,
      visits: updatedVisits,
      attendedVisits,
      missedVisits,
      totalAmount
    }

    if (invoicesStorage.update(invoiceId, updatedInvoice)) {
      setInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInvoice : i))
    }
  }

  if (loading || patientsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Invoices - One Rehab</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Invoices</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              {showAddForm ? 'Cancel' : '+ Create Invoice'}
            </button>
          </div>

          {/* Add Invoice Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Invoice</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="patient" className="block text-sm font-medium text-gray-700 mb-1">
                    Patient *
                  </label>
                  <select
                    id="patient"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.selectedPatientId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Select a patient --</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.service}
                      </option>
                    ))}
                  </select>
                  {errors.selectedPatientId && (
                    <p className="mt-1 text-sm text-red-600">{errors.selectedPatientId}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.endDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="ratePerVisit" className="block text-sm font-medium text-gray-700 mb-1">
                    Rate per Visit ($) *
                  </label>
                  <input
                    type="number"
                    id="ratePerVisit"
                    min="0"
                    step="0.01"
                    value={ratePerVisit}
                    onChange={(e) => setRatePerVisit(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ratePerVisit ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="75.00"
                  />
                  {errors.ratePerVisit && (
                    <p className="mt-1 text-sm text-red-600">{errors.ratePerVisit}</p>
                  )}
                </div>

                {errors.submit && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateInvoice}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Invoice
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Invoices List */}
          {invoices.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600 text-lg mb-2">No invoices created yet</p>
              <p className="text-gray-500 text-sm">Create your first invoice by clicking the &quot;Create Invoice&quot; button above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map(invoice => (
                <div key={invoice.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{invoice.patientName}</h3>
                      <p className="text-sm text-gray-600">{invoice.service}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Period: {format(parseISO(invoice.startDate), 'MMM d, yyyy')} - {format(parseISO(invoice.endDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {format(parseISO(invoice.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="mt-2 sm:mt-0 px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Visits</p>
                      <p className="text-lg font-semibold text-gray-900">{invoice.totalVisits}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Attended</p>
                      <p className="text-lg font-semibold text-green-600">{invoice.attendedVisits}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Missed</p>
                      <p className="text-lg font-semibold text-red-600">{invoice.missedVisits}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rate per Visit</p>
                      <p className="text-lg font-semibold text-gray-900">${invoice.ratePerVisit.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Visit Details */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Visit Details</h4>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoice.visits.map((visit, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {format(parseISO(visit.date), 'MMM d, yyyy')}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                {format(parseISO(visit.date), 'h:mm a')}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                <button
                                  onClick={() => handleToggleVisitAttendance(invoice.id, idx)}
                                  className={`px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                                    visit.attended
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                  title="Click to toggle attendance"
                                >
                                  {visit.attended ? 'Attended' : 'Missed'}
                                </button>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                ${visit.rate.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                ${visit.attended ? visit.rate.toFixed(2) : '0.00'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${invoice.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Grand Total */}
              {invoices.length > 0 && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
