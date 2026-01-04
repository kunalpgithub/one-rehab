import { useState } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { format, parseISO, isAfter, isBefore, isSameDay } from 'date-fns'
import Navigation from '../../components/Navigation'
import { usePatientsQuery } from '../../hooks/usePatientsQuery'
import { useVisitsQuery } from '../../hooks/useVisitsQuery'
import { useInvoicesQuery, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from '../../hooks/useInvoicesQuery'
import { Patient, ScheduledVisit, Invoice } from '../../types'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { PullToRefresh } from '../../components/PullToRefresh'
import { staggerContainer, staggerItem } from '../../lib/animations'
import { toast } from '../../hooks/use-toast'

export default function Invoices() {
  const { data: patients = [], isLoading: patientsLoading } = usePatientsQuery()
  const { data: scheduledVisits = [], isLoading: visitsLoading } = useVisitsQuery()
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoicesQuery()
  const createInvoiceMutation = useCreateInvoice()
  const updateInvoiceMutation = useUpdateInvoice()
  const deleteInvoiceMutation = useDeleteInvoice()
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [ratePerVisit, setRatePerVisit] = useState<number>(75)

  const loading = patientsLoading || visitsLoading || invoicesLoading

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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No visits found for this patient in the selected date range',
      })
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

    // Save using mutation
    createInvoiceMutation.mutate(newInvoice, {
      onSuccess: () => {
        // Reset form
        setSelectedPatientId('')
        setStartDate('')
        setEndDate('')
        setRatePerVisit(75)
        setShowAddForm(false)
        setErrors({})
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Invoice created successfully',
        })
      },
      onError: (error) => {
        setErrors({ submit: error.message || 'Failed to save invoice' })
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create invoice',
        })
      },
    })
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate(invoiceId, {
        onSuccess: () => {
          toast({
            variant: 'success',
            title: 'Success',
            description: 'Invoice deleted successfully',
          })
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete invoice',
          })
        },
      })
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

    updateInvoiceMutation.mutate(
      { id: invoiceId, updates: updatedInvoice },
      {
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update invoice',
          })
        },
      }
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Invoices</h1>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>+ Create Invoice</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="patient">Patient *</Label>
                    <Select
                      value={selectedPatientId}
                      onValueChange={(value) => setSelectedPatientId(value)}
                    >
                      <SelectTrigger className={errors.selectedPatientId ? 'border-destructive' : ''}>
                        <SelectValue placeholder="-- Select a patient --" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(patient => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} - {patient.service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.selectedPatientId && (
                      <p className="mt-1 text-sm text-destructive">{errors.selectedPatientId}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={errors.startDate ? 'border-destructive' : ''}
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-destructive">{errors.startDate}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        type="date"
                        id="endDate"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={errors.endDate ? 'border-destructive' : ''}
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-destructive">{errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ratePerVisit">Rate per Visit ($) *</Label>
                    <Input
                      type="number"
                      id="ratePerVisit"
                      min="0"
                      step="0.01"
                      value={ratePerVisit}
                      onChange={(e) => setRatePerVisit(parseFloat(e.target.value) || 0)}
                      placeholder="75.00"
                      className={errors.ratePerVisit ? 'border-destructive' : ''}
                    />
                    {errors.ratePerVisit && (
                      <p className="mt-1 text-sm text-destructive">{errors.ratePerVisit}</p>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="rounded-md bg-destructive/10 p-3">
                      <p className="text-sm text-destructive">{errors.submit}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateInvoice} disabled={createInvoiceMutation.isPending}>
                      {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Invoices List */}
          <PullToRefresh
            onRefresh={async () => {
              // TanStack Query will automatically refetch
            }}
          >
            {invoices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg border border-gray-200 p-8 text-center"
              >
                <p className="text-gray-600 text-lg mb-2">No invoices created yet</p>
                <p className="text-gray-500 text-sm">Create your first invoice by clicking the &quot;Create Invoice&quot; button above.</p>
              </motion.div>
            ) : (
              <motion.div
                initial="initial"
                animate="animate"
                variants={staggerContainer}
                className="space-y-4"
              >
                {invoices.map(invoice => (
                  <motion.div key={invoice.id} variants={staggerItem}>
                    <Card>
                      <CardContent className="p-6">
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      disabled={deleteInvoiceMutation.isPending}
                    >
                      {deleteInvoiceMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
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
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Grand Total */}
                {invoices.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 rounded-lg border border-blue-200 p-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </PullToRefresh>
        </div>
      </div>
    </>
  )
}
