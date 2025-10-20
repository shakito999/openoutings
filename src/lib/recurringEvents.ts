export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface RecurringEventConfig {
  startDate: Date
  pattern: RecurrencePattern
  endDate?: Date | null
  maxOccurrences?: number
}

/**
 * Calculate the next occurrence date based on pattern
 */
function getNextOccurrence(currentDate: Date, pattern: RecurrencePattern): Date {
  const next = new Date(currentDate)
  
  switch (pattern) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'biweekly':
      next.setDate(next.getDate() + 14)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    default:
      return next
  }
  
  return next
}

/**
 * Generate array of dates for recurring events
 * Limits to maxOccurrences (default 52) to prevent infinite loops
 */
export function generateRecurringDates(config: RecurringEventConfig): Date[] {
  const { startDate, pattern, endDate, maxOccurrences = 52 } = config
  
  if (pattern === 'none') {
    return [startDate]
  }
  
  const dates: Date[] = [new Date(startDate)]
  let currentDate = new Date(startDate)
  let count = 1
  
  while (count < maxOccurrences) {
    currentDate = getNextOccurrence(currentDate, pattern)
    
    // Check if we've passed the end date
    if (endDate && currentDate > endDate) {
      break
    }
    
    dates.push(new Date(currentDate))
    count++
  }
  
  return dates
}

/**
 * Format recurrence pattern for display
 */
export function formatRecurrencePattern(pattern: RecurrencePattern): string {
  const patterns: Record<RecurrencePattern, string> = {
    none: 'Does not repeat',
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    monthly: 'Monthly'
  }
  return patterns[pattern] || 'Does not repeat'
}
