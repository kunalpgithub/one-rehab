import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Invoice, CreateInvoiceRequest } from '@/types'
import { invoicesApi } from '@/services/api/invoices'

const INVOICES_QUERY_KEY = ['invoices']

export function useInvoicesQuery() {
  return useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: () => invoicesApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (invoice: CreateInvoiceRequest) => invoicesApi.create(invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Invoice, 'id' | 'created_at'>> }) =>
      invoicesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

