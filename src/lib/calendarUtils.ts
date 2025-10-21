export type CalendarType = 'google' | 'apple' | 'outlook' | 'office365' | 'yahoo'

interface CalendarEvent {
  title: string
  description: string
  startDate: Date
  address?: string
  url?: string
}

// Format date for different calendar services
function formatDate(date: Date, format: 'google' | 'ics'): string {
  if (format === 'google') {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// Generate Google Calendar URL
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const endDate = new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description + (event.url ? `\n\nEvent Link: ${event.url}` : ''),
    dates: `${formatDate(event.startDate, 'google')}/${formatDate(endDate, 'google')}`,
    ...(event.address && { location: event.address }),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Generate Outlook.com URL
export function getOutlookUrl(event: CalendarEvent): string {
  const endDate = new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description + (event.url ? `\n\nEvent Link: ${event.url}` : ''),
    startdt: event.startDate.toISOString(),
    enddt: endDate.toISOString(),
    ...(event.address && { location: event.address }),
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

// Generate Office 365 URL
export function getOffice365Url(event: CalendarEvent): string {
  const endDate = new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description + (event.url ? `\n\nEvent Link: ${event.url}` : ''),
    startdt: event.startDate.toISOString(),
    enddt: endDate.toISOString(),
    ...(event.address && { location: event.address }),
  })
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`
}

// Generate Yahoo Calendar URL
export function getYahooCalendarUrl(event: CalendarEvent): string {
  const endDate = new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    desc: event.description + (event.url ? `\n\nEvent Link: ${event.url}` : ''),
    st: formatDate(event.startDate, 'google'),
    et: formatDate(endDate, 'google'),
    ...(event.address && { in_loc: event.address }),
  })
  return `https://calendar.yahoo.com/?${params.toString()}`
}

// Generate ICS file content for Apple Calendar and other native calendar apps
export function generateICS(event: CalendarEvent): string {
  const endDate = new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpenOutings//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(event.startDate, 'ics')}`,
    `DTEND:${formatDate(endDate, 'ics')}`,
    `DTSTAMP:${formatDate(new Date(), 'ics')}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}${event.url ? `\\n\\nEvent Link: ${event.url}` : ''}`,
    event.address ? `LOCATION:${event.address}` : '',
    `UID:${Date.now()}@openoutings.com`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')
  
  return icsContent
}

// Generate data URL for ICS file (for Apple Calendar)
export function getICSDataUrl(event: CalendarEvent): string {
  const icsContent = generateICS(event)
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`
}

// Get calendar URL based on type
export function getCalendarUrl(event: CalendarEvent, type: CalendarType): string {
  switch (type) {
    case 'google':
      return getGoogleCalendarUrl(event)
    case 'outlook':
      return getOutlookUrl(event)
    case 'office365':
      return getOffice365Url(event)
    case 'yahoo':
      return getYahooCalendarUrl(event)
    case 'apple':
      return getICSDataUrl(event)
    default:
      return getGoogleCalendarUrl(event)
  }
}
