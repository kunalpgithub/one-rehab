import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ScheduledVisit, CreateVisitRequest } from '@/types'
import { visitsApi } from '@/services/api/visits'

const VISITS_QUERY_KEY = ['visits']

export function useVisitsQuery(visitorId?: string) {
  return useQuery({
    queryKey: [...VISITS_QUERY_KEY, visitorId ?? 'all'],
    queryFn: () => visitsApi.getAll(visitorId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateVisit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (visit: CreateVisitRequest) => visitsApi.createSchedule(visit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export function useUpdateVisit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<ScheduledVisit, 'id' | 'created_at'>> }) =>
      visitsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export function useDeleteVisit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => visitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

