import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ScheduledVisit } from '@/types'
import { visitsStorage } from '@/utils/storage'

const VISITS_QUERY_KEY = ['visits']

// Fetch visits from localStorage
async function fetchVisits(): Promise<ScheduledVisit[]> {
  return visitsStorage.getAll()
}

// Create visit
async function createVisit(visit: ScheduledVisit): Promise<ScheduledVisit> {
  if (visitsStorage.add(visit)) {
    return visit
  }
  throw new Error('Failed to create visit')
}

// Update visit
async function updateVisit({ id, updates }: { id: string; updates: Partial<ScheduledVisit> }): Promise<ScheduledVisit> {
  const visits = visitsStorage.getAll()
  const visit = visits.find(v => v.id === id)
  if (!visit) {
    throw new Error('Visit not found')
  }
  const updated = { ...visit, ...updates }
  if (visitsStorage.update(id, updated)) {
    return updated
  }
  throw new Error('Failed to update visit')
}

// Delete visit
async function deleteVisit(id: string): Promise<void> {
  if (!visitsStorage.delete(id)) {
    throw new Error('Failed to delete visit')
  }
}

export function useVisitsQuery() {
  return useQuery({
    queryKey: VISITS_QUERY_KEY,
    queryFn: fetchVisits,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateVisit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
    },
  })
}

export function useUpdateVisit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
    },
  })
}

export function useDeleteVisit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
    },
  })
}

