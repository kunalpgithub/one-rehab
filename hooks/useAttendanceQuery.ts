import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '@/services/api/attendance'
import { visitsApi } from '@/services/api/visits'

const ATTENDANCE_QUERY_KEY = ['attendance']
const SCHEDULE_SLOTS_QUERY_KEY = ['schedule-slots']

export function useAttendanceByDateQuery(date: Date, visitorId?: string) {
  return useQuery({
    queryKey: [...ATTENDANCE_QUERY_KEY, 'date', date.toISOString().split('T')[0], visitorId ?? 'all'],
    queryFn: () => attendanceApi.getByDate(date, visitorId),
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates for today's visits)
  })
}

export function useAttendanceByPatientQuery(patientId: string) {
  return useQuery({
    queryKey: [...ATTENDANCE_QUERY_KEY, 'patient', patientId],
    queryFn: () => attendanceApi.getByPatient(patientId),
    enabled: !!patientId,
  })
}

export function useAttendanceByDateRangeQuery(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [...ATTENDANCE_QUERY_KEY, 'range', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    queryFn: () => attendanceApi.getByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export function useScheduleSlotsForDateQuery(date: Date, visitorId?: string) {
  return useQuery({
    queryKey: [...SCHEDULE_SLOTS_QUERY_KEY, date.toISOString().split('T')[0], visitorId ?? 'all'],
    queryFn: () => visitsApi.getSlotsForDate(date, visitorId),
    staleTime: 1000 * 60 * 2,
  })
}

export function useMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      items,
      status,
      markedBy,
    }: {
      items: Array<
        | { id: string }
        | { patientId: string; visitorId: string; scheduledDate: string; scheduledTime?: string }
      >
      status: 'completed' | 'missed'
      markedBy: string
    }) => attendanceApi.markAttendance(items, status, markedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-slots'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

