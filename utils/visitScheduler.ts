import { VisitFrequency, TimeSlot } from '../types'
import { addDays, addWeeks, addMonths, startOfWeek, parseISO, isAfter, isBefore, getDay, setHours, setMinutes } from 'date-fns'

/**
 * Generates visit dates based on frequency, visits per period, and time slots
 */
export function generateVisitDates(
  frequency: VisitFrequency,
  visitsPerPeriod: number,
  startDate: string,
  timeSlots: TimeSlot[],
  endDate?: string,
  occurrences?: number
): string[] {
  const start = parseISO(startDate)
  const end = endDate ? parseISO(endDate) : null
  const dates: Date[] = []
  
  // If occurrences is provided, it means number of periods (days/weeks/months)
  // If endDate is provided, use that instead
  const maxPeriods = occurrences || (end ? null : 100) // Default to 100 if no end date or occurrences
  let periodCount = 0

  if (frequency === 'daily') {
    // Use provided time slots for each day
    let dayCount = 0
    
    while (true) {
      const baseDate = addDays(start, dayCount)
      
      // Check if we've exceeded the end date or max periods
      if (end && isAfter(baseDate, end)) break
      if (maxPeriods && periodCount >= maxPeriods) break
      
      // Apply each time slot to this day
      for (const timeSlot of timeSlots) {
        const [hours, minutes] = timeSlot.time.split(':').map(Number)
        const visitDate = new Date(baseDate)
        visitDate.setHours(hours, minutes, 0, 0)
        dates.push(new Date(visitDate))
      }
      
      periodCount++
      dayCount++
    }
  } else if (frequency === 'weekly') {
    // Use provided day of week and time slots
    let weekOffset = 0
    
    while (true) {
      // Check if we've exceeded the end date or max periods
      if (end && isAfter(addWeeks(start, weekOffset + 1), end)) break
      if (maxPeriods && periodCount >= maxPeriods) break
      
      // Get the start of the week (Sunday) for this week
      const weekStartDate = weekOffset === 0 ? new Date(start) : addWeeks(start, weekOffset)
      const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 0 })
      
      // For each time slot, find the day of week in this week
      for (const timeSlot of timeSlots) {
        if (timeSlot.dayOfWeek === undefined) continue
        
        // Calculate the date for this day of week
        const visitDate = addDays(weekStart, timeSlot.dayOfWeek)
        
        // Skip if before start date
        if (weekOffset === 0 && isBefore(visitDate, start)) continue
        if (end && isAfter(visitDate, end)) break
        
        // Apply time
        const [hours, minutes] = timeSlot.time.split(':').map(Number)
        visitDate.setHours(hours, minutes, 0, 0)
        dates.push(new Date(visitDate))
      }
      
      periodCount++
      weekOffset++
    }
  } else if (frequency === 'monthly') {
    // Use provided day of month and time slots
    let monthOffset = 0
    
    while (true) {
      const currentMonthStart = addMonths(start, monthOffset)
      
      // Check if we've exceeded the end date or max periods
      if (end && isAfter(addMonths(start, monthOffset + 1), end)) break
      if (maxPeriods && periodCount >= maxPeriods) break
      
      const daysInMonth = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0).getDate()
      
      // For each time slot, create visit on the specified day of month
      for (const timeSlot of timeSlots) {
        if (timeSlot.dayOfMonth === undefined) continue
        
        // Ensure day of month doesn't exceed days in month
        const dayOfMonth = Math.min(timeSlot.dayOfMonth, daysInMonth)
        const visitDate = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), dayOfMonth)
        
        if (isBefore(visitDate, start)) continue
        if (end && isAfter(visitDate, end)) break
        
        // Apply time
        const [hours, minutes] = timeSlot.time.split(':').map(Number)
        visitDate.setHours(hours, minutes, 0, 0)
        dates.push(new Date(visitDate))
      }
      
      periodCount++
      monthOffset++
    }
  }

  // Sort dates and remove duplicates
  return dates
    .sort((a, b) => a.getTime() - b.getTime())
    .map(date => date.toISOString())
    .filter((date, index, self) => self.indexOf(date) === index)
}

