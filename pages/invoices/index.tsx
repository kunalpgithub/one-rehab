import { useState, useEffect } from 'react'
import Head from 'next/head'
import { format, differenceInDays } from 'date-fns'

interface ServiceRate {
  name: string
  rate: number
}

interface PatientInvoice {
  id: string
  name: string
  service: string
  lastInvoiceDate: string
  lastVisit: string
  totalDays: number
  attendedDays: number
  missedDays: number
  serviceRate: number
  totalAmount: number
}

interface Patient {
  id: string
  name: string
  service: string
  lastInvoiceDate: string
  lastVisit: string
  visits: Array<{ date: string; attended: boolean }>
}

const SERVICE_RATES: ServiceRate[] = [
  { name: 'Physical Therapy', rate: 75 },
  { name: 'Occupational Therapy', rate: 85 },
  { name: 'Speech Therapy', rate: 90 },
  { name: 'Rehabilitation', rate: 100 }
]

export default function Invoices() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [invoices, setInvoices] = useState<PatientInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients/active')
      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }
      const data = await response.json()
      setPatients(data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateInvoice = (patient: Patient): PatientInvoice => {
    const serviceRate = SERVICE_RATES.find(rate => rate.name === patient.service)?.rate || 0
    const totalDays = differenceInDays(new Date(), new Date(patient.lastInvoiceDate))
    const attendedDays = patient.visits.filter(visit => visit.attended).length
    const missedDays = patient.visits.filter(visit => !visit.attended).length

    return {
      id: patient.id,
      name: patient.name,
      service: patient.service,
      lastInvoiceDate: patient.lastInvoiceDate,
      lastVisit: patient.lastVisit,
      totalDays,
      attendedDays,
      missedDays,
      serviceRate,
      totalAmount: attendedDays * serviceRate
    }
  }

  const handleGenerateInvoices = async () => {
    setGenerating(true)
    try {
      const selectedInvoices = patients
        .filter(patient => selectedPatients.has(patient.id))
        .map(calculateInvoice)

      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoices: selectedInvoices }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate invoices')
      }

      setInvoices(selectedInvoices)
    } catch (error) {
      console.error('Error generating invoices:', error)
    } finally {
      setGenerating(false)
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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <>
      <Head>
        <title>Invoice Generation - One Rehab</title>
      </Head>
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Generation</h1>
          <div className="space-x-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {selectedPatients.size === patients.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleGenerateInvoices}
              disabled={selectedPatients.size === 0 || generating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Invoices'}
            </button>
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedPatients.size === patients.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Invoice
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map(patient => (
                <tr key={patient.id} className={selectedPatients.has(patient.id) ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPatients.has(patient.id)}
                      onChange={() => handleSelectPatient(patient.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.service}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(patient.lastInvoiceDate), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Generated Invoices */}
        {invoices.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generated Invoices</h2>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Attended
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Missed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.service}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.attendedDays}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.missedDays}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${invoice.serviceRate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${invoice.totalAmount.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">Total:</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        ${invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}