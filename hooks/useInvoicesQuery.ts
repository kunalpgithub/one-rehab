import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Invoice } from '@/types'
import { invoicesStorage } from '@/utils/storage'

const INVOICES_QUERY_KEY = ['invoices']

// Fetch invoices from localStorage
async function fetchInvoices(): Promise<Invoice[]> {
  return invoicesStorage.getAll()
}

// Create invoice
async function createInvoice(invoice: Invoice): Promise<Invoice> {
  if (invoicesStorage.add(invoice)) {
    return invoice
  }
  throw new Error('Failed to create invoice')
}

// Update invoice
async function updateInvoice({ id, updates }: { id: string; updates: Partial<Invoice> }): Promise<Invoice> {
  const invoices = invoicesStorage.getAll()
  const invoice = invoices.find(i => i.id === id)
  if (!invoice) {
    throw new Error('Invoice not found')
  }
  const updated = { ...invoice, ...updates }
  if (invoicesStorage.update(id, updated)) {
    return updated
  }
  throw new Error('Failed to update invoice')
}

// Delete invoice
async function deleteInvoice(id: string): Promise<void> {
  if (!invoicesStorage.delete(id)) {
    throw new Error('Failed to delete invoice')
  }
}

export function useInvoicesQuery() {
  return useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: fetchInvoices,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

