import { VisitFrequency } from '../types'
import { addDays, addWeeks, addMonths, startOfWeek, parseISO, isAfter, isBefore } from 'date-fns'

/**
 * Generates visit dates based on frequency and visits per period
 */
export function generateVisitDates(
  frequency: VisitFrequency,
  visitsPerPeriod: number,
  startDate: string,
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
    // Multiple visits per day - spread them throughout the day
    const hoursPerVisit = Math.floor(24 / visitsPerPeriod)
    let dayCount = 0
    
    while (true) {
      const baseDate = addDays(start, dayCount)
      
      // Check if we've exceeded the end date or max periods
      if (end && isAfter(baseDate, end)) break
      if (maxPeriods && periodCount >= maxPeriods) break
      
      for (let i = 0; i < visitsPerPeriod; i++) {
        const visitDate = new Date(baseDate)
        visitDate.setHours(9 + (i * hoursPerVisit), 0, 0, 0) // Start at 9 AM, spread throughout day
        dates.push(new Date(visitDate))
      }
      
      periodCount++
      dayCount++
    }
  } else if (frequency === 'weekly') {
    // Multiple visits per week - spread them evenly throughout the week
    // Calculate interval between visits (e.g., 3 visits = every ~2.3 days, so Mon, Wed, Fri)
    const interval = Math.floor(7 / visitsPerPeriod)
    let weekOffset = 0
    
    while (true) {
      // Check if we've exceeded the end date or max periods
      if (end && isAfter(addWeeks(start, weekOffset + 1), end)) break
      if (maxPeriods && periodCount >= maxPeriods) break
      
      // For each week, calculate visit dates starting from the start date
      const weekBaseDate = weekOffset === 0 
        ? new Date(start)
        : addWeeks(start, weekOffset)
      
      // Generate visits for this week
      for (let i = 0; i < visitsPerPeriod; i++) {
        const visitDate = new Date(weekBaseDate)
        visitDate.setDate(visitDate.getDate() + (i * interval))
        
        // Skip if before start date (for first week)
        if (weekOffset === 0 && isBefore(visitDate, start)) continue
        if (end && isAfter(visitDate, end)) break
        
        visitDate.setHours(10, 0, 0, 0) // 10 AM
        dates.push(new Date(visitDate))
      }
      
      periodCount++
      weekOffset++
    }
  } else if (frequency === 'monthly') {
    // Multiple visits per month - spread them throughout the month
    let monthOffset = 0
    
    while (true) {
      const currentMonthStart = addMonths(start, monthOffset)
      
      // Check if we've exceeded the end date or max periods
      if (end && isAfter(addMonths(start, monthOffset + 1), end)) break
      if (maxPeriods && periodCount >= maxPeriods) break
      
      const daysInMonth = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0).getDate()
      const interval = Math.floor(daysInMonth / (visitsPerPeriod + 1))
      
      for (let i = 1; i <= visitsPerPeriod; i++) {
        const dayOfMonth = i * interval
        const visitDate = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), dayOfMonth)
        
        if (isBefore(visitDate, start)) continue
        if (end && isAfter(visitDate, end)) break
        
        visitDate.setHours(10, 0, 0, 0) // 10 AM
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

