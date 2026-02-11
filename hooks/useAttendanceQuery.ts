import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '@/services/api/attendance'

const ATTENDANCE_QUERY_KEY = ['attendance']

export function useAttendanceByDateQuery(date: Date) {
  return useQuery({
    queryKey: [...ATTENDANCE_QUERY_KEY, 'date', date.toISOString().split('T')[0]],
    queryFn: () => attendanceApi.getByDate(date),
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

export function useMarkAttendance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      attendanceIds, 
      status, 
      markedBy 
    }: { 
      attendanceIds: string[]
      status: 'completed' | 'missed'
      markedBy: string 
    }) => attendanceApi.markAttendance(attendanceIds, status, markedBy),
    onSuccess: (_, variables) => {
      // Invalidate all attendance queries
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY })
      // Also invalidate visits since attendance affects visit data
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      // Invalidate invoices since attendance affects invoice calculations
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

